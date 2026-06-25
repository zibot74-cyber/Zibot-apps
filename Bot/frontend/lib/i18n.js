// ════════════════════════════════════════════════════════
//  i18n.js  —  نظام الترجمة (عربي / إنجليزي)
//  يدعم RTL/LTR تلقائياً
//  يحفظ تفضيل اللغة في localStorage
// ════════════════════════════════════════════════════════

export const STORAGE_KEY_LANG = 'zi_lang';

// ════════════════════════════════════════
//  ترجمات عربية
// ════════════════════════════════════════
const ar = {
  // عام
  appName:   'ZIbot',
  appTagline: 'مساعد ذكي لبيزنسك على واتساب وماسنجر',
  loading:   'جاري التحميل...',
  retry:     'إعادة المحاولة',
  save:      'حفظ الإعدادات',
  saving:    'جاري الحفظ...',
  saved:     'تم الحفظ',
  back:      '→ العودة',
  close:     'إغلاق',
  serverError: 'خطأ في الاتصال بالسيرفر',
  serverErrorHint: 'تأكد أن السيرفر يعمل على البورت 3000',
  optional:  'اختياري',
  required:  'مطلوب',
  copyright: 'جميع الحقوق محفوظة © ZIbot 2025',

  // Navbar
  nav_dashboard: 'لوحة التحكم',
  nav_setup:     'إعدادات البيزنس',
  nav_upgrade:   'الباقات',
  nav_theme_dark:  'الوضع الليلي',
  nav_theme_light: 'الوضع الفاتح',
  nav_account:   'معلومات الحساب',
  nav_contact:   'التواصل معنا',
  nav_logout:    'تسجيل الخروج',
  plan_free:     'مجاني',
  plan_basic:    'أساسي',
  plan_pro:      'احترافي',
  account_modal_title: 'معلومات الحساب',
  account_plan:        'الباقة',
  account_device:      'الجهاز',
  account_joined:      'منذ',
  account_device_value: 'هذا الجهاز',

  // Dashboard
  dash_hello:        'مرحباً',
  dash_subtitle:     'هذا ملخص نشاط مساعدك الذكي اليوم',
  dash_upgrade_btn:  'ترقية الباقة',
  dash_replies:      'إجمالي الردود',
  dash_replies_sub:  'منذ بدء الخدمة',
  dash_tokens:       'التوكنز المستهلكة',
  dash_convs:        'المحادثات النشطة',
  dash_convs_sub:    'عملاء مختلفون',
  dash_usage_title:  'استهلاك التوكنز',
  dash_upgrade_now:  'ترقية الآن',
  dash_usage_used:   'توكن مستهلك',
  dash_usage_left:   'متبقي',
  dash_convs_title:  'آخر المحادثات',
  dash_convs_count:  'رسالة إجمالاً',
  dash_no_convs:     'لا توجد محادثات بعد',
  dash_no_convs_hint:'اربط واتساب أو ماسنجر من صفحة الإعدادات',
  dash_setup_btn:    'إعداد البيزنس →',
  dash_msg_count:    'رسالة',
  dash_reply_count:  'رد',
  dash_ago_now:      'الآن',
  dash_ago_min:      'منذ {n} د',
  dash_ago_hour:     'منذ {n} س',
  dash_ago_day:      'منذ {n} يوم',
  dash_tokens_pct:   'التوكنز المستهلكة',

  // Setup
  setup_title:       'إعداد البيزنس',
  setup_subtitle:    'هذه المعلومات تُشكّل شخصية مساعدك الذكي وأسلوب تعامله مع العملاء',
  setup_section_info:    'معلومات النشاط',
  setup_section_persona: 'شخصية المساعد',
  setup_section_wa:      'ربط واتساب',
  setup_section_msg:     'ربط ماسنجر (اختياري)',
  setup_name:        'اسم البيزنس',
  setup_desc:        'وصف النشاط',
  setup_desc_ph:     'اكتب وصفاً مختصراً لما تقدمه...',
  setup_products:    'المنتجات والخدمات',
  setup_products_ph: 'مثال: برجر، بيتزا، مشروبات...',
  setup_products_hint:'يرد عليها المساعد مباشرة',
  setup_hours:       'أوقات العمل',
  setup_hours_ph:    'مثال: ٩ص - ١٢م يومياً',
  setup_location:    'الموقع',
  setup_location_ph: 'مثال: الرياض — حي النخيل',
  setup_tone:        'طابع الرد',
  setup_dialect:     'اللهجة',
  setup_rules:       'تعليمات مخصصة',
  setup_rules_ph:    'مثال: لا تذكر أسعار المنافسين...',
  setup_fb_id:       'معرّف صفحة فيسبوك',
  setup_fb_id_ph:    'Page ID من إعدادات صفحة الفيسبوك',
  setup_name_required: 'اسم البيزنس مطلوب',
  setup_name_ph:     'مثال: مطعم الأصيل',
  qr_request:        'طلب QR Code',
  qr_loading:        'جاري تحميل رمز QR...',
  qr_connected:      'واتساب متصل بنجاح!',
  qr_connected_hint: 'البوت يرد على الرسائل الواردة الآن',
  qr_error:          'تعذر الاتصال بالسيرفر',
  qr_idle_hint:      'اضغط لتوليد رمز QR واربط واتساب بيزنس الخاص بك',
  qr_timer:          'صالح لـ {n} ثانية فقط — ستنتهي صلاحيته',
  qr_steps:          'افتح واتساب بيزنس ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز ← امسح الرمز',
  qr_new:            'توليد QR جديد',

  // Upgrade
  upgrade_title:   'اختر باقتك',
  upgrade_subtitle: 'كل الباقات تشمل ردوداً آلية على واتساب وماسنجر',
  upgrade_current: 'باقتك الحالية',
  upgrade_contact: 'تواصل للترقية',

  // Tones & Dialects
  tone_friendly:  'ودّي ومحترف',
  tone_formal:    'رسمي وجاد',
  tone_fun:       'مرح وخفيف',
  tone_neutral:   'حيادي ومختصر',
  dialect_fus7a:  'عربي فصيح',
  dialect_saudi:  'سعودي',
  dialect_gulf:   'خليجي',
  dialect_egypt:  'مصري',
  dialect_sham:   'شامي',
  dialect_morocc: 'مغربي',
};

// ════════════════════════════════════════
//  ترجمات إنجليزية
// ════════════════════════════════════════
const en = {
  appName:   'ZIbot',
  appTagline: 'AI assistant for your business on WhatsApp & Messenger',
  loading:   'Loading...',
  retry:     'Retry',
  save:      'Save Settings',
  saving:    'Saving...',
  saved:     'Saved',
  back:      '← Back',
  close:     'Close',
  serverError: 'Server connection error',
  serverErrorHint: 'Make sure the server is running on port 3000',
  optional:  'optional',
  required:  'required',
  copyright: 'All rights reserved © ZIbot 2025',

  nav_dashboard: 'Dashboard',
  nav_setup:     'Business Settings',
  nav_upgrade:   'Plans',
  nav_theme_dark:  'Dark Mode',
  nav_theme_light: 'Light Mode',
  nav_account:   'Account Info',
  nav_contact:   'Contact Us',
  nav_logout:    'Sign Out',
  plan_free:     'Free',
  plan_basic:    'Basic',
  plan_pro:      'Pro',
  account_modal_title: 'Account Information',
  account_plan:        'Plan',
  account_device:      'Device',
  account_joined:      'Since',
  account_device_value: 'This Device',

  dash_hello:        'Hello',
  dash_subtitle:     'Here is your AI assistant activity summary',
  dash_upgrade_btn:  'Upgrade Plan',
  dash_replies:      'Total Replies',
  dash_replies_sub:  'Since service started',
  dash_tokens:       'Tokens Used',
  dash_convs:        'Active Conversations',
  dash_convs_sub:    'Unique customers',
  dash_usage_title:  'Token Usage',
  dash_upgrade_now:  'Upgrade Now',
  dash_usage_used:   'tokens used',
  dash_usage_left:   'remaining',
  dash_convs_title:  'Recent Conversations',
  dash_convs_count:  'messages total',
  dash_no_convs:     'No conversations yet',
  dash_no_convs_hint:'Connect WhatsApp or Messenger from the settings page',
  dash_setup_btn:    'Setup Business →',
  dash_msg_count:    'msg',
  dash_reply_count:  'reply',
  dash_ago_now:      'just now',
  dash_ago_min:      '{n}m ago',
  dash_ago_hour:     '{n}h ago',
  dash_ago_day:      '{n}d ago',
  dash_tokens_pct:   'Tokens Consumed',

  setup_title:       'Business Setup',
  setup_subtitle:    'This information shapes your AI assistant personality and how it interacts with customers',
  setup_section_info:    'Business Information',
  setup_section_persona: 'Assistant Personality',
  setup_section_wa:      'Connect WhatsApp',
  setup_section_msg:     'Connect Messenger (optional)',
  setup_name:        'Business Name',
  setup_desc:        'Business Description',
  setup_desc_ph:     'Write a brief description of what you offer...',
  setup_products:    'Products & Services',
  setup_products_ph: 'e.g. Burger, Pizza, Drinks...',
  setup_products_hint:'The assistant replies about these directly',
  setup_hours:       'Working Hours',
  setup_hours_ph:    'e.g. 9AM - 12AM daily',
  setup_location:    'Location',
  setup_location_ph: 'e.g. Riyadh — Al Nakheel',
  setup_tone:        'Reply Tone',
  setup_dialect:     'Dialect',
  setup_rules:       'Custom Instructions',
  setup_rules_ph:    'e.g. Never mention competitor prices...',
  setup_fb_id:       'Facebook Page ID',
  setup_fb_id_ph:    'Page ID from Facebook page settings',
  setup_name_required: 'Business name is required',
  setup_name_ph:     'e.g. Al-Aseel Restaurant',
  qr_request:        'Request QR Code',
  qr_loading:        'Loading QR code...',
  qr_connected:      'WhatsApp Connected Successfully!',
  qr_connected_hint: 'The bot is now replying to incoming messages',
  qr_error:          'Could not connect to server',
  qr_idle_hint:      'Click to generate a QR code and connect your WhatsApp Business',
  qr_timer:          'Valid for {n} seconds — will expire',
  qr_steps:          'Open WhatsApp Business → Settings → Linked Devices → Link Device → Scan code',
  qr_new:            'Generate New QR',

  upgrade_title:   'Choose Your Plan',
  upgrade_subtitle: 'All plans include automated replies on WhatsApp and Messenger',
  upgrade_current: 'Your current plan',
  upgrade_contact: 'Contact to Upgrade',

  tone_friendly:  'Friendly & Professional',
  tone_formal:    'Formal & Serious',
  tone_fun:       'Fun & Light',
  tone_neutral:   'Neutral & Concise',
  dialect_fus7a:  'Modern Standard Arabic',
  dialect_saudi:  'Saudi',
  dialect_gulf:   'Gulf',
  dialect_egypt:  'Egyptian',
  dialect_sham:   'Levantine',
  dialect_morocc: 'Moroccan',
};

// ════════════════════════════════════════
//  I18n Engine
// ════════════════════════════════════════
const translations = { ar, en };

function detectLanguage() {
  // 1. تفضيل محفوظ
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    if (saved === 'ar' || saved === 'en') return saved;
  } catch { /* ignore */ }

  // 2. لغة المتصفح
  const lang = (navigator.language || navigator.userLanguage || 'ar').toLowerCase();
  if (lang.startsWith('ar')) return 'ar';
  return 'en';
}

let _currentLang = detectLanguage();

export function getCurrentLang() { return _currentLang; }
export function isRTL()          { return _currentLang === 'ar'; }

export function setLanguage(lang) {
  if (lang !== 'ar' && lang !== 'en') return;
  _currentLang = lang;
  try { localStorage.setItem(STORAGE_KEY_LANG, lang); } catch { /* ignore */ }
  applyDocumentDir();
  // يطلق event ليسمع كل المكوّنات
  window.dispatchEvent(new CustomEvent('zi:langchange', { detail: { lang } }));
}

export function applyDocumentDir() {
  const dir = isRTL() ? 'rtl' : 'ltr';
  document.documentElement.dir  = dir;
  document.documentElement.lang = _currentLang;
  document.body.style.direction = dir;
}

/**
 * ترجمة مفتاح مع دعم المتغيرات: t('dash_ago_min', { n: 5 }) => 'منذ 5 د'
 */
export function t(key, vars = {}) {
  const dict = translations[_currentLang] || translations.ar;
  let str = dict[key] || translations.ar[key] || key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, v);
  }
  return str;
}

// تطبيق فوري عند تحميل الملف
applyDocumentDir();
