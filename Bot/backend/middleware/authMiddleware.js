const jwt      = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { config }       = require('../config');

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

async function authMiddleware(req, res, next) {
  try {
    // ── الأولوية: httpOnly cookie → Authorization header → query ?token (SSE only) ──
    // الكوكي هو الأكثر أماناً لأنه لا يمكن الوصول إليه عبر JS
    const raw = (req.cookies?.zi_token) ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7).trim()
        : '') ||
      (req.query.token || '').trim();   // SSE fallback — EventSource لا يرسل headers

    if (!raw || raw.length > 2048 || raw.split('.').length !== 3)
      return res.status(401).json({ error: 'غير مصرح' });

    let decoded;
    try { decoded = jwt.verify(raw, config.jwt); }
    catch (e) {
      if (e.name === 'TokenExpiredError') return res.status(401).json({ error: 'انتهت الجلسة' });
      return res.status(401).json({ error: 'توكن غير صالح' });
    }

    if (!decoded.id) return res.status(401).json({ error: 'توكن ناقص' });

    const { data: user, error } = await supabase
      .from('users')
      .select('id, fingerprint, plan, tokens_used, tokens_limit, is_admin, email, is_banned, banned_until')
      .eq('id', decoded.id)
      .single();

    if (error || !user) return res.status(401).json({ error: 'المستخدم غير موجود' });

    if (user.is_banned && (!user.banned_until || new Date(user.banned_until) > new Date())) {
      return res.status(403).json({ error: 'تم حظر هذا الحساب' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[AUTH]', err.message);
    res.status(500).json({ error: 'خطأ في التحقق' });
  }
}

module.exports = authMiddleware;
