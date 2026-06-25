// services/payment.js — نظام الدفع الكامل
// يدعم: Stripe · PayPal · دفع يدوي (فودافون/إنستاباي/بنك)
const { createClient } = require('@supabase/supabase-js');
const { config }       = require('../config');
const { sendEmail }    = require('./email');
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// ── شهر تقويمي دقيق (لا انجراف) ──────────────────────────
function addOneCalendarMonth(from = new Date()) {
  const d = new Date(from); const day = d.getDate();
  d.setMonth(d.getMonth() + 1);
  if (d.getDate() !== day) d.setDate(0); // تصحيح الحافة (31 يناير → 28 فبراير)
  return d;
}

const PLANS = {
  basic: { label: 'أساسي / Basic', tokens: 15_000, priceUSD: 9,  priceSAR: 49,  priceEGP: 149 },
  pro:   { label: 'احترافي / Pro', tokens: 999_999, priceUSD: 29, priceSAR: 149, priceEGP: 499 },
};

// خريطة طرق الدفع → تسميات قابلة للعرض للمستخدم
const METHOD_LABELS = {
  admin:    'ترقية يدوية (أدمن)',
  Stripe:   'بطاقة بنكية (Stripe)',
  PayPal:   'PayPal',
  vodafone: 'فودافون كاش',
  etisalat: 'اتصالات كاش',
  orange:   'أورنج كاش',
  instapay: 'إنستاباي',
  bank:     'تحويل بنكي',
};

async function upgradePlan(userId, plan, method, amount, currency = 'USD') {
  const p = PLANS[plan];
  if (!p) throw new Error('خطة غير صالحة');
  const { error } = await supabase.from('users').update({
    plan, tokens_limit: p.tokens, tokens_used: 0,
    next_reset_at: addOneCalendarMonth().toISOString(),
  }).eq('id', userId);
  if (error) throw error;

  // Bug A Fix: تسجيل سجل في payments عند الترقية اليدوية من الأدمن
  if (method === 'admin') {
    await supabase.from('payments').insert({
      user_id:      userId,
      plan,
      amount:       amount || 0,
      currency:     currency || 'SAR',
      method:       'admin',
      status:       'completed',
      confirmed_at: new Date().toISOString(),
    });
  }

  // Bug B Fix: استخدام تسمية قابلة للعرض بدلاً من قيمة method الخام
  const methodLabel = METHOD_LABELS[method] || method;

  const { data: user } = await supabase.from('users').select('email').eq('id', userId).single();
  if (user?.email) await sendEmail(user.email, 'paymentConfirmed', {
    planName: p.label, tokensLimit: p.tokens, amount: `${amount} ${currency}`, method: methodLabel,
  });
  return { success: true, plan, tokens: p.tokens };
}

async function updatePaymentStatus(paymentId, status, extra = {}) {
  await supabase.from('payments').update({
    status, updated_at: new Date().toISOString(), ...extra,
  }).eq('id', paymentId);
}

function getStripe() {
  if (!config.stripeSecret) return null;
  return require('stripe')(config.stripeSecret);
}

async function createStripeSession(userId, plan, currency = 'sar') {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe غير مُهيَّأ — أضف STRIPE_SECRET_KEY');
  const p = PLANS[plan];
  if (!p) throw new Error('خطة غير صالحة');
  const unitAmount = currency === 'sar' ? p.priceSAR * 100 : p.priceUSD * 100;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price_data: {
      currency, unit_amount: unitAmount,
      product_data: { name: `ZIbot — ${p.label}`, description: `${p.tokens.toLocaleString()} توكن/شهر` },
    }, quantity: 1 }],
    mode: 'payment',
    success_url: `${config.frontendUrl}/upgrade?payment=success&session={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${config.frontendUrl}/upgrade?payment=cancelled`,
    metadata: { userId, plan },
    expires_at: Math.floor(Date.now()/1000) + 1800,
  });
  await supabase.from('payments').insert({
    user_id: userId, plan, amount: unitAmount/100, currency: currency.toUpperCase(),
    method: 'stripe', status: 'pending', stripe_session_id: session.id,
  });
  return { url: session.url, sessionId: session.id };
}

async function handleStripeWebhook(rawBody, signature) {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe غير مُهيَّأ');
  if (!config.stripeWebhookSec) throw new Error('STRIPE_WEBHOOK_SECRET مفقود');
  const event = stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSec);

  // ✅ Fix: حماية من Replay Attack — منع معالجة نفس الحدث مرتين
  // stripe.webhooks.constructEvent تتحقق من التوقيع لكنها تقبل إعادة الإرسال في نافذة 5 دقائق
  const { data: alreadyProcessed } = await supabase
    .from('processed_stripe_events')
    .select('id')
    .eq('event_id', event.id)
    .maybeSingle();
  if (alreadyProcessed) return { ignored: true, reason: 'duplicate_event', event_id: event.id };

  // سجّل الحدث قبل المعالجة لمنع race condition (في حال أرسل Stripe طلبين متزامنين)
  const { error: insertErr } = await supabase.from('processed_stripe_events').insert({
    event_id:     event.id,
    event_type:   event.type,
    processed_at: new Date().toISOString(),
  });
  // إذا فشل الإدراج بسبب UNIQUE constraint فهذا يعني حدث آخر سبقنا — تجاهل
  if (insertErr?.code === '23505') return { ignored: true, reason: 'race_condition', event_id: event.id };
  if (insertErr) throw insertErr;

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    if (s.payment_status !== 'paid') return { ignored: true };
    const { userId, plan } = s.metadata;
    const { data: pay } = await supabase.from('payments').select('id,amount,currency').eq('stripe_session_id', s.id).single();
    if (pay) {
      await updatePaymentStatus(pay.id, 'completed', { stripe_payment_intent: s.payment_intent, confirmed_at: new Date().toISOString() });
      await upgradePlan(userId, plan, 'Stripe', pay.amount, pay.currency);
    }
  }
  if (event.type === 'checkout.session.expired') {
    await supabase.from('payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('stripe_session_id', event.data.object.id);
  }
  return { received: true, type: event.type };
}

const PAYPAL_API = config.paypalMode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function getPaypalToken() {
  if (!config.paypalClientId || !config.paypalClientSec) throw new Error('PayPal غير مُهيَّأ');
  const creds = Buffer.from(`${config.paypalClientId}:${config.paypalClientSec}`).toString('base64');
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('PayPal auth فشل');
  return (await res.json()).access_token;
}

async function createPaypalOrder(userId, plan, currency = 'USD') {
  const p = PLANS[plan]; if (!p) throw new Error('خطة غير صالحة');
  const token = await getPaypalToken();
  const amount = currency === 'SAR' ? p.priceSAR : p.priceUSD;
  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': `${userId}-${Date.now()}` },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: String(amount) }, description: `ZIbot ${p.label}`, custom_id: `${userId}|${plan}` }],
      application_context: {
        return_url: `${config.frontendUrl}/upgrade?paypal=return&plan=${plan}`,
        cancel_url: `${config.frontendUrl}/upgrade?payment=cancelled`, user_action: 'PAY_NOW',
      },
    }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'PayPal order فشل'); }
  const order = await res.json();
  const approvalUrl = order.links.find(l => l.rel === 'approve')?.href;
  await supabase.from('payments').insert({ user_id: userId, plan, amount, currency, method: 'paypal', status: 'pending', paypal_order_id: order.id });
  return { orderId: order.id, approvalUrl };
}

async function capturePaypalOrder(orderId) {
  const token = await getPaypalToken();
  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'PayPal capture فشل'); }
  const capture = await res.json();
  if (capture.status !== 'COMPLETED') throw new Error('الدفع لم يكتمل');
  const customId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id || '';
  const [userId, plan] = customId.split('|');
  const { data: pay } = await supabase.from('payments').select('id,amount,currency').eq('paypal_order_id', orderId).single();
  if (pay) await updatePaymentStatus(pay.id, 'completed', { confirmed_at: new Date().toISOString() });
  if (userId && plan) await upgradePlan(userId, plan, 'PayPal', pay?.amount, pay?.currency || 'USD');
  return { success: true };
}

async function submitManualPayment(userId, plan, method, reference, notes = '') {
  const p = PLANS[plan]; if (!p) throw new Error('خطة غير صالحة');
  const { data: ex } = await supabase.from('payments').select('id').eq('user_id', userId).eq('plan', plan).eq('status', 'pending').maybeSingle();
  if (ex) throw new Error('لديك طلب دفع قيد المراجعة بالفعل');
  const amount = ['vodafone','orange','etisalat','instapay'].includes(method) ? p.priceSAR : p.priceUSD;
  const currency = ['vodafone','orange','etisalat','instapay'].includes(method) ? 'SAR' : 'USD';
  const { data: pay, error } = await supabase.from('payments').insert({
    user_id: userId, plan, amount, currency, method, status: 'pending',
    reference: String(reference).slice(0,100), notes: String(notes).slice(0,500),
  }).select().single();
  if (error) throw error;
  const { data: user } = await supabase.from('users').select('email').eq('id', userId).single();
  if (user?.email) await sendEmail(user.email, 'manualPaymentReceived', { planName: p.label, reference, method });
  return { success: true, paymentId: pay.id };
}

async function confirmManualPayment(paymentId, adminId) {
  const { data: pay, error } = await supabase.from('payments').select('*').eq('id', paymentId).single();
  if (error || !pay) throw new Error('الدفع غير موجود');
  if (pay.status !== 'pending') throw new Error('الدفع ليس قيد الانتظار');
  await updatePaymentStatus(paymentId, 'completed', { confirmed_by: adminId, confirmed_at: new Date().toISOString() });
  await upgradePlan(pay.user_id, pay.plan, pay.method, pay.amount, pay.currency);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  Paymob — الدفع التلقائي بالمحفظة (فودافون / اتصالات / أورنج)
// ═══════════════════════════════════════════════════════════
const crypto = require('crypto');
const PAYMOB_BASE = 'https://accept.paymob.com/api';

async function _pmAuth() {
  if (!config.paymobApiKey) throw new Error('PAYMOB_API_KEY غير مُهيَّأ — أضفه في .app_runtime');
  const r = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: config.paymobApiKey }),
  });
  if (!r.ok) throw new Error('Paymob auth فشل');
  return (await r.json()).token;
}

async function _pmCreateOrder(authToken, amountCents, merchantOrderId) {
  const r = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken, delivery_needed: false,
      amount_cents: amountCents, currency: 'EGP',
      merchant_order_id: merchantOrderId, items: [],
    }),
  });
  if (!r.ok) throw new Error('Paymob create order فشل');
  return (await r.json()).id;
}

async function _pmPaymentKey(authToken, orderId, amountCents, phone, email) {
  const r = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken, amount_cents: amountCents,
      expiration: 3600, order_id: orderId,
      billing_data: {
        apartment: 'NA', floor: 'NA', building: 'NA', street: 'NA',
        shipping_method: 'NA', postal_code: 'NA', city: 'NA',
        country: 'EG', state: 'NA',
        email: email || 'customer@zibot.app',
        first_name: 'Customer', last_name: 'ZIbot',
        phone_number: phone,
      },
      currency: 'EGP',
      integration_id: parseInt(config.paymobWalletIntegId, 10),
      lock_order_when_paid: false,
    }),
  });
  if (!r.ok) throw new Error('Paymob payment key فشل');
  return (await r.json()).token;
}

async function _pmInitiateWallet(paymentToken, walletPhone) {
  const r = await fetch(`${PAYMOB_BASE}/acceptance/payments/pay`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: { identifier: walletPhone, subtype: 'WALLET' },
      payment_token: paymentToken,
    }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || e.message || 'Paymob wallet initiate فشل');
  }
  const d = await r.json();
  return d.redirect_url || d.iframe_redirection_url;
}

// ── الدالة العامة: يبدأ عملية الدفع ويُعيد رابط التحويل ──
async function createPaymobWalletPayment(userId, plan, method, walletPhone, contactPhone) {
  if (!config.paymobApiKey || !config.paymobWalletIntegId)
    throw new Error('Paymob غير مُهيَّأ — أضف PAYMOB_API_KEY و PAYMOB_WALLET_INTEG_ID');

  const p = PLANS[plan];
  if (!p) throw new Error('خطة غير صالحة');

  const amountCents    = p.priceEGP * 100;  // EGP cents
  const merchantOrdId  = `zi-${userId.slice(0, 8)}-${Date.now()}`;

  const authToken   = await _pmAuth();
  const orderId     = await _pmCreateOrder(authToken, amountCents, merchantOrdId);

  const { data: user } = await supabase.from('users').select('email').eq('id', userId).single();
  const paymentToken = await _pmPaymentKey(authToken, orderId, amountCents, walletPhone, user?.email);
  const redirectUrl  = await _pmInitiateWallet(paymentToken, walletPhone);

  // حفظ سجل الدفع
  await supabase.from('payments').insert({
    user_id:         userId,
    plan,
    amount:          p.priceEGP,
    currency:        'EGP',
    method,
    status:          'pending',
    paymob_order_id: String(orderId),
    payment_phone:   walletPhone,
    notes:           contactPhone ? `contact:${contactPhone}` : null,
  });

  return { redirectUrl };
}

// ── معالج Webhook من Paymob — يُفعَّل تلقائياً بعد الدفع ──
async function handlePaymobWebhook(body, hmacHeader) {
  if (!config.paymobHmacSecret) throw new Error('PAYMOB_HMAC_SECRET مفقود');

  // التحقق من HMAC (SHA-512)
  const obj = body.obj || {};
  const concatFields = [
    obj.amount_cents, obj.created_at, obj.currency,
    obj.error_occured, obj.has_parent_transaction, obj.id,
    obj.integration_id, obj.is_3d_secure, obj.is_auth,
    obj.is_capture, obj.is_refunded, obj.is_standalone_payment,
    obj.is_voided, obj.order?.id, obj.owner, obj.pending,
    obj.source_data?.pan, obj.source_data?.sub_type,
    obj.source_data?.type, obj.success,
  ].map(v => (v === undefined || v === null) ? '' : String(v)).join('');

  const expected = crypto.createHmac('sha512', config.paymobHmacSecret)
    .update(concatFields).digest('hex');

  if (!hmacHeader) throw new Error('Paymob HMAC مفقود');

  const hmacBuf = Buffer.from(hmacHeader);
  const expBuf  = Buffer.from(expected);
  if (hmacBuf.length !== expBuf.length || !crypto.timingSafeEqual(hmacBuf, expBuf))
    throw new Error('Paymob HMAC غير صحيح');

  if (body.type !== 'TRANSACTION') return { ignored: true, reason: 'not_transaction' };
  if (!obj.success) {
    if (obj.order?.id)
      await supabase.from('payments').update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('paymob_order_id', String(obj.order.id)).eq('status', 'pending');
    return { ignored: true, reason: 'not_successful' };
  }

  // جلب سجل الدفع
  const { data: pay } = await supabase.from('payments').select('*')
    .eq('paymob_order_id', String(obj.order?.id)).eq('status', 'pending').maybeSingle();
  if (!pay) return { ignored: true, reason: 'not_found_or_already_processed' };

  // تأكيد الدفع
  await supabase.from('payments').update({
    status:                'completed',
    paymob_transaction_id: String(obj.id),
    confirmed_at:          new Date().toISOString(),
    updated_at:            new Date().toISOString(),
  }).eq('id', pay.id);

  await upgradePlan(pay.user_id, pay.plan, pay.method, pay.amount, pay.currency);
  return { received: true, plan: pay.plan };
}

function getPaymentMethods() {
  const paymobAvailable = !!(config.paymobApiKey && config.paymobWalletIntegId);
  return {
    stripe:   { available: !!config.stripeSecret,                            label: 'بطاقة بنكية (Stripe)' },
    paypal:   { available: !!(config.paypalClientId&&config.paypalClientSec), label: 'PayPal' },
    paymob:   { available: paymobAvailable, label: 'محفظة إلكترونية (Paymob)' },
    vodafone: { available: paymobAvailable || !!config.vodafoneCash, label: 'فودافون كاش', number: config.vodafoneCash, paymob: paymobAvailable },
    orange:   { available: paymobAvailable || !!config.orangeCash,   label: 'أورنج كاش',   number: config.orangeCash,   paymob: paymobAvailable },
    etisalat: { available: paymobAvailable || !!config.etisalatCash, label: 'اتصالات كاش', number: config.etisalatCash, paymob: paymobAvailable },
    instapay: { available: !!config.instapay,       label: 'إنستاباي',       number: config.instapay },
    bank:     { available: !!config.bankAccount,    label: 'تحويل بنكي',     info: config.bankAccount },
  };
}

module.exports = { PLANS, upgradePlan, createStripeSession, handleStripeWebhook, createPaypalOrder, capturePaypalOrder, submitManualPayment, confirmManualPayment, getPaymentMethods, createPaymobWalletPayment, handlePaymobWebhook };
