// routes/auth.js — المصادقة الكاملة: Fingerprint + Email/Password
const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const { createClient }     = require('@supabase/supabase-js');
const { config }           = require('../config');
const { validateIdentify, validateLogin, validateRegister } = require('../middleware/validator');
const { sendEmail }        = require('../services/email');
const authMiddleware       = require('../middleware/authMiddleware');

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

const PLAN_TOKENS = { free: 1500, basic: 15_000, pro: 999_999 };
const FP_MAP = new Map();
const FP_MAX = 30, FP_WIN = 15 * 60 * 1000;
setInterval(() => { const now = Date.now(); for (const [k,v] of FP_MAP) if (now - v.firstAt > FP_WIN * 2) FP_MAP.delete(k); }, 15 * 60 * 1000);

// ── Fix #3: Challenge token system — proves HTTP round-trip before /identify ────
// Prevents scripted direct calls with fake fingerprints (no browser required).
const CHALLENGE_SECRET = crypto.randomBytes(32).toString('hex'); // ephemeral per-process
const USED_CHALLENGES  = new Map(); // nonce → expiry (one-time-use enforcement)
const CHALLENGE_TTL    = 5 * 60 * 1000; // 5 minutes

function issueChallenge() {
  const nonce = crypto.randomBytes(16).toString('hex');
  const ts    = Date.now().toString();
  const sig   = crypto.createHmac('sha256', CHALLENGE_SECRET).update(`${nonce}:${ts}`).digest('hex');
  return { nonce, ts, sig };
}

function consumeChallenge(nonce, ts, sig) {
  if (!nonce || !ts || !sig) return false;
  const age = Date.now() - Number(ts);
  if (isNaN(age) || age < 0 || age > CHALLENGE_TTL) return false;
  const expected = crypto.createHmac('sha256', CHALLENGE_SECRET).update(`${nonce}:${ts}`).digest('hex');
  try {
    const a = Buffer.from(sig, 'hex'); const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  } catch { return false; }
  if (USED_CHALLENGES.has(nonce)) return false; // replay protection
  USED_CHALLENGES.set(nonce, Date.now() + CHALLENGE_TTL);
  return true;
}
setInterval(() => { const now = Date.now(); for (const [k, exp] of USED_CHALLENGES) if (now > exp) USED_CHALLENGES.delete(k); }, CHALLENGE_TTL);

// ── Fix #7: Cloudflare Turnstile CAPTCHA verification ───────────────────────────
// Set TURNSTILE_SECRET in .app_runtime to enable. Leave unset to disable (dev mode).
async function verifyCaptcha(token) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret || secret === 'NOT_USED') return true; // disabled in dev
  if (!token || typeof token !== 'string') return false;
  try {
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ secret, response: token.slice(0, 2048) }),
    });
    const data = await resp.json();
    return !!data.success;
  } catch { return false; }
}

// ── خيارات الكوكي الآمن ────────────────────────────────────
// httpOnly يمنع الوصول عبر JS حتى لو نجح XSS
const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path:     '/',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 أيام بالمللي ثانية
};
function setCookie(res, token) { res.cookie('zi_token', token, COOKIE_OPTS); }
function clearCookie(res)      { res.clearCookie('zi_token', { path: '/' }); }

function checkFPLimit(fp) {
  const now = Date.now();
  const e = FP_MAP.get(fp) || { count: 0, firstAt: now };
  if (now - e.firstAt > FP_WIN) { e.count = 0; e.firstAt = now; }
  e.count++; FP_MAP.set(fp, e);
  return e.count <= FP_MAX;
}

function makeToken(user) {
  const payload = { id: user.id, plan: user.plan, is_admin: !!user.is_admin, jti: crypto.randomBytes(16).toString('hex') };
  if (user.fingerprint) payload.fingerprint = user.fingerprint; // only for fingerprint users
  return jwt.sign(payload, config.jwt, { expiresIn: '7d', algorithm: 'HS256' });  // 7d — reduced from 30d for security
}

const pending = new Set();

// ════════════════════════════════════════
//  GET /api/auth/challenge — Fix #3
//  يُصدر رمز challenge موقَّع يجب إرفاقه مع POST /identify
//  يثبت أن الطلب جاء من client أجرى HTTP round-trip حقيقي
// ════════════════════════════════════════
router.get('/challenge', (_req, res) => {
  res.json(issueChallenge());
});

// ════════════════════════════════════════
//  POST /api/auth/identify — بصمة الجهاز
// ════════════════════════════════════════
router.post('/identify', validateIdentify, async (req, res) => {
  try {
    const { fingerprint, metadata, challenge_nonce, challenge_ts, challenge_sig } = req.body;

    // Fix #3: validate server-issued challenge token before creating any account
    if (!consumeChallenge(challenge_nonce, challenge_ts, challenge_sig))
      return res.status(400).json({ error: 'challenge غير صالح أو منتهي الصلاحية — استدعِ GET /api/auth/challenge أولاً' });

    if (!checkFPLimit(fingerprint)) return res.status(429).json({ error: 'طلبات كثيرة' });

    let { data: user, error } = await supabase.from('users')
      .select('id,fingerprint,plan,tokens_used,tokens_limit,is_admin,created_at')
      .eq('fingerprint', fingerprint).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;

    const isNew = !user;
    if (!user) {
      if (pending.has(fingerprint)) {
        await new Promise(r => setTimeout(r, 400));
        const { data: retry } = await supabase.from('users')
          .select('id,fingerprint,plan,tokens_used,tokens_limit,is_admin,created_at')
          .eq('fingerprint', fingerprint).single();
        if (retry) { user = retry; } else return res.status(429).json({ error: 'حاول مرة أخرى' });
      } else {
        pending.add(fingerprint);
        try {
          const safeMeta = metadata && typeof metadata === 'object' ? {
            ua: String(metadata.ua||'').slice(0,200), lang: String(metadata.lang||'').slice(0,10),
            timezone: String(metadata.timezone||'').slice(0,50), platform: String(metadata.platform||'').slice(0,50),
          } : {};
          const { data: nu, error: ie } = await supabase.from('users').insert({
            fingerprint, plan: 'free', tokens_used: 0, tokens_limit: PLAN_TOKENS.free,
            metadata: safeMeta, created_at: new Date().toISOString(),
          }).select('id,fingerprint,plan,tokens_used,tokens_limit,is_admin,created_at').single();
          if (ie) throw ie;
          user = nu;
        } finally { pending.delete(fingerprint); }
      }
    }

    const token = makeToken(user);
    if (!res.headersSent) {
      setCookie(res, token);
      // ملاحظة: لا نُرجع token في JSON — يبقى في httpOnly cookie فقط
      res.json({ success: true, user: { id: user.id, plan: user.plan, tokens_used: user.tokens_used, tokens_limit: user.tokens_limit, is_admin: !!user.is_admin, is_new: isNew } });
    }
  } catch (err) { console.error('[AUTH] identify:', err.message); if (!res.headersSent) res.status(500).json({ error: 'خطأ في المصادقة' }); }
});

// ════════════════════════════════════════
//  POST /api/auth/refresh
// ════════════════════════════════════════
router.post('/refresh', async (req, res) => {
  try {
    // يقرأ من الكوكي أولاً — fallback للـ body للتوافق مع العملاء القديمة
    const token = req.cookies?.zi_token || req.body?.token;
    if (!token || typeof token !== 'string' || token.length > 2048 || token.split('.').length !== 3)
      return res.status(400).json({ error: 'توكن غير صالح' });
    let decoded;
    try { decoded = jwt.verify(token, config.jwt, { ignoreExpiration: true }); }
    catch { return res.status(401).json({ error: 'توكن مزوّر' }); }
    const { data: user, error } = await supabase.from('users')
      .select('id,fingerprint,plan,tokens_used,tokens_limit,is_admin,is_banned,banned_until').eq('id', decoded.id).single();
    if (error || !user) return res.status(401).json({ error: 'المستخدم غير موجود' });
    // BUG FIX: /refresh كان يجدد التوكن حتى لو الحساب محظور — login و authMiddleware
    // يتحققان من is_banned لكن /refresh كان الاستثناء الوحيد الناقص
    if (user.is_banned && (!user.banned_until || new Date(user.banned_until) > new Date()))
      return res.status(403).json({ error: 'تم حظر هذا الحساب' });
    const newToken = makeToken(user);
    setCookie(res, newToken);
    res.json({ success: true, user: { ...user, is_admin: !!user.is_admin } });
  } catch { res.status(401).json({ error: 'خطأ في التجديد' }); }
});

// ════════════════════════════════════════
//  POST /api/auth/register — تسجيل بالبريد
// ════════════════════════════════════════
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Fix #7: Cloudflare Turnstile CAPTCHA (enable by setting TURNSTILE_SECRET)
    if (!await verifyCaptcha(req.body.cf_turnstile_response))
      return res.status(400).json({ error: 'التحقق الأمني فشل — أعد المحاولة' });

    // validation done by validateRegister middleware
    const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
    if (existing) return res.status(409).json({ error: 'البريد الإلكتروني مسجّل مسبقاً' });

    const password_hash = await bcrypt.hash(password, 12);
    const safeName = name ? String(name).slice(0,50) : null;

    const { data: user, error } = await supabase.from('users').insert({
      email: email.toLowerCase(), password_hash, plan: 'free',
      tokens_used: 0, tokens_limit: PLAN_TOKENS.free,
      metadata: { name: safeName }, created_at: new Date().toISOString(),
    }).select('id,plan,tokens_used,tokens_limit,is_admin,email').single();
    if (error) throw error;

    // إنشاء رمز التحقق من البريد
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const expiresAt   = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('email_verifications').insert({ user_id: user.id, token: verifyToken, expires_at: expiresAt });

    // إرسال بريد الترحيب + التحقق
    await sendEmail(email, 'verifyEmail', { token: verifyToken });
    await sendEmail(email, 'welcome', { name: safeName, tokens_limit: PLAN_TOKENS.free });

    const token = makeToken(user);
    setCookie(res, token);
    res.status(201).json({ success: true, user: { id: user.id, plan: user.plan, tokens_used: user.tokens_used, tokens_limit: user.tokens_limit, is_admin: false, email: user.email } });
  } catch (err) { console.error('[AUTH] register:', err.message); res.status(500).json({ error: 'خطأ في التسجيل' }); }
});

// ════════════════════════════════════════
//  POST /api/auth/login — دخول بالبريد
// ════════════════════════════════════════
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fix #7: Cloudflare Turnstile CAPTCHA (enable by setting TURNSTILE_SECRET)
    if (!await verifyCaptcha(req.body.cf_turnstile_response))
      return res.status(400).json({ error: 'التحقق الأمني فشل — أعد المحاولة' });

    // validation done by validateLogin middleware
    const { data: user, error } = await supabase.from('users')
      .select('id,plan,tokens_used,tokens_limit,is_admin,email,password_hash,failed_login_attempts,locked_until,is_banned,banned_until,ban_reason')
      .eq('email', email).limit(1).single(); // validateLogin already lowercased
    if (error || !user || !user.password_hash)
      return res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة' });

    // ── حظر دائم/مؤقت ────────────────────────────────────
    if (user.is_banned) {
      if (!user.banned_until || new Date(user.banned_until) > new Date()) {
        return res.status(403).json({ error: 'تم حظر هذا الحساب' + (user.ban_reason ? `: ${user.ban_reason}` : '') });
      }
      // انتهت مدة الحظر المؤقت — رفعه تلقائياً
      await supabase.from('users').update({ is_banned: false, banned_until: null, ban_reason: null }).eq('id', user.id);
    }

    // ── قفل بعد محاولات فاشلة متكررة (brute-force) ────────
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minsLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(429).json({ error: `محاولات كثيرة فاشلة. حاول بعد ${minsLeft} دقيقة` });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      const update = { failed_login_attempts: attempts };
      if (attempts >= 5) {
        update.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // قفل 15 دقيقة
        update.failed_login_attempts = 0;
      }
      await supabase.from('users').update(update).eq('id', user.id);
      return res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة' });
    }

    // تسجيل دخول ناجح — تصفير العدّاد
    if (user.failed_login_attempts) await supabase.from('users').update({ failed_login_attempts: 0, locked_until: null }).eq('id', user.id);

    const token = makeToken(user);
    setCookie(res, token);
    res.json({ success: true, user: { id: user.id, plan: user.plan, tokens_used: user.tokens_used, tokens_limit: user.tokens_limit, is_admin: !!user.is_admin, email: user.email } });
  } catch (err) { console.error('[AUTH] login:', err.message); res.status(500).json({ error: 'خطأ في تسجيل الدخول' }); }
});

// ════════════════════════════════════════
//  POST /api/auth/logout — مسح الكوكي
// ════════════════════════════════════════
router.post('/logout', (req, res) => {
  clearCookie(res);
  res.json({ success: true });
});

// ════════════════════════════════════════
//  POST /api/auth/forgot-password
// ════════════════════════════════════════
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'أدخل البريد الإلكتروني' });

    // Fix #7: Cloudflare Turnstile CAPTCHA (enable by setting TURNSTILE_SECRET)
    if (!await verifyCaptcha(req.body.cf_turnstile_response))
      return res.status(400).json({ error: 'التحقق الأمني فشل — أعد المحاولة' });

    // نرد بنجاح دائماً لمنع تخمين البريد
    res.json({ success: true, message: 'إذا كان البريد مسجّلاً، ستصل رسالة إعادة التعيين' });

    const { data: user } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
    if (!user) return;

    // حذف الطلبات السابقة
    await supabase.from('password_resets').delete().eq('user_id', user.id);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt  = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // ساعة واحدة
    await supabase.from('password_resets').insert({ user_id: user.id, token: resetToken, expires_at: expiresAt });
    await sendEmail(email, 'resetPassword', { token: resetToken });
  } catch (err) { console.error('[AUTH] forgot:', err.message); }
});

// ════════════════════════════════════════
//  POST /api/auth/reset-password
// ════════════════════════════════════════
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'بيانات ناقصة' });
    if (password.length < 8) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });

    const { data: reset, error } = await supabase.from('password_resets')
      .select('id,user_id,expires_at,used').eq('token', token).single();
    if (error || !reset) return res.status(400).json({ error: 'رمز غير صالح' });
    if (reset.used) return res.status(400).json({ error: 'تم استخدام هذا الرمز مسبقاً' });
    if (new Date(reset.expires_at) < new Date()) return res.status(400).json({ error: 'انتهت صلاحية الرمز' });

    const password_hash = await bcrypt.hash(password, 12);
    await supabase.from('users').update({ password_hash }).eq('id', reset.user_id);
    await supabase.from('password_resets').update({ used: true }).eq('id', reset.id);

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) { console.error('[AUTH] reset:', err.message); res.status(500).json({ error: 'خطأ في إعادة التعيين' }); }
});

// ════════════════════════════════════════
//  GET /api/auth/verify-email/:token
// ════════════════════════════════════════
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { data: ev, error } = await supabase.from('email_verifications')
      .select('id,user_id,expires_at,used').eq('token', token).single();
    if (error || !ev) return res.status(400).json({ error: 'رمز غير صالح' });
    if (ev.used) return res.json({ success: true, already: true });
    if (new Date(ev.expires_at) < new Date()) return res.status(400).json({ error: 'انتهت صلاحية الرمز' });

    await supabase.from('users').update({ email_verified: true }).eq('id', ev.user_id);
    await supabase.from('email_verifications').update({ used: true }).eq('id', ev.id);
    res.json({ success: true });
  } catch (err) { console.error('[AUTH] verify-email:', err.message); res.status(500).json({ error: 'خطأ في التحقق' }); }
});

// ════════════════════════════════════════
//  GET /api/auth/me — بيانات المستخدم الحالي
// ════════════════════════════════════════
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users')
      .select('id,plan,tokens_used,tokens_limit,is_admin,email,email_verified,created_at,next_reset_at')
      .eq('id', req.user.id).single();
    res.json(user);
  } catch { res.status(500).json({ error: 'خطأ' }); }
});

module.exports = router;
