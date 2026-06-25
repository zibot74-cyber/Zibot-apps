// server.js — نقطة دخول السيرفر الرئيسية
'use strict';

require('./config');                              // تحميل .app_runtime أولاً
require('./validate-env').validateEnv();          // التحقق من المتغيرات المطلوبة

const express     = require('express');
const http        = require('http');
const helmet      = require('helmet');
const cors        = require('cors');
const rateLimit   = require('express-rate-limit');
const compression = require('compression');
const crypto      = require('crypto');
const { config }  = require('./config');
const { firewall }                           = require('./middleware/firewall');
const { requestLogger, setupProcessHandlers } = require('./middleware/logger');
const { requestTimeout, sanitizeErrors, preventHPP } = require('./middleware/security');
const cookieParser = require('cookie-parser');

// ── معالجة الأخطاء غير المتوقعة — مرة واحدة فقط ─────────
setupProcessHandlers();

const app    = express();
const server = http.createServer(app);

// ── معلومات بدء التشغيل ──────────────────────────────────
const MESSENGER_ENABLED = !!(config.fbPage && config.fbPage !== 'NOT_USED' &&
                             config.fbSecret && config.fbSecret !== 'NOT_USED');
// ✅ واتساب الآن عبر Cloud API الرسمي (REST فقط) — لا Baileys ولا QR
const WHATSAPP_ENABLED = !!(config.waToken && config.waToken !== 'NOT_USED' &&
                            config.waPhoneNumberId && config.waPhoneNumberId !== 'NOT_USED');
console.log(`📦 وضع التشغيل: ${config.env}`);
console.log(`🤖 محرك AI: ${config.aiProvider === 'claude' ? 'Claude (Anthropic)' : 'Groq (LLaMA)'}`);
console.log(`💬 Messenger: ${MESSENGER_ENABLED ? '✅ مفعّل' : '⏸️  متوقف'}`);
console.log(`📱 WhatsApp Cloud API: ${WHATSAPP_ENABLED ? '✅ مفعّل' : '⏸️  متوقف'}`);
if (WHATSAPP_ENABLED && (!config.waVerifyToken || config.waVerifyToken === 'NOT_USED')) {
  console.warn('⚠️  WA_VERIFY_TOKEN غير مُعيَّن — ربط الـ webhook من لوحة Meta سيفشل (hub.challenge لن يُقبَل)');
}

app.set('trust proxy', 1);

// ── Helmet ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc:     ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      objectSrc:  ["'none'"],
      frameSrc:   ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  frameguard:    { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff:        true,
  referrerPolicy: { policy: 'no-referrer' },
}));

app.use((_req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  next();
});

// ── CORS — يشمل PATCH و DELETE للـ admin routes ──────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3001',
  'http://localhost:3000',
  config.frontendUrl,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('CORS: Origin غير مسموح'));
  },
  methods:      ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:  true,
  maxAge:       86400,
}));

// ── Body Parser ───────────────────────────────────────────
app.use(compression());
app.use(cookieParser());   // ← يُفسّر req.cookies — مطلوب لقراءة httpOnly JWT cookie
app.use(express.json({
  limit: '10kb',
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(requestTimeout(45_000));
app.use(preventHPP);
app.use(requestLogger);

// ── حجب المسارات الحساسة ─────────────────────────────────
const BLOCKED_PATH_SEGMENTS = [
  '.env', '.app_runtime', '.git', 'node_modules', '.ssh',
  'id_rsa', '.bash', '.profile', 'wa_session', 'creds.json',
  '.npmrc', 'dockerfile', 'web.config', '.htaccess', '.htpasswd',
  'proc/self', '/etc/', 'backup.sql',
];
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (BLOCKED_PATH_SEGMENTS.some(b => p.includes(b))) return res.status(403).end();
  const last = p.split('/').pop() || '';
  if (last.startsWith('.') && last !== '.well-known') return res.status(403).end();
  next();
});

app.use(firewall);

// ── Rate Limiting ─────────────────────────────────────────
const makeLimit = (max, windowMin, msg = 'طلبات كثيرة، حاول بعد قليل') =>
  rateLimit({
    windowMs: windowMin * 60 * 1000, max,
    standardHeaders: true, legacyHeaders: false,
    message: { error: msg },
    skip: (req) => req.path === '/health',
    // Fix #2: use req.ip — Express resolves this safely using `trust proxy: 1`
    // (reads the rightmost IP added by our trusted Nginx proxy, not a client-supplied header)
    keyGenerator: (req) => (req.ip || req.socket?.remoteAddress || 'unknown').slice(0, 45),
  });

const limiters = {
  global:   makeLimit(200, 15),
  auth:     makeLimit(20,  15, 'طلبات كثيرة — انتظر 15 دقيقة'),
  login:    makeLimit(10,  15, 'محاولات كثيرة — انتظر 15 دقيقة'),  // أصعب للـ brute force
  webhook:  makeLimit(120, 1),
  settings: makeLimit(60,  5),
  qr:       makeLimit(30,  1),
  payment:  makeLimit(20,  5),
  admin:    makeLimit(100, 5),
};
app.use(limiters.global);

// ── Facebook Signature ────────────────────────────────────
// ✅ Fix (Part 2): فيسبوك لا يرسل X-Hub-Signature-256 مع طلب GET (التحقق الأولي عبر hub.challenge) —
// هذا التوقيع يُرسل فقط مع POST (الأحداث الفعلية). كانت verifyFbSignature تُطبَّق على GET أيضاً
// عبر app.use('/api/webhook', ...) فترفض كل طلبات التحقق الأولية من Meta بـ 401 "لا توقيع"،
// أي أن ربط الـ webhook من لوحة Meta كان مستحيلاً من الأساس.
function makeMetaSignatureVerifier(enabledFlag, appSecret) {
  return function (req, res, next) {
    if (!enabledFlag) return next();
    if (req.method === 'GET') return next(); // طلب التحقق (hub.challenge) يُعالَج داخل ملف الراوت
    const sig = req.headers['x-hub-signature-256'];
    if (!sig) return res.status(401).json({ error: 'لا توقيع' });
    const rawBuf   = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBuf).digest('hex');
    try {
      const sigBuf = Buffer.from(sig);
      const expBuf = Buffer.from(expected);
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf))
        return res.status(401).json({ error: 'توقيع غير صحيح' });
    } catch { return res.status(401).json({ error: 'توقيع غير صالح' }); }
    next();
  };
}
// ✅ Fix: كانت verifyWaSignature تتحقق دائماً بـ config.fbSecret (سرّ تطبيق ماسنجر) حتى
// لو كان واتساب على تطبيق Meta منفصل بسرّ مختلف → كل رسائل واتساب كانت ستُرفض بـ 401.
// الآن كل ويب هوك يستخدم سرّه الصحيح (waAppSecret يرجع تلقائياً لـ fbSecret لو لم يُحدَّد).
const verifyFbSignature = makeMetaSignatureVerifier(MESSENGER_ENABLED, config.fbSecret);
const verifyWaSignature = makeMetaSignatureVerifier(WHATSAPP_ENABLED, config.waAppSecret);

// ── Routes ────────────────────────────────────────────────
const authRouter = require('./routes/auth');
// تطبيق rate limit أشد على login و register و identify
app.use('/api/auth/login',           limiters.login);
app.use('/api/auth/register',        limiters.login);
app.use('/api/auth/forgot-password', limiters.login);
app.use('/api/auth/identify',        limiters.login); // Fix #2/#3: identify نفس صرامة login
app.use('/api/auth',     limiters.auth,    authRouter);
app.use('/api/settings', limiters.settings, require('./routes/settings'));
// Stripe webhook needs raw body and higher rate limit (Stripe sends many events)
const stripeWebhookLimit = makeLimit(300, 1, 'too many webhook calls');
app.post('/api/payment/stripe/webhook', stripeWebhookLimit, async (req, res) => {
  try {
    const { handleStripeWebhook } = require('./services/payment');
    const sig = req.headers['stripe-signature'];
    if (!sig) return res.status(400).json({ error: 'no signature' });
    const result = await handleStripeWebhook(req.rawBody, sig);
    res.json(result);
  } catch (err) {
    console.error('[STRIPE-WH]', err.message);
    res.status(400).json({ error: err.message });
  }
});
// Paymob webhook — يُرسَل تلقائياً بعد كل عملية دفع ناجحة أو فاشلة
app.post('/api/payment/paymob/webhook', makeLimit(300, 1), async (req, res) => {
  try {
    const { handlePaymobWebhook } = require('./services/payment');
    const hmac = req.query.hmac || '';           // Paymob يُرسل HMAC كـ query param
    const result = await handlePaymobWebhook(req.body, hmac);
    res.json(result);
  } catch (err) {
    console.error('[PAYMOB-WH]', err.message);
    res.status(400).json({ error: err.message });
  }
});
app.use('/api/payment',  limiters.payment,  require('./routes/payment'));
app.use('/api/admin',    limiters.admin,    require('./routes/admin'));
if (MESSENGER_ENABLED) {
  app.use('/api/webhook', limiters.webhook, verifyFbSignature, require('./routes/webhook'));
  console.log('🔗 Webhook Messenger: /api/webhook');
}
if (WHATSAPP_ENABLED) {
  app.use('/api/whatsapp/webhook', limiters.webhook, verifyWaSignature, require('./routes/whatsappWebhook'));
  console.log('🔗 Webhook واتساب (Cloud API): /api/whatsapp/webhook');
}

// ── حالة تكامل واتساب (Cloud API الرسمية — REST فقط، لا QR ولا اتصال دائم) ──
const authMiddleware = require('./middleware/authMiddleware');
const { getStatus: getWhatsAppStatus, getWhatsAppQR } = require('./services/whatsapp');

app.get('/api/whatsapp/status', limiters.qr, authMiddleware, async (_req, res) => {
  try { res.json(await getWhatsAppStatus()); }
  catch { res.status(500).json({ error: 'خطأ في جلب الحالة' }); }
});

// ── QR الرسمي من Meta (wa_qr) — يُعرض في إعدادات البزنس ───
app.get('/api/whatsapp/qr', limiters.qr, authMiddleware, async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const result = await getWhatsAppQR();
    if (!result.configured) return res.status(503).json(result);
    res.json(result);
  } catch { res.status(500).json({ error: 'خطأ في جلب QR' }); }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ── Frontend ──────────────────────────────────────────────
const { serveFrontend } = require('./serve-frontend');
serveFrontend(app);

// ── معالجات الأخطاء (يجب أن تكون الأخيرة) ───────────────
app.use((_req, res) => res.status(404).json({ error: 'المسار غير موجود' }));
app.use(sanitizeErrors);   // ← معالج الأخطاء الآمن من security.js

// ── Graceful Shutdown ─────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n[SERVER] إيقاف بسبب ${signal}...`);
  server.close(() => {
    console.log('[SERVER] ✅ أُغلق بأمان');
    process.exit(0);
  });
  setTimeout(() => { console.error('[SERVER] إجبار الإغلاق'); process.exit(1); }, 10_000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ── Start ─────────────────────────────────────────────────
server.listen(config.port, async () => {
  console.log(`✅ السيرفر يعمل على البورت ${config.port}`);
  require('./services/cron').startCron();
});

module.exports = { app, server };
