const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const { processWebhook } = require('../services/whatsapp');
const { config }         = require('../config');

// Fix #8: timing-safe comparison for verify_token (prevents timing side-channel)
function safeEqual(a, b) {
  try {
    const ba = Buffer.from(String(a)); const bb = Buffer.from(String(b));
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
  } catch { return false; }
}

// ════════════════════════════════════════
//  التحقق من Webhook (Meta تطلبه مرة واحدة عند ربطه من App Dashboard)
// ════════════════════════════════════════
router.get('/', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && safeEqual(token, config.waVerifyToken)) {
    console.log('✅ Webhook واتساب (Cloud API) تم التحقق منه');
    return res.status(200).send(challenge);
  }

  res.status(403).json({ error: 'التحقق فشل' });
});

// ════════════════════════════════════════
//  استقبال الرسائل الواردة من واتساب (Cloud API)
// ════════════════════════════════════════
router.post('/', async (req, res) => {
  // أجب Meta فوراً — لو تأخرت أكثر من بضع ثوانٍ تُعيد الإرسال
  res.sendStatus(200);
  processWebhook(req.body).catch(console.error);
});

module.exports = router;
