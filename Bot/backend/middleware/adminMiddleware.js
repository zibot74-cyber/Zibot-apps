// middleware/adminMiddleware.js — التحقق من صلاحية الأدمن
const jwt      = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { config }       = require('../config');
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

async function adminMiddleware(req, res, next) {
  try {
    // ── الأولوية: httpOnly cookie → Authorization header ──
    const raw = (req.cookies?.zi_token) ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7).trim()
        : '');
    if (!raw) return res.status(401).json({ error: 'غير مصرح' });

    let decoded;
    try { decoded = jwt.verify(raw, config.jwt); }
    catch { return res.status(401).json({ error: 'توكن غير صالح' }); }

    const { data: user, error } = await supabase
      .from('users').select('id, is_admin, plan, email').eq('id', decoded.id).single();
    if (error || !user) return res.status(401).json({ error: 'المستخدم غير موجود' });
    if (!user.is_admin) return res.status(403).json({ error: 'ليس لديك صلاحية أدمن' });

    req.user  = user;
    req.admin = true;
    next();
  } catch (err) {
    console.error('[ADMIN-MW]', err.message);
    res.status(500).json({ error: 'خطأ في التحقق' });
  }
}

module.exports = adminMiddleware;
