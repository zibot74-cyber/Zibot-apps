require('dotenv').config({ path: require('path').resolve(__dirname, '.app_runtime') });

function clean(v) { return typeof v === 'string' ? v.trim() : v; }

const config = {
  // ── AI ────────────────────────────────────────────────
  groq:         clean(process.env.GROQ_API_KEY),
  anthropicKey: clean(process.env.ANTHROPIC_API_KEY),
  aiProvider:   (clean(process.env.AI_PROVIDER) || 'groq').toLowerCase(),

  // ── Supabase ──────────────────────────────────────────
  supabaseUrl:  clean(process.env.SUPABASE_URL),
  supabaseKey:  clean(process.env.SUPABASE_KEY),

  // ── Auth ──────────────────────────────────────────────
  jwt:          clean(process.env.JWT_SECRET),

  // ── Facebook / Messenger ──────────────────────────────
  fbVerify:     clean(process.env.FB_VERIFY_TOKEN),
  fbPage:       clean(process.env.FB_PAGE_TOKEN),
  fbSecret:     clean(process.env.FB_APP_SECRET),

  // ── WhatsApp Cloud API (الرسمية — Meta) ────────────────
  // WA_CLOUD_TOKEN: System User Access Token (Bearer) من Meta Business Manager
  // WA_PHONE_NUMBER_ID: رقم هوية رقم الهاتف (Phone Number ID) من WhatsApp Manager
  // WA_BUSINESS_ACCOUNT_ID: هوية حساب واتساب التجاري (WABA ID)
  // WA_VERIFY_TOKEN: نص عشوائي من اختيارك تُدخله في Meta App Dashboard لتأكيد الـ webhook
  waToken:            clean(process.env.WA_CLOUD_TOKEN),
  waPhoneNumberId:    clean(process.env.WA_PHONE_NUMBER_ID),
  waBusinessAccountId: clean(process.env.WA_BUSINESS_ACCOUNT_ID),
  waVerifyToken:      clean(process.env.WA_VERIFY_TOKEN),
  waApiVersion:       clean(process.env.WA_API_VERSION) || 'v25.0',
  // App Secret الخاص بتطبيق واتساب على Meta (لتوقيع الـ webhook).
  // لو واتساب وماسنجر داخل نفس تطبيق Meta، اتركه فاضي وسيستخدم FB_APP_SECRET تلقائياً.
  // لو واتساب في تطبيق Meta منفصل (شائع)، ضع App Secret الخاص به هنا.
  waAppSecret:        clean(process.env.WA_APP_SECRET) || clean(process.env.FB_APP_SECRET),

  // ── URLs ──────────────────────────────────────────────
  frontendUrl:  clean(process.env.FRONTEND_URL) || 'http://localhost:5173',
  port:         parseInt(process.env.PORT, 10)  || 3000,
  env:          clean(process.env.NODE_ENV)     || 'development',

  // ── Stripe ────────────────────────────────────────────
  stripeSecret:      clean(process.env.STRIPE_SECRET_KEY),
  stripeWebhookSec:  clean(process.env.STRIPE_WEBHOOK_SECRET),

  // ── PayPal ───────────────────────────────────────────
  paypalClientId:    clean(process.env.PAYPAL_CLIENT_ID),
  paypalClientSec:   clean(process.env.PAYPAL_CLIENT_SECRET),
  paypalMode:        clean(process.env.PAYPAL_MODE) || 'sandbox', // sandbox | live

  // ── Email / SMTP ──────────────────────────────────────
  smtpHost:     clean(process.env.SMTP_HOST),
  smtpPort:     clean(process.env.SMTP_PORT) || '587',
  smtpUser:     clean(process.env.SMTP_USER),
  smtpPass:     clean(process.env.SMTP_PASS),
  smtpFrom:     clean(process.env.SMTP_FROM),

  // ── معلومات الدفع اليدوي ──────────────────────────────
  vodafoneCash:  clean(process.env.VODAFONE_CASH_NUMBER) || '',
  orangeCash:    clean(process.env.ORANGE_CASH_NUMBER)   || '',
  etisalatCash:  clean(process.env.ETISALAT_CASH_NUMBER) || '',
  bankAccount:   clean(process.env.BANK_ACCOUNT_INFO)    || '',
  instapay:      clean(process.env.INSTAPAY_NUMBER)      || '',

  // ── Paymob (الدفع التلقائي بالمحفظة) ───────────────────
  // من: accept.paymob.com → Settings → Account Info & Developers
  paymobApiKey:        clean(process.env.PAYMOB_API_KEY)          || '',
  paymobPublicKey:     clean(process.env.PAYMOB_PUBLIC_KEY)        || '',
  paymobWalletIntegId: clean(process.env.PAYMOB_WALLET_INTEG_ID)   || '',
  paymobHmacSecret:    clean(process.env.PAYMOB_HMAC_SECRET)       || '',
};

module.exports = { config };
