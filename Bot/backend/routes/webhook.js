const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const { processWebhook } = require('../services/messenger');
const { config }         = require('../config');

// Fix #8: timing-safe comparison for verify_token (prevents timing side-channel)
function safeEqual(a, b) {
  try {
    const ba = Buffer.from(String(a)); const bb = Buffer.from(String(b));
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
  } catch { return false; }
}

// ════════════════════════════════════════
//  التحقق من Webhook (فيسبوك تطلبه مرة واحدة)
// ════════════════════════════════════════
router.get('/', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && safeEqual(token, config.fbVerify)) {
    console.log('✅ Webhook فيسبوك تم التحقق منه');
    return res.status(200).send(challenge);
  }

  res.status(403).json({ error: 'التحقق فشل' });
});

// ════════════════════════════════════════
//  استقبال الرسائل الواردة من فيسبوك
// ════════════════════════════════════════
router.post('/', async (req, res) => {
  // أجب فيسبوك فوراً — لو تأخرت أكثر من 5 ثوانٍ يعيد الإرسال
  res.sendStatus(200);

  // Bug #13 Fix: إزالة await — لا فائدة منه بعد إرسال الرد (res.sendStatus سبق)
  processWebhook(req.body).catch(console.error);
});

module.exports = router;
