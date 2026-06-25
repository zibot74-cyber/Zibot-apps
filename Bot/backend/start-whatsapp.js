/**
 * start-whatsapp.js
 * أداة فحص سريعة للتحقق من أن اعتماديات WhatsApp Cloud API صحيحة
 * قبل تشغيل السيرفر فعلياً.
 *
 * تشغيلها:  npm run verify:whatsapp   (أو: node start-whatsapp.js)
 *
 * ⚠️ ملاحظة مهمة: مع الانتقال إلى Cloud API الرسمي لا حاجة لتشغيل
 * عملية منفصلة لواتساب — لا يوجد QR ولا اتصال دائم (socket).
 * الـ server.js وحده يكفي لاستقبال الرسائل عبر webhook والرد عليها.
 * هذا الملف الآن أداة تشخيص اختيارية فقط.
 */

require('./config'); // يحمّل .app_runtime
const { getStatus } = require('./services/whatsapp');

(async () => {
  console.log('🔎 فحص اعتماديات WhatsApp Cloud API...\n');
  const status = await getStatus();

  if (!status.configured) {
    console.error('❌ غير مُهيأ:', status.error);
    console.error('\n📋 تأكد من تعيين هذه المتغيرات في .app_runtime:');
    console.error('   • WA_CLOUD_TOKEN       (Bearer access token من Meta)');
    console.error('   • WA_PHONE_NUMBER_ID   (Phone Number ID من WhatsApp Manager)');
    console.error('   • WA_BUSINESS_ACCOUNT_ID (WABA ID)');
    console.error('   • WA_VERIFY_TOKEN      (نص اختياري من تأليفك لتأكيد الـ webhook)');
    process.exit(1);
  }

  if (!status.connected) {
    console.error('❌ التوكن أو رقم الهاتف غير صحيح:', status.error);
    process.exit(1);
  }

  console.log('✅ الاعتماديات صحيحة!');
  console.log(`   📞 الرقم: ${status.phone_number}`);
  console.log(`   🏢 الاسم الموثّق: ${status.verified_name}`);
  console.log(`   📊 حد الرسائل (Messaging Limit): ${status.messaging_limit}`);
  console.log('\n👍 شغّل السيرفر الآن: node server.js — وفعّل الـ webhook من Meta App Dashboard.');
  process.exit(0);
})();
