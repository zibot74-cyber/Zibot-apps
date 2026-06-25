// services/whatsapp.js — تكامل واتساب الرسمي (Meta WhatsApp Cloud API)
//
// ✅ تمت إزالة Baileys بالكامل (كانت تُحاكي WhatsApp Web → خطر حظر حقيقي من Meta).
// ✅ لا يوجد اتصال دائم (socket) ولا QR — Cloud API عبارة عن REST HTTP عادي
//    عبر fetch، باستخدام رقم هاتف مُسجَّل رسمياً في Meta Business Manager (WABA).
// ✅ أُزيلت كل منطق "محاكاة الإنسان" المعقّد (presence update عشوائي، تقسيم الرد
//    لأجزاء، توقيتات Gaussian...) لأنها كانت تحديداً لتفادي كشف واتساب لحساب غير
//    رسمي. مع القناة الرسمية لا داعٍ لها؛ تم استبدالها بتأخير بسيط فقط (طلب رقم 4).
'use strict';
const QRCode = require('qrcode');

const { createClient } = require('@supabase/supabase-js');
const { checkAndReply } = require('./ai');
const { config }        = require('../config');

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

const GRAPH_VERSION = config.waApiVersion || 'v25.0';
const GRAPH_BASE    = `https://graph.facebook.com/${GRAPH_VERSION}`;

function isConfigured() {
  return !!(config.waToken && config.waPhoneNumberId);
}

const DEFAULT_SETTINGS = {
  business_name: 'ZIbot', description: 'مساعد ذكاء اصطناعي للرد على العملاء',
  tone: 'ودّي ومحترف', dialect: 'مصري',
  products: '', working_hours: '', location: '', custom_rules: '',
};

// ── Rate limit: هذا ليس "anti-ban" — الـ Cloud API رسمي ولا خطر حظر عليه.
// الهدف هنا فقط منع إساءة استخدام تلقائية (نفس شخص يرسل سبام) من استهلاك
// رصيد/تكلفة الذكاء الاصطناعي بسرعة. احذفه إن لم تكن بحاجة له.
const rateMap  = new Map();          // senderId → [timestamps]
const RATE_MAX = 5;                  // أقصى 5 ردود
const RATE_WIN = 60_000;             // خلال دقيقة
function isRateLimited(id) {
  const now  = Date.now();
  const hits = (rateMap.get(id) || []).filter(t => now - t < RATE_WIN);
  if (hits.length >= RATE_MAX) return true;
  rateMap.set(id, [...hits, now]);
  return false;
}

// ── منع معالجة نفس الرسالة مرتين لو أعادت Meta إرسال الـ webhook ──
const processingLock = new Map();    // senderId → timestamp
const LOCK_TTL = 30_000;

setInterval(() => {
  const now = Date.now();
  for (const [id, ts] of processingLock) if (now - ts > LOCK_TTL) processingLock.delete(id);
  for (const [id, arr] of rateMap) {
    const fresh = arr.filter(t => now - t < RATE_WIN);
    fresh.length ? rateMap.set(id, fresh) : rateMap.delete(id);
  }
}, 60_000);


// ════════════════════════════════════════════════════════
//  إرسال الرد كلمة بكلمة (0.1-0.5 ثانية لكل كلمة)
//  يُحاكي تأثير الكتابة الطبيعية في واتساب
// ════════════════════════════════════════════════════════
async function sendTypingAndReply(to, text) {
  // 1. تعليم "جاري القراءة" أولاً (يُفعّل مؤشر الكتابة الضمني)
  // لا يوجد typing status رسمي في Cloud API — نُرسل الرسائل بتأخير يُحاكيه
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return;

  // رسائل صغيرة من 2-3 كلمات لتأثير تدريجي بدون إغراق API
  const CHUNK = 3;
  for (let i = 0; i < words.length; i += CHUNK) {
    const chunk = words.slice(i, i + CHUNK).join(' ');
    await sendWhatsAppMessage(to, chunk);
    if (i + CHUNK < words.length) {
      // تأخير 0.1–0.5 ثانية بين كل مجموعة كلمات
      const delay = 100 + Math.random() * 400;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}



// ════════════════════════════════════════════════════════
//  إرسال رسالة عبر WhatsApp Cloud API
// ════════════════════════════════════════════════════════
async function sendWhatsAppMessage(to, text) {
  if (!isConfigured()) throw new Error('WhatsApp Cloud API غير مُهيأ — تحقق من WA_CLOUD_TOKEN و WA_PHONE_NUMBER_ID');
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(`${GRAPH_BASE}/${config.waPhoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.waToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type:    'individual',
        to,
        type: 'text',
        text: { body: text, preview_url: false },
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error('❌ [WA] فشل إرسال رسالة:', JSON.stringify(data));
      throw new Error(data?.error?.message || 'فشل إرسال رسالة واتساب');
    }
    return await res.json();
  } finally { clearTimeout(timer); }
}

// تعليم رسالة العميل كمقروءة (✓✓ زرقاء) — اختياري، Cloud API يدعمها مباشرة
async function markAsRead(messageId) {
  if (!isConfigured() || !messageId) return;
  try {
    await fetch(`${GRAPH_BASE}/${config.waPhoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${config.waToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: messageId }),
    });
  } catch (e) { console.warn('⚠️ [WA] فشل تعليم الرسالة كمقروءة:', e.message); }
}

// ════════════════════════════════════════════════════════
//  معالجة رسالة واردة من عميل (ضمن نافذة الخدمة 24 ساعة — رد مجاني)
// ════════════════════════════════════════════════════════
async function handleIncoming(senderId, messageText, messageId, incomingPhoneNumberId) {
  if (isRateLimited(senderId)) { console.warn(`[WA] rate-limit: ${senderId}`); return; }

  try {
    markAsRead(messageId).catch(() => {});

    // Fix #6: match incoming webhook to the business whose registered phone_number_id matches.
    // Previously: always picked the first `wa_connected` row → messages routed to wrong tenant
    // if more than one business ever had wa_connected=true (test account, ops mistake, future multi-tenant).
    let businessQuery = supabase.from('businesses').select('*').eq('wa_connected', true);
    if (incomingPhoneNumberId) {
      businessQuery = businessQuery.eq('wa_phone_number_id', incomingPhoneNumberId);
    }
    const { data: businesses, error } = await businessQuery.limit(1);
    const business = businesses?.[0];
    let activeSettings = DEFAULT_SETTINGS, businessId = null, userId = null;

    if (!error && business) {
      activeSettings = { ...DEFAULT_SETTINGS, ...business.settings };
      businessId     = business.id;
      userId         = business.user_id;
    } else {
      const { data: u } = await supabase.from('users').select('id').order('created_at', { ascending: true }).limit(1).single();
      if (u) {
        userId = u.id;
        const { data: b } = await supabase.from('businesses').select('*').eq('user_id', u.id).single();
        if (b) { activeSettings = { ...DEFAULT_SETTINGS, ...b.settings }; businessId = b.id; }
      }
    }

    if (!userId) {
      await new Promise(r => setTimeout(r, 1500));
      await sendWhatsAppMessage(senderId, 'البوت شغال ✅ — يحتاج إعداد أولي.');
      return;
    }

    let history = [];
    if (businessId) {
      const { data: h } = await supabase.from('conversations').select('role, content')
        .eq('user_id', userId).eq('sender_id', senderId)
        .order('created_at', { ascending: false }).limit(10);
      history = (h || []).reverse().map(m => ({ role: m.role, content: m.content }));
    }

    const { reply, usage = 0 } = await checkAndReply(supabase, userId, activeSettings, history, messageText);

    if (businessId) {
      await supabase.from('conversations').insert([
        { user_id: userId, sender_id: senderId, role: 'user',      content: messageText.slice(0,2000), channel: 'whatsapp', tokens_used: 0 },
        { user_id: userId, sender_id: senderId, role: 'assistant', content: reply.slice(0,2000),       channel: 'whatsapp', tokens_used: usage },
      ]);
    }

    // إرسال الرد كلمة بكلمة مع تأخير 0.1–0.5 ثانية (تأثير "جاري الكتابة")
    await sendTypingAndReply(senderId, reply);

  } catch (err) { console.error('[WA] handleIncoming:', err.message); }
}

// ════════════════════════════════════════════════════════
//  استقبال webhook واتساب من Meta (POST /api/whatsapp/webhook)
// ════════════════════════════════════════════════════════
async function processWebhook(body) {
  if (body.object !== 'whatsapp_business_account') return;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};

      // value.statuses تحتوي تحديثات تسليم/قراءة لرسائل أرسلتَها أنت — تُتجاهل حالياً
      for (const msg of value.messages || []) {
        if (msg.type === 'system') continue;
        const senderId = msg.from;
        const text =
          msg.text?.body ||
          msg.button?.text ||
          msg.interactive?.button_reply?.title ||
          msg.interactive?.list_reply?.title;

        if (!senderId || !text) continue;
        if (processingLock.has(senderId)) continue;

        processingLock.set(senderId, Date.now());
        // Fix #6: pass the incoming phone_number_id so handleIncoming can match the right business
        const incomingPhoneNumberId = value.metadata?.phone_number_id || null;
        handleIncoming(senderId, text.trim(), msg.id, incomingPhoneNumberId)
          .catch(e => console.error('[WA] خطأ:', e.message))
          .finally(() => processingLock.delete(senderId));
      }
    }
  }
}

// ════════════════════════════════════════════════════════
//  حالة التكامل — استعلام REST بسيط (لا اتصال دائم لفحصه)
// ════════════════════════════════════════════════════════
async function getStatus() {
  if (!isConfigured()) {
    return { configured: false, connected: false, error: 'متغيرات البيئة غير مكتملة (WA_CLOUD_TOKEN / WA_PHONE_NUMBER_ID)' };
  }
  try {
    const res  = await fetch(
      `${GRAPH_BASE}/${config.waPhoneNumberId}?fields=display_phone_number,verified_name,whatsapp_business_manager_messaging_limit`,
      { headers: { 'Authorization': `Bearer ${config.waToken}` } }
    );
    const data = await res.json();
    if (!res.ok) return { configured: true, connected: false, error: data?.error?.message || 'فشل التحقق من الاعتماديات' };
    return {
      configured:      true,
      connected:       true,
      phone_number:    data.display_phone_number,
      verified_name:   data.verified_name,
      messaging_limit: data.whatsapp_business_manager_messaging_limit,
    };
  } catch (err) { return { configured: true, connected: false, error: err.message }; }
}


// ════════════════════════════════════════════════════════
//  جلب QR الرسمي من Meta (wa_qr) لعرضه للعملاء
//  المصدر: GET /{phone-number-id}?fields=wa_qr,display_phone_number
// ════════════════════════════════════════════════════════
async function getWhatsAppQR() {
  if (!isConfigured()) {
    return { configured: false, error: 'متغيرات البيئة غير مكتملة' };
  }
  try {
    // جلب بيانات الرقم من Meta
    const res  = await fetch(
      `${GRAPH_BASE}/${config.waPhoneNumberId}?fields=display_phone_number,verified_name`,
      { headers: { 'Authorization': `Bearer ${config.waToken}` } }
    );
    const data = await res.json();
    if (!res.ok) return { configured: true, error: data?.error?.message || 'فشل جلب بيانات الرقم' };

    // توليد wa.me link محلياً — يعمل بدون اشتراك Meta مدفوع
    const rawPhone   = (data.display_phone_number || '').replace(/[^0-9]/g, '');
    const waLink     = `https://wa.me/${rawPhone}?text=`;
    const qrImageUrl = await QRCode.toDataURL(waLink, { width: 300, margin: 2 });

    return {
      configured:    true,
      qr_url:        qrImageUrl,
      raw_qr:        waLink,
      phone_number:  data.display_phone_number || null,
      verified_name: data.verified_name        || null,
    };
  } catch (err) {
    return { configured: true, error: err.message };
  }
}

module.exports = { sendWhatsAppMessage, processWebhook, getStatus, getWhatsAppQR, isConfigured };
