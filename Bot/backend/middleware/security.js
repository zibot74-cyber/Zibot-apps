// middleware/security.js — حماية إضافية من الثغرات
'use strict';

// ─── Request Timeout — يمنع تعليق الاتصالات إلى الأبد ────
function requestTimeout(ms = 30_000) {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({ error: 'انتهت مهلة الطلب' });
      }
    }, ms);
    // SSE streams تحتاج timeout مختلف
    if (req.path.includes('/stream')) { clearTimeout(timer); return next(); }
    res.on('finish', () => clearTimeout(timer));
    res.on('close',  () => clearTimeout(timer));
    next();
  };
}

// ─── إخفاء تفاصيل الخطأ الداخلية في production ───────────
function sanitizeErrors(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';
  const safeMessage = maskSecrets(err.message);
  const safeStack   = maskSecrets(err.stack);
  console.error(`[ERROR] ${req.method} ${req.path}:`, safeMessage);

  // لا ترسل stack trace في production
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error: isProd
      ? (err.expose ? safeMessage : 'خطأ في الخادم')
      : safeMessage,
    ...(isProd ? {} : { stack: safeStack }),
  });
}

// ─── منع تسرّب المتغيرات السرية في الردود ─────────────────
const SECRET_PATTERNS = [
  /sk_(?:live|test)_\w{20,}/gi,  // Stripe — Bug #3 Fix: (?:live|test) بدلاً من [live|test]
  /eyJ\w{20,}\.\w{20,}/g,       // JWT raw tokens
  /gsk_\w{20,}/gi,               // Groq
  /sk-ant-\w{20,}/gi,            // Anthropic
];
function maskSecrets(str) {
  if (typeof str !== 'string') return str;
  let s = str;
  for (const p of SECRET_PATTERNS) s = s.replace(p, '[REDACTED]');
  return s;
}

// ─── منع HTTP Parameter Pollution ──────────────────────────
function preventHPP(req, _res, next) {
  // إذا أُرسل مصفوفة بدل قيمة مفردة، خذ الأولى فقط
  for (const key of Object.keys(req.query)) {
    if (Array.isArray(req.query[key])) req.query[key] = req.query[key][0];
  }
  next();
}

// ─── قيود حجم الـ JSON body لكل مسار ──────────────────────
function strictBodySize(limit = '5kb') {
  const express = require('express');
  return express.json({ limit });
}

module.exports = { requestTimeout, sanitizeErrors, maskSecrets, preventHPP, strictBodySize };
