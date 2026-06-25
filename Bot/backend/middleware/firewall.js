// middleware/firewall.js — جدار الحماية الكامل
'use strict';
const crypto    = require('crypto');
const BLOCKED   = new Map();   // ip → unblock timestamp
const STRIKES   = new Map();
const STRIKE_MAX = 10;
const STRIKE_TTL = 10 * 60 * 1000;   // 10 دقائق
const BLOCK_TTL  = 60 * 60 * 1000;   // ساعة كاملة (مضاعفة من 30 دقيقة)

// ── تنظيف دوري كل 10 دقائق ───────────────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [ip, until] of BLOCKED)  if (now >= until)         { BLOCKED.delete(ip);  }
  for (const [ip, e]    of STRIKES)   if (now - e.firstAt > STRIKE_TTL * 3) { STRIKES.delete(ip); }
}, 10 * 60 * 1000);

// ── حد أقصى لحجم الخرائط (منع تراكم IPs كثيرة) ──────────
const MAP_MAX = 10_000;
function trimMap(map) { if (map.size > MAP_MAX) { const first = map.keys().next().value; map.delete(first); } }

function getIP(req) {
  // Fix #2: use req.ip — Express resolves this correctly when `trust proxy: 1` is set in server.js.
  // Reading X-Forwarded-For directly was spoofable by any client.
  const raw = req.ip || req.socket?.remoteAddress || '';
  return raw.replace(/^::ffff:/, '').slice(0, 45); // IPv4/IPv6 max 45 chars
}

function strike(ip, reason) {
  const now = Date.now();
  const e   = STRIKES.get(ip) || { count: 0, firstAt: now };
  if (now - e.firstAt > STRIKE_TTL) { e.count = 0; e.firstAt = now; }
  e.count++;
  STRIKES.set(ip, e);
  trimMap(STRIKES);
  if (e.count >= STRIKE_MAX) {
    BLOCKED.set(ip, now + BLOCK_TTL);
    trimMap(BLOCKED);
    console.warn(`🔴 [FW] حظر ساعة: ${ip} — ${reason}`);
  } else {
    console.warn(`⚠️ [FW] ضربة #${e.count} — ${ip} — ${reason}`);
  }
}

// ── أنماط التهديدات ────────────────────────────────────────
const BAD_PATTERNS = [
  // SQL Injection — تركيبة حقن حقيقية، مش مجرد كلمة إنجليزية لوحدها
  // (النسخة القديمة كانت بتحظر أي نص فيه "select" أو "union" أو "delete" بمفردها
  //  → بتضرب أسماء/أوصاف بيزنس شرعية زي "Union Bakery" أو "Select your plan" وتدّي strike حقيقي)
  /\bunion\b\s+(\ball\b\s+)?\bselect\b/i,
  /\bselect\b[\s\S]{0,60}\bfrom\b/i,
  /['"]\s*(or|and)\s*['"]?\s*\d+\s*['"]?\s*=\s*['"]?\s*\d+/i,
  /;\s*(drop|delete|truncate)\s+\btable\b/i,
  /\bxp_cmdshell\b|\bsp_executesql\b/i,
  // Path Traversal
  /\.\.[/\\]/,
  // XSS
  /<script[\s>]/i,
  /javascript:/i,
  /on\w+\s*=/i,
  // NoSQL Injection — \b يمنع تطابق جزئي (مثلاً "$info" كانت بتطابق "$in" غلط)
  /\$where\b|\$gt\b|\$lt\b|\$ne\b|\$in\b/,
  // Shell injection
  /[;&|`$](?:bash|sh|cmd|powershell)/i,
];

const BLOCKED_PATHS = [
  '/.env', '/.git', '/wp-admin', '/phpinfo', '/admin.php',
  '/config.php', '/web.config', '/.htaccess', '/xmlrpc.php',
  '/wp-login', '/shell', '/eval-stdin', '/.ssh', '/proc/',
  '/etc/passwd', '/windows/system32',
];

const BLOCKED_UA = [
  /sqlmap/i, /nikto/i, /nessus/i, /masscan/i,
  /nuclei/i, /acunetix/i, /dirbuster/i, /gobuster/i,
  /zgrab/i,  /scrapy/i,  /python-requests/i,
];

function firewall(req, res, next) {
  const ip = getIP(req);
  req.requestId = crypto.randomBytes(8).toString('hex');
  res.setHeader('X-Request-Id', req.requestId);

  // ── فحص الحظر ─────────────────────────────────────────
  const until = BLOCKED.get(ip);
  if (until) {
    if (Date.now() < until) return res.status(403).json({ error: 'تم حظر هذا العنوان مؤقتاً' });
    BLOCKED.delete(ip);
  }

  const ua   = (req.headers['user-agent'] || '').slice(0, 512);
  const path = (req.path || '').toLowerCase().slice(0, 1024);

  // ── User-Agent ضار ────────────────────────────────────
  if (BLOCKED_UA.some(p => p.test(ua))) {
    strike(ip, `bad UA: ${ua.slice(0, 40)}`);
    return res.status(403).json({ error: 'مرفوض' });
  }

  // ── مسارات محظورة ─────────────────────────────────────
  if (BLOCKED_PATHS.some(b => path.includes(b))) {
    strike(ip, `bad path: ${path.slice(0, 60)}`);
    return res.status(403).json({ error: 'مرفوض' });
  }

  // ── فحص الـ payload ───────────────────────────────────
  const payloads = [
    req.query   ? JSON.stringify(req.query).slice(0, 2000)   : '',
    req.body    ? JSON.stringify(req.body).slice(0, 2000)    : '',
    path,
  ];
  for (const payload of payloads) {
    if (BAD_PATTERNS.some(p => p.test(payload))) {
      strike(ip, `malicious payload`);
      return res.status(400).json({ error: 'طلب غير صالح' });
    }
  }

  // ── منع ملفات الخريطة المصدرية ────────────────────────
  if (path.endsWith('.map')) return res.status(403).end();

  // ── منع الملفات المخفية ───────────────────────────────
  const filename = path.split('/').pop() || '';
  if (filename.startsWith('.')) return res.status(403).end();

  next();
}

function blockIP(ip)   { BLOCKED.set(ip, Date.now() + BLOCK_TTL); console.log(`🔴 [FW] حظر يدوي: ${ip}`); }
function unblockIP(ip) { BLOCKED.delete(ip); STRIKES.delete(ip); }
function getStats()    { return { blockedIPs: BLOCKED.size, activeStrikes: STRIKES.size }; }

module.exports = { firewall, blockIP, unblockIP, getStats };
