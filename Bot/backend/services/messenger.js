const { checkAndReply } = require('./ai');
const { createClient }  = require('@supabase/supabase-js');
const { config }        = require('../config');

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// ✅ Fix (Part 2): ماسنجر كان بدون أي rate limit لكل مرسل، بعكس واتساب (RATE_MAX/RATE_WIN)
// رغم استخدام نفس checkAndReply (نفس تكلفة AI). بدون هذا، إسبام من نفس senderId
// يستهلك توكنز المستخدم بسرعة ويُحمّل الـ AI provider برسائل متتالية بلا داعٍ.
const rateMap  = new Map();   // senderId → [timestamps]
const RATE_MAX = 5;           // أقصى 5 ردود
const RATE_WIN = 60_000;      // خلال دقيقة
function isRateLimited(id) {
  const now  = Date.now();
  const hits = (rateMap.get(id) || []).filter(t => now - t < RATE_WIN);
  if (hits.length >= RATE_MAX) return true;
  rateMap.set(id, [...hits, now]);
  return false;
}
setInterval(() => {
  const now = Date.now();
  for (const [id, arr] of rateMap) {
    const fresh = arr.filter(t => now - t < RATE_WIN);
    fresh.length ? rateMap.set(id, fresh) : rateMap.delete(id);
  }
}, 60_000);

async function sendMessage(recipientId, text) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(
      // Fix 8: ترقية Graph API من v19.0 → v21.0 (الإصدار الحالي المدعوم)
      // Meta تُوقف الإصدارات بعد عامين — v19 سيُحذف قريباً
      `https://graph.facebook.com/v21.0/me/messages?access_token=${config.fbPage}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }), signal: ctrl.signal }
    );
    if (!res.ok) { const d = await res.json().catch(() => ({})); console.error('❌ ماسنجر:', d); throw new Error('فشل إرسال'); }
  } finally { clearTimeout(timer); }
}

async function handleIncoming(pageId, senderId, messageText) {
  if (!pageId || !senderId || typeof messageText !== 'string' || messageText.length > 2000) return;
  if (isRateLimited(senderId)) { console.warn(`[MSG] rate-limit: ${senderId}`); return; }
  try {
    const { data: biz, error } = await supabase.from('businesses').select('*').eq('fb_page_id', pageId).single();
    if (error || !biz) { console.warn(`⚠️ صفحة غير مسجلة: ${pageId}`); return; }

    // Bug #1 Fix: استخدام user_id بدلاً من business_id (غير موجود في الجدول)
    const { data: h } = await supabase.from('conversations').select('role, content')
      .eq('user_id', biz.user_id).eq('sender_id', senderId)
      .order('created_at', { ascending: false }).limit(10);
    const history = (h || []).reverse().map(m => ({ role: m.role, content: m.content }));

    // Bug #6 Fix: استخراج usage من checkAndReply لتسجيل tokens_used
    const { reply, limitReached, usage = 0 } = await checkAndReply(supabase, biz.user_id, biz.settings, history, messageText);

    // Bug E Fix: إرسال الرسالة أولاً — إذا فشل الإرسال لا نُسجّل في DB
    // قبل الإصلاح: insert → sendMessage (إذا فشل sendMessage, الرسالة مسجلة في DB لكنها لم تصل)
    await sendMessage(senderId, reply);

    // Bug #1 + #6 Fix: user_id بدلاً من business_id، وإضافة tokens_used
    await supabase.from('conversations').insert([
      { user_id: biz.user_id, sender_id: senderId, role: 'user',      content: messageText, channel: 'messenger' },
      { user_id: biz.user_id, sender_id: senderId, role: 'assistant', content: reply,        channel: 'messenger', tokens_used: usage },
    ]);

    if (limitReached) {
      // Bug #2 Fix: استخدام title و body بدلاً من message و date (غير موجودَين في schema)
      await supabase.from('notifications').insert({
        user_id: biz.user_id,
        type: 'limit_reached',
        title: 'انتهى رصيد ماسنجر',
        body:  '⚠️ انتهى رصيد ماسنجر — قم بالترقية',
      }).catch(() => {});
    }
  } catch (err) { console.error('🔴 ماسنجر handleIncoming:', err.message); }
}

async function processWebhook(body) {
  if (body.object !== 'page') return;
  for (const entry of body.entry || []) {
    const pageId = entry.id;
    if (!pageId) continue;
    for (const event of entry.messaging || []) {
      if (event.message?.is_echo || !event.message?.text) continue;
      const senderId = event.sender?.id;
      const text     = event.message.text.trim();
      if (!senderId) continue;
      handleIncoming(pageId, senderId, text).catch(console.error);
    }
  }
}

module.exports = { processWebhook, sendMessage };
