// ════════════════════════════════════════════════════════
//  theme.js  —  نظام الثيم (Dark / Light / System)
//  - بدون flicker عند تحميل الصفحة
//  - يحفظ التفضيل في localStorage
//  - يراقب تغييرات الجهاز تلقائياً
// ════════════════════════════════════════════════════════

export const STORAGE_KEY_THEME = 'zi_theme';
export const LIGHT_CLASS       = 'zi-light';

// ── CSS للوضع الفاتح (يُضاف/يُحذف كـ class على <html>) ──
const LIGHT_CSS = `
  :root {
    --bg:           #f4f4f9;
    --surface:      #ffffff;
    --surface2:     #eeeef6;
    --surface3:     #e4e4f0;
    --border:       #d0d0e0;
    --border2:      #bebece;
    --text:         #1a1a2e;
    --text-muted:   #5a5a80;
    --text-subtle:  #9090b0;
    --shadow:       0 4px 24px rgba(0,0,0,0.08);
    --shadow-sm:    0 2px 12px rgba(0,0,0,0.06);
    --shadow-lg:    0 8px 48px rgba(0,0,0,0.12);
  }
  body {
    background: var(--bg) !important;
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245,158,11,0.04) 0%, transparent 60%) !important;
  }
  nav {
    background: rgba(255,255,255,0.92) !important;
    border-bottom: 1px solid var(--border) !important;
  }
`;

let _styleEl = null;
let _mq      = null;
let _mqListener = null;

/**
 * الثيمات: 'dark' | 'light' | 'system'
 */
function resolveTheme(pref) {
  if (pref === 'light') return 'light';
  if (pref === 'dark')  return 'dark';
  // system
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(resolved) {
  if (resolved === 'light') {
    // قد يكون العنصر موجوداً بالفعل من الـ inline script في index.html
    // (لمنع flicker قبل تحميل هذا الملف) — لازم نعيد استخدامه بدل ما ننشئ
    // نسخة تانية بنفس الـ id، عشان لما نرجع للوضع الداكن نقدر نحذفهم مع بعض.
    if (!_styleEl) {
      _styleEl = document.getElementById('zi-light-theme');
    }
    if (!_styleEl) {
      _styleEl = document.createElement('style');
      _styleEl.id = 'zi-light-theme';
      document.head.appendChild(_styleEl);
    }
    _styleEl.textContent = LIGHT_CSS;
    document.documentElement.classList.add(LIGHT_CLASS);
  } else {
    _styleEl = _styleEl || document.getElementById('zi-light-theme');
    _styleEl?.remove();
    _styleEl = null;
    document.documentElement.classList.remove(LIGHT_CLASS);
  }
}

/**
 * اقرأ التفضيل المحفوظ
 */
export function getSavedThemePref() {
  try {
    const v = localStorage.getItem(STORAGE_KEY_THEME);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch { /* ignore */ }
  return 'system';
}

/**
 * طبّق الثيم وخزّن التفضيل
 */
export function setTheme(pref) {
  try { localStorage.setItem(STORAGE_KEY_THEME, pref); } catch { /* ignore */ }

  // أوقف الاستماع للجهاز إذا تغيّر من system
  if (_mq && _mqListener) {
    _mq.removeEventListener('change', _mqListener);
    _mqListener = null;
  }

  const resolved = resolveTheme(pref);
  applyTheme(resolved);

  // إذا system — راقب تغييرات الجهاز
  if (pref === 'system') {
    _mq = window.matchMedia('(prefers-color-scheme: light)');
    _mqListener = (e) => applyTheme(e.matches ? 'light' : 'dark');
    _mq.addEventListener('change', _mqListener);
  }

  window.dispatchEvent(new CustomEvent('zi:themechange', { detail: { pref, resolved } }));
  return resolved;
}

/**
 * تهيئة أولية عند تحميل الصفحة — يجب استدعاؤها مبكراً لمنع الـ flicker
 */
export function initTheme() {
  const pref = getSavedThemePref();
  setTheme(pref);
}

/**
 * نص زر التبديل
 */
export function getThemeLabel(pref, resolved, t) {
  if (pref === 'system') return resolved === 'dark' ? t('nav_theme_dark') : t('nav_theme_light');
  return pref === 'dark' ? t('nav_theme_dark') : t('nav_theme_light');
}
