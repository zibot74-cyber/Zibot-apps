# 🤖 ZIbot — Production Ready SaaS Bot

> مساعد ذكاء اصطناعي يرد على عملاء واتساب وماسنجر تلقائياً

---

## 📋 هيكل المشروع

```
ZIbot/
├── app/                    ← Next.js (الموقع التسويقي)
├── Bot/
│   ├── backend/           ← Express.js (API + WhatsApp + AI)
│   └── frontend/          ← Vite React (داشبورد البوت)
├── components/            ← مكونات الموقع التسويقي
├── lib/i18n/              ← نظام الترجمة (AR/EN)
├── public/                ← الملفات العامة
├── ecosystem.config.js    ← PM2 config (production)
├── nginx.conf.example     ← Nginx config (production)
├── middleware.ts          ← Next.js security middleware
└── start_all.sh           ← تشغيل الكل بأمر واحد
```

---

## ⚡ التشغيل السريع

### 1. متغيرات بيئة الباك إند (Bot/backend)

```bash
cp Bot/backend/env.example.text Bot/backend/.app_runtime
nano Bot/backend/.app_runtime
```

| المتغير | مطلوب؟ | الوصف |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_KEY` | ✅ مطلوب | رابط ومفتاح قاعدة بيانات Supabase |
| `JWT_SECRET` | ✅ مطلوب | سلسلة عشوائية 32+ حرف لتوقيع التوكنات (لا تستخدم قيمة بسيطة) |
| `AI_PROVIDER` + `GROQ_API_KEY` أو `ANTHROPIC_API_KEY` | ✅ مطلوب | مزوّد الذكاء الاصطناعي للردود |
| `PORT`, `NODE_ENV`, `FRONTEND_URL` | ✅ مطلوب | إعدادات التشغيل الأساسية |
| `FB_VERIFY_TOKEN`, `FB_PAGE_TOKEN`, `FB_APP_SECRET` | اختياري | لتفعيل بوت ماسنجر |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | اختياري | الدفع ببطاقة عبر Stripe |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE` | اختياري | الدفع عبر PayPal |
| `SMTP_HOST/PORT/USER/PASS/FROM` | اختياري | إرسال إيميلات التحقق وإعادة التعيين |
| `VODAFONE_CASH_NUMBER`, `INSTAPAY_NUMBER`, `BANK_ACCOUNT_INFO` | اختياري | عرض وسائل دفع يدوية في الداشبورد |

### 2. متغيرات بيئة الموقع التسويقي (الجذر)

```bash
nano .env.local
```

| المتغير | مطلوب؟ | الوصف |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | اختياري | تسجيل الدخول بجوجل في نافذة الحساب |

### 3. قاعدة البيانات (Supabase)

نفّذ محتوى `Bot/SUPABASE_SETUP.sql` كاملاً في SQL Editor على Supabase. **مهم:** يحتوي الملف الآن على أعمدة وحماية جديدة (قفل تسجيل الدخول، الحظر، سجل التدقيق `audit_logs`) — إن كانت قاعدتك قديمة، قسم "Migration" في أسفل الملف يضيفها بأمان بدون حذف بيانات (`ADD COLUMN IF NOT EXISTS`).

ثم فعّل أول حساب أدمن:
```sql
UPDATE users SET is_admin = TRUE WHERE email = 'بريدك@example.com';
```

### 4. تشغيل المشروع

```bash
bash start_all.sh          # الكل
bash start_all.sh --bot    # البوت فقط
bash start_all.sh --web    # الموقع فقط
bash start_all.sh --stop   # إيقاف
```

---

## 🚀 النشر على VPS (Ubuntu)

```bash
# تثبيت PM2
npm install -g pm2

# Build
npm install && npm run build
cd Bot/frontend && npm install && npm run build && cd ../..

# تشغيل مع PM2
pm2 start ecosystem.config.js
pm2 save && pm2 startup
```

---

## 🔒 الأمان المدمج

- Rate limiting على جميع endpoints
- Firewall (SQL injection, XSS, path traversal)
- JWT authentication مع Fingerprint
- Helmet security headers + CORS allowlist
- قفل الحساب 15 دقيقة بعد 5 محاولات دخول فاشلة (brute-force protection)
- حظر مؤقت/دائم للحسابات (`is_banned`) مع رفع تلقائي بعد انتهاء المدة
- سجل تدقيق (`audit_logs`) لكل عملية إدارية حساسة: من نفّذها، متى، ومن أي IP
- robots.txt يمنع فهرسة الداشبورد
- Next.js middleware يحجب بوتات ضارة ومسارات حساسة

⚠️ **لمراجعة أمنية كاملة وأعمق**، استخدم ملف `SECURITY_REPORT.md` المرفق مع المشروع كمرجع لجلسة فحص شاملة.

---

## 🌐 SEO

- sitemap.xml, robots.txt, JSON-LD, Open Graph
- Google Search Console: أضف verification code في `app/layout.tsx`

---

## 📊 المنافذ

| الخدمة | المنفذ |
|--------|--------|
| البوت + داشبورد | 3000 |
| الموقع التسويقي | 3001 |
