# 🤖 ZIbot — دليل التشغيل الكامل

---

## المتطلبات

| أداة | الإصدار | التثبيت في Termux |
|------|---------|-------------------|
| Node.js | 18 أو أحدث | `pkg install nodejs` |
| Git (اختياري) | أي | `pkg install git` |

---

## الخطوة 1 — إعداد Supabase

1. افتح [supabase.com](https://supabase.com) → سجّل دخول → **New Project**
2. اختر اسماً للمشروع وكلمة مرور للـ DB
3. بعد إنشائه، اذهب إلى:
   - **SQL Editor** → الصق محتوى ملف `SUPABASE_SETUP.sql` كاملاً → **Run**
4. اذهب إلى **Settings → API** واحتفظ بـ:
   - **Project URL** → يذهب في `SUPABASE_URL`
   - **service_role** key (اضغط Reveal) → يذهب في `SUPABASE_KEY`

---

## الخطوة 2 — الحصول على مفتاح Groq (مجاني)

1. افتح [console.groq.com](https://console.groq.com)
2. سجّل دخول → **API Keys → Create API Key**
3. انسخ المفتاح → يذهب في `GROQ_API_KEY`

---

## الخطوة 3 — تعبئة ملف الإعدادات

```bash
# في مجلد backend:
nano .app_runtime
```

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=أي_كلمة_سرية_طويلة_32_حرف_على_الأقل
FB_VERIFY_TOKEN=zibot_verify_2025
FB_PAGE_TOKEN=NOT_USED
FB_APP_SECRET=NOT_USED
FRONTEND_URL=http://localhost:5173
PORT=3000
NODE_ENV=production
AI_PROVIDER=groq
ANTHROPIC_API_KEY=
```

> **لتوليد JWT_SECRET تلقائياً:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## الخطوة 4 — تثبيت وتشغيل

### طريقة سريعة (موصى بها):
```bash
cd Bot
bash start.sh
```

### طريقة يدوية:

**أولاً — Backend:**
```bash
cd Bot/backend
npm install
node server.js
```

**ثانياً — Frontend (في terminal منفصل):**
```bash
cd Bot/frontend
npm install
npm run dev
```

ثم افتح: **http://localhost:5173**

---

## الخطوة 5 — ربط واتساب

1. افتح المتصفح → **http://localhost:5173**
2. اذهب إلى **إعداد البيزنس**
3. اضغط **طلب QR Code**
4. على موبايلك: **واتساب → الأجهزة المرتبطة → ربط جهاز → امسح الرمز**
5. ✅ البوت متصل — يرد تلقائياً على كل رسالة واردة

---

## تشغيل في Termux (Android)

```bash
# تثبيت Node.js
pkg update && pkg install nodejs

# تشغيل المشروع
cd Bot
bash start.sh
```

> **للإبقاء على الجلسة بعد إغلاق Termux:**
> ```bash
> pkg install tmux
> tmux new -s zibot
> bash start.sh
> # اضغط Ctrl+B ثم D للخروج دون إيقاف
> # للعودة: tmux attach -t zibot
> ```

---

## في حالة الأخطاء

| الخطأ | الحل |
|-------|------|
| `Cannot find module 'dotenv'` | `npm install` في مجلد backend |
| `متغير البيئة مفقود: SUPABASE_KEY` | تحقق من `.app_runtime` |
| `Connection Failure` في واتساب | احذف مجلد `wa_session/` وأعد المسح |
| QR لا يظهر | تأكد أن السيرفر يعمل على البورت 3000 |
| `403 Forbidden` من Supabase | استخدم `service_role` key وليس `anon` |

---

## هيكل المشروع

```
Bot/
├── backend/
│   ├── .app_runtime          ← إعداداتك الخاصة (لا ترفعه لـ Git)
│   ├── server.js             ← نقطة الدخول الرئيسية
│   ├── config.js             ← تحميل متغيرات البيئة
│   ├── serve-frontend.js     ← يخدم Frontend من نفس السيرفر
│   ├── setup-first-business.js ← إعداد أولي (شغّله مرة واحدة)
│   ├── routes/               ← API endpoints
│   ├── services/             ← واتساب + AI + Messenger
│   └── middleware/           ← حماية + مصادقة + logging
│
├── frontend/
│   ├── lib/                  ← fingerprint + i18n + theme + auth
│   ├── pages/                ← Dashboard + Setup + Upgrade
│   └── components/           ← Navbar
│
├── start.sh                  ← سكريبت التشغيل الكامل
├── SETUP_GUIDE.md            ← هذا الملف
└── SUPABASE_SETUP.sql        ← SQL لإنشاء الجداول
```
