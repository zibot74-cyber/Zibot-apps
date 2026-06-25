const path = require('path');
const fs   = require('fs');
const DIST = path.resolve(__dirname, '../frontend/dist');

// ── robots.txt للداشبورد الخاص (لا نريد فهرسته) ────────────────
const ROBOTS_CONTENT = [
  'User-agent: *',
  'Disallow: /',
  '',
  '# ZIbot Dashboard — Private SaaS application, not for public indexing',
].join('\n');

function serveFrontend(app) {
  // ── robots.txt — قبل أي شيء آخر ──────────────────────────────
  app.get('/robots.txt', (_req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(ROBOTS_CONTENT);
  });

  if (!fs.existsSync(DIST)) {
    console.warn('[FRONTEND] dist/ غير موجود — شغّل: npm run build');
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.status(503).send(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<title>ZIbot</title><style>*{margin:0;padding:0;box-sizing:border-box}
body{background:#05050f;color:#eee;font-family:sans-serif;min-height:100vh;display:flex;
align-items:center;justify-content:center;flex-direction:column;gap:16px}
code{background:#1a1a35;padding:4px 10px;border-radius:6px;color:#f59e0b}
</style></head><body>
<div style="font-size:48px">🚧</div>
<h2>الواجهة لم تُبنَ بعد</h2>
<p>شغّل <code>npm run build</code> في مجلد frontend ثم أعد تشغيل السيرفر</p>
</body></html>`);
    });
    return;
  }

  const express = require('express');

  // ─── حجب source maps (يمنع رؤية الكود المصدري من DevTools) ───
  app.use((req, res, next) => {
    if (req.path.endsWith('.js.map') || req.path.endsWith('.css.map'))
      return res.status(403).end();
    next();
  });

  // ─── ملفات static ───────────────────────────────────────────
  app.use(express.static(DIST, {
    maxAge:    '7d',
    immutable: true,
    index:     false,
    dotfiles:  'deny',
    setHeaders(res, filePath) {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      res.removeHeader('X-Powered-By');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  }));

  // ─── SPA fallback ─────────────────────────────────────────────
  // BUG FIX: الكود الأصلي كان يعمل return بدون إرسال response
  // مما يُجمّد الطلب ويعطي 404. الإصلاح: next() للـ API، وإلا أرسل index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const idx = path.join(DIST, 'index.html');
    if (!fs.existsSync(idx)) return res.status(503).send('Frontend not built');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.sendFile(idx);
  });

  console.log('[FRONTEND] يخدم dist/ ✅');
}

module.exports = { serveFrontend };
