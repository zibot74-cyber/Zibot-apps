// ════════════════════════════════════════════════════════
//  services/email.js
//  خدمة البريد الإلكتروني — Nodemailer
//  يعمل مع أي SMTP: Gmail, Brevo, SendGrid, Resend, إلخ
// ════════════════════════════════════════════════════════

const nodemailer = require('nodemailer');
const { config }  = require('../config');

// ✅ Fix (Part 2): data.reference قادم من إدخال المستخدم (submitManualPayment) ويُحقن مباشرة
// في HTML البريد بدون أي تنقية — حقن HTML/script محتمل لو فتح البريد ضمن عميل ويب لا يُعقّم المحتوى.
function escapeHTML(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

let _transporter = null;
let _enabled      = false;

function getTransporter() {
  if (_transporter) return _transporter;
  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    console.warn('[EMAIL] SMTP غير مُعَدّ — البريد معطّل');
    return null;
  }
  _transporter = nodemailer.createTransport({
    host:   config.smtpHost,
    port:   parseInt(config.smtpPort || '587', 10),
    secure: (config.smtpPort === '465'),
    auth:   { user: config.smtpUser, pass: config.smtpPass },
    // Fix #9: removed `tls: { rejectUnauthorized: false }` — that disabled certificate validation
    // and opened the SMTP connection to MITM interception of password-reset/verify tokens.
    // If your SMTP provider uses a self-signed cert, pin it explicitly instead.
  });
  _enabled = true;
  console.log(`[EMAIL] SMTP جاهز → ${config.smtpHost}`);
  return _transporter;
}

// ── القالب الأساسي ─────────────────────────────────────
function baseHTML(title, body) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{margin:0;padding:0;background:#07071a;font-family:'Segoe UI',Tahoma,sans-serif;color:#e0e0ff}
  .wrap{max-width:520px;margin:40px auto;background:#0e0e2a;border-radius:16px;overflow:hidden;border:1px solid #1e1e50}
  .header{background:linear-gradient(135deg,#f59e0b,#d97706);padding:28px 32px;text-align:center}
  .header h1{margin:0;font-size:24px;color:#000;font-weight:900}
  .body{padding:32px}
  .body p{margin:0 0 16px;line-height:1.7;color:#c0c0e0}
  .btn{display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#000 !important;
       font-weight:900;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;margin:16px 0}
  .code{background:#1a1a3a;border:1px solid #3a3a6a;border-radius:8px;padding:16px;
        font-family:monospace;font-size:20px;text-align:center;letter-spacing:4px;color:#f59e0b;margin:16px 0}
  .footer{padding:20px 32px;border-top:1px solid #1e1e50;font-size:12px;color:#606080;text-align:center}
  .warn{background:#1f0a0a;border:1px solid #5a1a1a;border-radius:8px;padding:12px 16px;
        color:#ff9090;font-size:13px;margin-top:16px}
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><h1>🤖 ZIbot</h1></div>
  <div class="body">${body}</div>
  <div class="footer">ZIbot SaaS — جميع الحقوق محفوظة</div>
</div>
</body>
</html>`;
}

// ── القوالب ────────────────────────────────────────────
const TEMPLATES = {

  welcome: (data) => ({
    subject: '🎉 مرحباً في ZIbot!',
    html: baseHTML('مرحباً في ZIbot', `
      <p>أهلاً <strong>${escapeHTML(data.name || 'بك')}</strong>!</p>
      <p>حسابك في ZIbot جاهز الآن. يمكنك البدء في إعداد مساعدك الذكي على الفور.</p>
      <p>باقتك الحالية: <strong>مجاني (${data.tokens_limit || 1500} توكن/شهر)</strong></p>
      <a href="${config.frontendUrl}" class="btn">فتح الداشبورد →</a>
      <p style="font-size:13px;color:#8080a0">إذا لم تسجّل في ZIbot، تجاهل هذا البريد.</p>
    `),
  }),

  verifyEmail: (data) => ({
    subject: '✅ تأكيد بريدك الإلكتروني — ZIbot',
    html: baseHTML('تأكيد البريد الإلكتروني', `
      <p>شكراً لتسجيلك في ZIbot!</p>
      <p>اضغط الزر التالي لتأكيد بريدك الإلكتروني:</p>
      <a href="${config.frontendUrl}/verify-email?token=${data.token}" class="btn">تأكيد البريد الإلكتروني</a>
      <p style="font-size:13px;color:#8080a0">الرابط صالح لمدة 24 ساعة.</p>
      <div class="warn">إذا لم تسجّل في ZIbot، تجاهل هذا البريد ولا تضغط الرابط.</div>
    `),
  }),

  resetPassword: (data) => ({
    subject: '🔐 إعادة تعيين كلمة المرور — ZIbot',
    html: baseHTML('إعادة تعيين كلمة المرور', `
      <p>طلبت إعادة تعيين كلمة مرور حسابك في ZIbot.</p>
      <p>اضغط الزر التالي لإنشاء كلمة مرور جديدة:</p>
      <a href="${config.frontendUrl}/reset-password?token=${data.token}" class="btn">إعادة تعيين كلمة المرور</a>
      <p style="font-size:13px;color:#8080a0">الرابط صالح لمدة ساعة واحدة فقط.</p>
      <div class="warn">إذا لم تطلب إعادة التعيين، تجاهل هذا البريد. حسابك بأمان.</div>
    `),
  }),

  paymentConfirmed: (data) => ({
    subject: `🚀 تم تفعيل باقة ${data.planName} — ZIbot`,
    html: baseHTML('تم تفعيل باقتك!', `
      <p>تهانينا! تم تفعيل باقتك بنجاح.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#8080a0">الباقة</td><td style="padding:8px;font-weight:700;color:#f59e0b">${data.planName}</td></tr>
        <tr><td style="padding:8px;color:#8080a0">التوكن الشهري</td><td style="padding:8px;font-weight:700">${(data.tokensLimit || 0).toLocaleString()} توكن</td></tr>
        <tr><td style="padding:8px;color:#8080a0">المبلغ</td><td style="padding:8px;font-weight:700">${data.amount} ${data.currency || 'USD'}</td></tr>
        <tr><td style="padding:8px;color:#8080a0">طريقة الدفع</td><td style="padding:8px">${data.method}</td></tr>
      </table>
      <a href="${config.frontendUrl}/dashboard" class="btn">فتح الداشبورد →</a>
    `),
  }),

  lowTokens: (data) => ({
    subject: '⚠️ رصيدك التوكن يقترب من النهاية — ZIbot',
    html: baseHTML('تنبيه: رصيد منخفض', `
      <p>تنبيه: تبقى لك <strong style="color:#f59e0b">${data.remaining} توكن</strong> فقط هذا الشهر.</p>
      <p>قم بالترقية الآن لضمان استمرار ردود المساعد على عملائك.</p>
      <a href="${config.frontendUrl}/upgrade" class="btn">ترقية الباقة الآن</a>
    `),
  }),

  subscriptionExpired: (data) => ({
    subject: '📅 انتهت فترة اشتراكك — ZIbot',
    html: baseHTML('انتهى اشتراكك', `
      <p>مرحباً! انتهت فترة اشتراك باقة <strong style="color:#f59e0b">${data.planName || 'المدفوعة'}</strong>.</p>
      <p>تم تحويل حسابك تلقائياً إلى الباقة المجانية (1,500 توكن/شهر).</p>
      <p>لاستئناف الخدمة الكاملة، جدّد اشتراكك الآن:</p>
      <a href="${config.frontendUrl}/upgrade" class="btn">تجديد الاشتراك →</a>
      <p style="font-size:12px;color:#8080a0;margin-top:16px">تبقى رصيدك من التوكنز: 1,500 توكن مجاناً شهرياً</p>
    `),
  }),

  manualPaymentReceived: (data) => ({
    subject: '📥 تم استلام طلب دفعتك — ZIbot',
    html: baseHTML('طلب الدفع استُلم', `
      <p>تم استلام طلب الدفع الخاص بك بنجاح.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#8080a0">الباقة المطلوبة</td><td style="padding:8px;font-weight:700;color:#f59e0b">${data.planName}</td></tr>
        <tr><td style="padding:8px;color:#8080a0">رقم المرجع</td><td style="padding:8px;font-family:monospace">${escapeHTML(data.reference)}</td></tr>
        <tr><td style="padding:8px;color:#8080a0">طريقة الدفع</td><td style="padding:8px">${escapeHTML(data.method)}</td></tr>
      </table>
      <p style="color:#8080a0;font-size:13px">سيتم مراجعة طلبك خلال 24 ساعة وتفعيل باقتك فور التأكيد.</p>
    `),
  }),

};

// ── الإرسال ─────────────────────────────────────────────
async function sendEmail(to, templateName, data = {}) {
  const tr = getTransporter();
  if (!tr) {
    console.log(`[EMAIL] (معطّل) إلى: ${to} — قالب: ${templateName}`);
    return false;
  }
  const tmpl = TEMPLATES[templateName];
  if (!tmpl) { console.error(`[EMAIL] قالب غير موجود: ${templateName}`); return false; }
  try {
    const { subject, html } = tmpl(data);
    await tr.sendMail({
      // Bug #7 Fix: إذا كان smtpFrom يحتوي '<' فهو بالصيغة الكاملة → استخدمه مباشرة
      // قبل الإصلاح: "ZIbot" <"ZIbot" <email>> عند ضبط SMTP_FROM بالصيغة الكاملة
      from: config.smtpFrom?.includes('<')
        ? config.smtpFrom
        : `"ZIbot" <${config.smtpFrom || config.smtpUser}>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL] ✅ أُرسل إلى: ${to} — ${subject}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] ❌ فشل إلى ${to}:`, err.message);
    return false;
  }
}

module.exports = { sendEmail, isEmailEnabled: () => _enabled };
