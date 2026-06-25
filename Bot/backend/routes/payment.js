// routes/payment.js — API الدفع الكامل
const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createStripeSession, handleStripeWebhook,
  createPaypalOrder, capturePaypalOrder,
  submitManualPayment, getPaymentMethods, PLANS,
  createPaymobWalletPayment,
} = require('../services/payment');
const { createClient } = require('@supabase/supabase-js');
const { config }       = require('../config');
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// ── GET /api/payment/methods — وسائل الدفع المتاحة ──────
router.get('/methods', authMiddleware, (_req, res) => {
  res.json({ methods: getPaymentMethods(), plans: PLANS });
});

// ── GET /api/payment/history — سجل مدفوعاتي ────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('payments')
      .select('id,plan,amount,currency,method,status,reference,created_at,confirmed_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    res.json({ payments: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/payment/stripe/checkout ───────────────────
router.post('/stripe/checkout', authMiddleware, async (req, res) => {
  try {
    const { plan, currency = 'sar' } = req.body;
    if (!['basic','pro'].includes(plan)) return res.status(400).json({ error: 'خطة غير صالحة' });
    const result = await createStripeSession(req.user.id, plan, currency);
    res.json(result);
  } catch (err) {
    console.error('[PAY] Stripe checkout:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Stripe webhook handled directly in server.js (needs rawBody + no rate limit) ──

// ── POST /api/payment/paypal/create ─────────────────────
router.post('/paypal/create', authMiddleware, async (req, res) => {
  try {
    const { plan, currency = 'USD' } = req.body;
    if (!['basic','pro'].includes(plan)) return res.status(400).json({ error: 'خطة غير صالحة' });
    const result = await createPaypalOrder(req.user.id, plan, currency);
    res.json(result);
  } catch (err) {
    console.error('[PAY] PayPal create:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/payment/paypal/capture/:orderId ───────────
router.post('/paypal/capture/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId || orderId.length > 100) return res.status(400).json({ error: 'orderId غير صالح' });

    // ✅ Fix: التحقق من ملكية الطلب — يمنع مستخدماً من التقاط دفع مستخدم آخر
    const { data: ownPayment, error: ownerErr } = await supabase
      .from('payments')
      .select('id, status')
      .eq('paypal_order_id', orderId)
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (ownerErr || !ownPayment)
      return res.status(403).json({ error: 'هذه العملية غير مصرح بها' });
    if (ownPayment.status === 'completed')
      return res.status(409).json({ error: 'تم معالجة هذا الدفع مسبقاً' });

    const result = await capturePaypalOrder(orderId);
    res.json(result);
  } catch (err) {
    console.error('[PAY] PayPal capture:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/payment/manual ─────────────────────────────
router.post('/manual', authMiddleware, async (req, res) => {
  try {
    const { plan, method, reference, notes = '' } = req.body;
    if (!['basic','pro'].includes(plan)) return res.status(400).json({ error: 'خطة غير صالحة' });
    if (!['vodafone','orange','etisalat','instapay','bank'].includes(method)) return res.status(400).json({ error: 'طريقة دفع غير صالحة' });
    if (!reference || typeof reference !== 'string' || reference.trim().length < 3)
      return res.status(400).json({ error: 'رقم المرجع مطلوب' });
    const result = await submitManualPayment(req.user.id, plan, method, reference.trim(), notes);
    res.json(result);
  } catch (err) {
    console.error('[PAY] manual:', err.message);
    res.status(err.message.includes('قيد المراجعة') ? 409 : 500).json({ error: err.message });
  }
});

// ── POST /api/payment/paymob/wallet — دفع تلقائي بالمحفظة ─
router.post('/paymob/wallet', authMiddleware, async (req, res) => {
  try {
    const { plan, method, walletPhone, contactPhone = '' } = req.body;
    if (!['basic','pro'].includes(plan))
      return res.status(400).json({ error: 'خطة غير صالحة' });
    if (!['vodafone','orange','etisalat'].includes(method))
      return res.status(400).json({ error: 'طريقة دفع غير مدعومة بـ Paymob' });
    if (!walletPhone || !/^01[0-9]{9}$/.test(walletPhone.trim()))
      return res.status(400).json({ error: 'رقم المحفظة غير صحيح — يجب 11 رقم يبدأ بـ 01' });

    // منع تكرار طلب قيد الانتظار
    const { data: ex } = await supabase.from('payments')
      .select('id').eq('user_id', req.user.id)
      .eq('plan', plan).eq('status', 'pending').maybeSingle();
    if (ex) return res.status(409).json({ error: 'لديك طلب دفع قيد المعالجة بالفعل' });

    const result = await createPaymobWalletPayment(
      req.user.id, plan, method, walletPhone.trim(), contactPhone.trim()
    );
    res.json(result);
  } catch (err) {
    console.error('[PAY] Paymob wallet:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
