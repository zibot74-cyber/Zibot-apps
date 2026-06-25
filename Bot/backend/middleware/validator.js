const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
function err(res, msg, field = null) { return res.status(400).json({ error: msg, field }); }
function isStr(v) { return typeof v === 'string'; }
function notEmpty(v) { return isStr(v) && v.trim().length > 0; }
function maxLen(v, n) { return !isStr(v) || v.length <= n; }
function sanitize(s, max = 1000) {
  if (!isStr(s)) return '';
  // eslint-disable-next-line no-control-regex
  return s.replace(/<[^>]*>/g,'').replace(/\0/g,'').replace(/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]/g,'').trim().slice(0, max);
}

function validateRegister(req, res, next) {
  const { email, password, name } = req.body;
  if (!notEmpty(email))               return err(res, 'الإيميل مطلوب', 'email');
  if (!EMAIL_RE.test(email.trim()))   return err(res, 'صيغة الإيميل غير صحيحة', 'email');
  if (email.length > 254)             return err(res, 'الإيميل طويل', 'email');
  if (!notEmpty(password))            return err(res, 'كلمة المرور مطلوبة', 'password');
  if (password.length < 8)            return err(res, 'كلمة المرور 8 أحرف على الأقل', 'password');
  if (password.length > 128)          return err(res, 'كلمة المرور طويلة', 'password');
  if (name !== undefined && !maxLen(name, 100)) return err(res, 'الاسم طويل', 'name');
  req.body.email = email.trim().toLowerCase();
  if (name) req.body.name = sanitize(name, 100);
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!notEmpty(email))           return err(res, 'الإيميل مطلوب', 'email');
  if (!EMAIL_RE.test(email.trim())) return err(res, 'صيغة الإيميل غير صحيحة', 'email');
  if (!notEmpty(password))        return err(res, 'كلمة المرور مطلوبة', 'password');
  if (password.length > 128)      return err(res, 'بيانات غير صالحة', 'password');
  req.body.email = email.trim().toLowerCase();
  next();
}

function validateRefresh(req, res, next) {
  const { token } = req.body;
  if (!notEmpty(token) || token.length > 2048) return err(res, 'التوكن غير صالح', 'token');
  next();
}

function validateSettings(req, res, next) {
  const { business_name, description, products, working_hours, location, tone, dialect, custom_rules, fb_page_id } = req.body;
  if (!notEmpty(business_name))       return err(res, 'اسم البيزنس مطلوب', 'business_name');
  if (!maxLen(business_name, 100))    return err(res, 'الاسم طويل', 'business_name');
  if (description  && !maxLen(description,  1000)) return err(res, 'الوصف طويل', 'description');
  if (products     && !maxLen(products,     2000))  return err(res, 'قائمة المنتجات طويلة', 'products');
  if (working_hours&& !maxLen(working_hours,200))   return err(res, 'أوقات العمل طويلة', 'working_hours');
  if (location     && !maxLen(location,     300))   return err(res, 'الموقع طويل', 'location');
  if (custom_rules && !maxLen(custom_rules, 2000))  return err(res, 'التعليمات طويلة', 'custom_rules');
  if (fb_page_id   && !/^\d{1,50}$/.test(String(fb_page_id).trim())) return err(res, 'fb_page_id غير صالح', 'fb_page_id');
  req.body.business_name = sanitize(business_name, 100);
  if (description)   req.body.description   = sanitize(description,  1000);
  if (products)      req.body.products       = sanitize(products,     2000);
  if (working_hours) req.body.working_hours  = sanitize(working_hours,200);
  if (location)      req.body.location       = sanitize(location,     300);
  if (tone)          req.body.tone           = sanitize(tone,         100);
  if (dialect)       req.body.dialect        = sanitize(dialect,      100);
  if (custom_rules)  req.body.custom_rules   = sanitize(custom_rules, 2000);
  next();
}

function validateIdentify(req, res, next) {
  const { fingerprint } = req.body;
  if (!fingerprint || typeof fingerprint !== 'string')          return err(res, 'fingerprint مطلوب', 'fingerprint');
  if (!/^[a-fA-F0-9]{64}$/.test(fingerprint) && !/^[a-zA-Z0-9\-_]{32,128}$/.test(fingerprint))
    return err(res, 'fingerprint غير صالح', 'fingerprint');
  next();
}

module.exports = { validateRegister, validateLogin, validateRefresh, validateSettings, validateIdentify };
