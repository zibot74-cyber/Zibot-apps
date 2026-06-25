# تقرير أمني — مشروع ZIbot
> مرجع لجلسة Claude بتوكنز أعلى لإجراء فحص أمني كامل وإصلاح الثغرات.
> هذا الملف **ليس** قائمة شاملة نهائية — هو نقطة انطلاق موثّقة لما تم فحصه فعلاً وما يحتاج فحصاً أعمق.

---

## ✅ تم فحصه وإصلاحه (جلسة سابقة)

| الملف | الإصلاح |
|---|---|
| `Bot/backend/routes/auth.js` | قفل الحساب 15 دقيقة بعد 5 محاولات دخول فاشلة + فحص الحظر قبل تسجيل الدخول |
| `Bot/backend/middleware/authMiddleware.js` | حظر أي مستخدم `is_banned` من استخدام أي API فوراً حتى لو كان توكنه صالحاً |
| `Bot/backend/routes/admin.js` | نقاط نهاية حظر مؤقت/دائم، حذف حساب، وسجل تدقيق `audit_logs` على كل عملية حساسة |
| `Bot/SUPABASE_SETUP.sql` | أعمدة `failed_login_attempts`, `locked_until`, `is_banned`, `banned_until`, `ban_reason` + جدول `audit_logs` |

تأكد فقط أن SQL Migration نُفّذ على قاعدة البيانات الفعلية قبل البناء فوقها.

---

## 🔴 ثغرات مؤكدة (وُجدت لكن لم تُصلح بعد)

### 1. لا يوجد فحص توقيع HMAC على Webhook ماسنجر — **خطورة عالية**
**الملف:** `Bot/backend/routes/webhook.js` (POST `/`)
المشكلة: أي شخص يعرف رابط الـ webhook يستطيع إرسال طلب POST مزيّف وتنفيذ كود `processWebhook` بدون أي تحقق، علماً أن `config.fbSecret` (FB_APP_SECRET) موجود في `config.js` لكنه **غير مستخدم** في `webhook.js`.
**الإصلاح المطلوب:** التحقق من هيدر `x-hub-signature-256` عبر HMAC-SHA256 بمفتاح `FB_APP_SECRET` قبل معالجة أي رسالة واردة، ورفض الطلب (403) إن لم يتطابق. يلزم أيضاً قراءة `rawBody` (raw، غير parsed) لحساب التوقيع بدقة — تحقق من ترتيب middleware في `server.js` بخصوص `express.json()` على هذا المسار تحديداً.

### 2. تخزين JWT في `localStorage` — **خطورة متوسطة**
**الملف:** `Bot/frontend/lib/auth.js`
المشكلة: أي XSS ناجح (حتى بسيط، عبر مكتبة طرف ثالث مثلاً) يسمح بسرقة التوكن مباشرة بسبب سهولة الوصول لـ localStorage عبر JS.
**خيارات الإصلاح:** الانتقال لـ httpOnly cookie مع `SameSite=Strict`، أو على الأقل تقصير عمر التوكن (`expiresIn`) وتفعيل دوران فعلي لـ refresh token (revocation list)، مع فرض CSP صارم لتقليل احتمالية XSS من الأساس.

### 3. لا توجد Security Headers فعلية في Next.js Edge Middleware — **خطورة منخفضة-متوسطة**
**الملف:** `middleware.ts` (الجذر)
المشكلة: التعليق في الكود يقول "Security headers إضافية على كل استجابة" لكن لا يوجد كود فعلي يضيف أي header — لا CSP، لا `X-Frame-Options`، لا `Strict-Transport-Security`.
**الإصلاح المطلوب:** إضافة الـ headers فعلياً على `response` قبل `return response`.

---

## 🟡 نقاط تحتاج فحصاً عميقاً (لم تُفحص بالتفصيل بعد)

اطلب من الجلسة القادمة المرور على هذه الملفات بالترتيب لأنها الأعلى خطورة منطقياً:

1. **`Bot/backend/routes/settings.js`** — تأكد أن كل عملية تعدّل إعدادات بيزنس تتحقق من ملكية المستخدم لها (IDOR) وليس فقط أنه مسجّل دخول.
2. **`Bot/backend/services/payment.js`** (كامل، 208 سطر) — تحقق من:
   - حماية من Replay attack على Stripe webhook (idempotency key أو تخزين event.id معالَج).
   - عدم إمكانية تعديل سعر/خطة من جهة العميل (كل القيم يجب أن تُحسب من `PLANS` في الباك إند فقط).
3. **`Bot/backend/services/ai.js`** — حدود استهلاك التوكنز فعلية لكل مستخدم (منع إساءة استخدام تكلف فلوساً)، وحماية من Prompt Injection يغيّر سلوك البوت أو يسرّب system prompt.
4. **`Bot/backend/middleware/validator.js`** (كامل) — تأكد من تطبيق التحقق (`validate*`) على **كل** route يستقبل body/query من المستخدم، لا فقط auth.
5. **كل route فيه `:id`** في `admin.js` و`settings.js` و غيرها — تأكد من فحص ملكية الـ resource، لا الاعتماد على `validUUID` فقط (شكل صحيح ≠ صلاحية وصول).
6. **Supabase Row Level Security (RLS)** — تحقق هل `SUPABASE_KEY` المستخدم في الباك إند هو service_role key (يتجاوز RLS بالكامل، وهذا متوقع للباك إند الموثوق) أم anon key. إن كان service_role، تأكد أنه **لا يُستخدم أو يُرسل أبداً للفرونت إند** بأي شكل.
7. **`npm audit`** على `package.json` في الجذر، `Bot/backend`، و`Bot/frontend` — لم يُفحص إطلاقاً في هذه الجلسة.
8. **`.gitignore`** — تأكد أن `.app_runtime`, `*.env*`, و `Bot/backend/.wa_session_data` فعلاً مستثناة ولم تُرفع لأي مستودع Git سابقاً (فحص تاريخ Git إن وُجد `.git`).
9. **Rate limiting على نقاط نهاية الذكاء الاصطناعي** تحديداً (محادثة البوت) بمعزل عن firewall العام — للحد من تكلفة الاستخدام المفرط لكل مستخدم/IP.

---

## ملاحظة عامة
نقاط القوة الموجودة فعلاً ولا تحتاج تعديل: bcrypt(12) لكلمات المرور، Helmet + CORS allowlist، firewall بأنماط SQLi/XSS/Path Traversal، فصل الأسرار في متغيرات بيئة (لا hardcoded secrets في الكود)، Stripe webhook بتوقيع `constructEvent` صحيح.
