-- ══════════════════════════════════════════════════════════
--  ZIbot — Supabase Schema v2  (كامل ومحدّث)
--  شغّل هذا الملف مرة واحدة في Supabase SQL Editor
-- ══════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- للبحث النصي السريع

-- ══════════════════════════════════════════════════════════
--  جدول المستخدمين
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint     TEXT        UNIQUE,
  email           TEXT        UNIQUE,
  password_hash   TEXT,
  email_verified  BOOLEAN     DEFAULT FALSE,
  is_admin        BOOLEAN     DEFAULT FALSE,
  plan            TEXT        DEFAULT 'free' CHECK (plan IN ('free','basic','pro')),
  tokens_used     INTEGER     DEFAULT 0 CHECK (tokens_used >= 0),
  tokens_limit    INTEGER     DEFAULT 1500 CHECK (tokens_limit > 0),
  metadata        JSONB       DEFAULT '{}',
  next_reset_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
  subscription_end TIMESTAMPTZ,  -- متى تنتهي الباقة المدفوعة (null = مجاني)
  last_reset_at   TIMESTAMPTZ,
  -- ── حماية تسجيل الدخول من الاختراق بالقوة الغاشمة ────────
  failed_login_attempts INTEGER     DEFAULT 0,
  locked_until           TIMESTAMPTZ,
  -- ── الحظر (مؤقت أو دائم) ──────────────────────────────
  is_banned       BOOLEAN     DEFAULT FALSE,
  banned_until    TIMESTAMPTZ,        -- NULL مع is_banned=TRUE = حظر دائم
  ban_reason      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes للبحث السريع
CREATE INDEX IF NOT EXISTS idx_users_fingerprint    ON users (fingerprint);
CREATE INDEX IF NOT EXISTS idx_users_email          ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_plan           ON users (plan);
CREATE INDEX IF NOT EXISTS idx_users_next_reset     ON users (next_reset_at);
CREATE INDEX IF NOT EXISTS idx_users_is_admin       ON users (is_admin) WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_is_banned      ON users (is_banned) WHERE is_banned = TRUE;

-- ══════════════════════════════════════════════════════════
--  سجل تدقيق العمليات الإدارية — Audit Log
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,        -- مثال: 'ban_user', 'plan_change', 'payment_confirm'
  target_id   UUID,                        -- معرّف المستخدم/الدفعة المتأثرة
  details     JSONB       DEFAULT '{}',
  ip          TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_admin   ON audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action  ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);

-- ══════════════════════════════════════════════════════════
--  جدول إعدادات البيزنس
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS businesses (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fb_page_id   TEXT,
  wa_connected BOOLEAN     DEFAULT FALSE,
  settings     JSONB       DEFAULT '{"business_name":"بيزنسي","description":"","products":"","working_hours":"","location":"","tone":"ودّي ومحترف","dialect":"عربي فصيح","custom_rules":""}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_businesses_user ON businesses (user_id);

-- ══════════════════════════════════════════════════════════
--  جدول المحادثات
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS conversations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel     TEXT        DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp','messenger')),
  sender_id   TEXT        NOT NULL,
  role        TEXT        NOT NULL CHECK (role IN ('user','assistant')),
  content     TEXT        NOT NULL,
  tokens_used INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conv_user    ON conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_conv_sender  ON conversations (sender_id);
CREATE INDEX IF NOT EXISTS idx_conv_created ON conversations (created_at DESC);

-- ══════════════════════════════════════════════════════════
--  جدول المدفوعات
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS payments (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan                 TEXT        NOT NULL CHECK (plan IN ('basic','pro')),
  amount               DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency             TEXT        DEFAULT 'USD',
  method               TEXT        NOT NULL CHECK (method IN ('stripe','paypal','vodafone','instapay','bank','manual')),
  status               TEXT        DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  reference            TEXT,                              -- للدفع اليدوي
  notes                TEXT,
  stripe_session_id    TEXT,
  stripe_payment_intent TEXT,
  paypal_order_id      TEXT,
  confirmed_by         UUID        REFERENCES users(id),  -- أدمن أكّد الدفع
  confirmed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pay_user    ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_pay_status  ON payments (status);
CREATE INDEX IF NOT EXISTS idx_pay_stripe  ON payments (stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pay_paypal  ON payments (paypal_order_id)   WHERE paypal_order_id   IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pay_created ON payments (created_at DESC);

-- ══════════════════════════════════════════════════════════
--  جدول إعادة تعيين كلمة المرور
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS password_resets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT        UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pw_reset_token ON password_resets (token);
CREATE INDEX IF NOT EXISTS idx_pw_reset_user  ON password_resets (user_id);

-- ══════════════════════════════════════════════════════════
--  جدول التحقق من البريد الإلكتروني
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS email_verifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT        UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ev_token ON email_verifications (token);

-- ══════════════════════════════════════════════════════════
--  جدول الإشعارات
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL,  -- low_tokens | payment_confirmed | system
  title       TEXT        NOT NULL,
  body        TEXT,
  read        BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications (user_id, read) WHERE read = FALSE;

-- ══════════════════════════════════════════════════════════
--  Row Level Security (RLS)
-- ══════════════════════════════════════════════════════════
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;

-- السيرفر يصل باستخدام service_role key → يتجاوز RLS تلقائياً
-- RLS تحمي الوصول المباشر من الـ client

-- ══════════════════════════════════════════════════════════
--  دالة تحديث updated_at تلقائياً
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_businesses_updated
  BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_payments_updated
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════
--  إنشاء أول أدمن
--  غيّر YOUR_EMAIL بعنوان بريدك الحقيقي
-- ══════════════════════════════════════════════════════════
-- UPDATE users SET is_admin = TRUE WHERE email = 'YOUR_ADMIN_EMAIL@example.com';

-- ══════════════════════════════════════════════════════════
--  فهرسة بريد المستخدمين للبحث
-- ══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_users_email_search ON users USING gin (email gin_trgm_ops);

-- ══════════════════════════════════════════════════════════
--  View مفيد للأدمن — إحصائيات سريعة
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW admin_stats AS
SELECT
  COUNT(*)                                   AS total_users,
  COUNT(*) FILTER (WHERE plan = 'free')      AS free_users,
  COUNT(*) FILTER (WHERE plan = 'basic')     AS basic_users,
  COUNT(*) FILTER (WHERE plan = 'pro')       AS pro_users,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') AS new_last_30d,
  COUNT(*) FILTER (WHERE email IS NOT NULL)  AS email_users
FROM users;


-- ══════════════════════════════════════════════════════════
--  دالة تحديث ذرّي للتوكن — تمنع race condition
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION atomic_increment_tokens(p_user_id UUID, p_amount INTEGER)
RETURNS void AS $$
  UPDATE users
  SET tokens_used = LEAST(tokens_used + p_amount, tokens_limit)
  WHERE id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION atomic_increment_tokens(UUID, INTEGER) TO service_role;

-- ══════════════════════════════════════════════════════════
--  Migration: تشغيل هذا إذا كانت قاعدة البيانات موجودة مسبقاً
-- ══════════════════════════════════════════════════════════
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email           TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified  BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin        BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_reset_at   TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until    TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned       BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_until    TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason      TEXT;

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  target_id   UUID,
  details     JSONB       DEFAULT '{}',
  ip          TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- إصلاح next_reset_at إذا كانت قيمة قديمة خاطئة
UPDATE users SET next_reset_at = NOW() + INTERVAL '1 month'
WHERE next_reset_at IS NULL OR next_reset_at < NOW() - INTERVAL '2 months';

-- ══════════════════════════════════════════════════════════
--  Migration Security: منع Stripe Webhook Replay Attack
--  كل event_id يُعالَج مرة واحدة فقط
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS processed_stripe_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     text        UNIQUE NOT NULL,          -- Stripe event ID (e.g. evt_xxx)
  event_type   text        NOT NULL,
  processed_at timestamptz DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON processed_stripe_events(event_id);
-- تنظيف تلقائي: احذف الأحداث الأقدم من 30 يوماً (نافذة Replay هي 5 دقائق فقط)
CREATE INDEX IF NOT EXISTS idx_stripe_events_at       ON processed_stripe_events(processed_at);

-- ══════════════════════════════════════════════════════════
--  Migration: Paymob — الدفع التلقائي بالمحفظة
--  شغّل هذا الـ migration مرة واحدة على قاعدة البيانات
-- ══════════════════════════════════════════════════════════

-- 1. إصلاح CHECK constraint — إضافة orange وetisalat وpaymob
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE payments
  ADD CONSTRAINT payments_method_check
  CHECK (method IN ('stripe','paypal','vodafone','etisalat','orange','instapay','bank','manual','paymob'));

-- 2. أعمدة Paymob الجديدة (idempotent — IF NOT EXISTS)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS paymob_order_id       TEXT,
  ADD COLUMN IF NOT EXISTS paymob_transaction_id  TEXT,
  ADD COLUMN IF NOT EXISTS payment_phone          TEXT;   -- رقم المحفظة

-- 3. إضافة حقل EGP إلى CHECK على currency (اختياري — يسمح EGP)
-- (currency هو TEXT بدون CHECK — لا حاجة لتعديله)

-- 4. فهارس Paymob
CREATE INDEX IF NOT EXISTS idx_pay_paymob_order ON payments (paymob_order_id) WHERE paymob_order_id IS NOT NULL;
