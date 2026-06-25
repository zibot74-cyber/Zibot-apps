// validate-env.js — التحقق من المتغيرات المطلوبة عند البدء
'use strict';

const REQUIRED = ['SUPABASE_URL','SUPABASE_KEY','JWT_SECRET'];
// Bug H Fix: إضافة SMTP_HOST/SMTP_USER/SMTP_PASS إلى WARNINGS
// بدون هذا: السيرفر يبدأ بصمت وكل إيميلات التأكيد/الترحيب/إعادة كلمة المرور تفشل بدون أي تحذير
const WARNINGS = ['AI_PROVIDER','GROQ_API_KEY','SMTP_HOST','SMTP_USER','SMTP_PASS'];

function validateEnv() {
  const missing = REQUIRED.filter(k => !process.env[k]?.trim());
  if (missing.length) {
    console.error('\n❌ متغيرات بيئة مطلوبة مفقودة:');
    missing.forEach(k => console.error(`   • ${k}`));
    console.error('\n📋 انسخ وعبّئ: cp env.text .app_runtime\n');
    process.exit(1);
  }

  const jwt = process.env.JWT_SECRET?.trim() || '';
  if (jwt.length < 32) {
    console.error('❌ JWT_SECRET يجب أن يكون 32 حرف على الأقل');
    process.exit(1);
  }

  // تحقق URL
  try { new URL(process.env.SUPABASE_URL); }
  catch { console.error('❌ SUPABASE_URL غير صالح'); process.exit(1); }

  // تحذيرات اختيارية
  const warnMissing = WARNINGS.filter(k => !process.env[k]?.trim());
  if (warnMissing.length) {
    console.warn('⚠️  متغيرات اختيارية غير مُعيَّنة:', warnMissing.join(', '));
    console.warn('    بعض الميزات قد لا تعمل\n');
  }

  // ⚠️ لا تطبع قيم المتغيرات السرية مطلقاً
  console.log('✅ البيئة صالحة');
}

module.exports = { validateEnv };
