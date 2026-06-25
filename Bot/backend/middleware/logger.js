function getIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}
function sanitizePath(p) {
  if (!p) return '/';
  // eslint-disable-next-line no-control-regex
  return p.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 120);
}

function requestLogger(req, res, next) {
  if (req.path === '/health') return next();
  const start = Date.now();
  const ip    = getIP(req);
  res.on('finish', () => {
    const ms = Date.now() - start;
    const s  = res.statusCode;
    const p  = sanitizePath(req.originalUrl || req.path);
    if (p.startsWith('/api') || s >= 400) {
      const icon = s >= 500 ? '🔴' : s >= 400 ? '🟡' : '🟢';
      console.log(`${icon} [${new Date().toISOString()}] ${req.method} ${p} ← ${s} (${ms}ms) [${ip}]`);
    }
    if (s === 401 || s === 403) console.warn(`🔐 [SECURITY] ${s} على: ${p} من: ${ip}`);
  });
  next();
}

function setupProcessHandlers() {
  // تسجيل مرة واحدة فقط (منع التكرار)
  if (process.listenerCount('uncaughtException') > 0) return;
  process.on('unhandledRejection', (r, p) => {
    console.error('🔴 [PROC] unhandledRejection في:', p, '\n  السبب:', r?.message || r);
    // لا نوقف السيرفر — الـ promise المرفوض لا يعني بالضرورة خطأ مميتاً
  });
  process.on('uncaughtException', (e) => {
    console.error('🔴 [PROC] uncaughtException:', e.message, '\n', e.stack);
    // نوقف السيرفر لأن الحالة غير معروفة — PM2 سيعيد التشغيل
    process.exit(1);
  });
}

module.exports = { requestLogger, setupProcessHandlers };
