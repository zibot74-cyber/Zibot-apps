// ════════════════════════════════════════
//  setup-first-business.js
//  إعداد أول بيزنس في النظام الجديد
//  (نظام Fingerprint — بدون email/password)
//
//  الاستخدام: node setup-first-business.js
// ════════════════════════════════════════

require('./config');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const BUSINESS_NAME = 'ZIbot';
const DIALECT       = 'مصري';
const TONE          = 'ودّي ومحترف';

async function setup() {
  console.log('🚀 بدء الإعداد الأولي...\n');

  // ── تحقق هل يوجد مستخدم بالفعل ──────────
  const { data: existing, error: listErr } = await supabase
    .from('users')
    .select('id, fingerprint, plan')
    .limit(1)
    .single();

  if (listErr && listErr.code !== 'PGRST116') {
    console.error('❌ خطأ في الاتصال بـ Supabase:', listErr.message);
    console.error('   تأكد من صحة SUPABASE_URL و SUPABASE_KEY في .app_runtime');
    process.exit(1);
  }

  let userId;

  if (existing) {
    console.log(`✅ مستخدم موجود: id=${existing.id} plan=${existing.plan}`);
    userId = existing.id;

    // ترقية لـ Pro إذا لم يكن كذلك
    if (existing.plan !== 'pro') {
      await supabase
        .from('users')
        .update({ plan: 'pro', tokens_limit: 999999 })
        .eq('id', userId);
      console.log('✅ تم ترقية الخطة إلى Pro');
    }
  } else {
    // ── إنشاء مستخدم تجريبي (fingerprint = 'setup_default') ──
    const dummyFP = 'setup_default_' + Date.now().toString(36).padEnd(50, '0');
    const { data: newUser, error: insertErr } = await supabase
      .from('users')
      .insert({
        fingerprint:  dummyFP,
        plan:         'pro',
        tokens_used:  0,
        tokens_limit: 999999,
        metadata:     { source: 'setup-script' },
        created_at:   new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('❌ فشل إنشاء المستخدم:', insertErr.message);
      process.exit(1);
    }

    userId = newUser.id;
    console.log(`✅ تم إنشاء مستخدم تجريبي: ${userId}`);
  }

  await ensureBusiness(userId);
}

async function ensureBusiness(userId) {
  const { data: biz } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (biz) {
    await supabase
      .from('businesses')
      .update({ wa_connected: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    console.log('✅ البيزنس موجود — تم تفعيل wa_connected');
    printSummary();
    return;
  }

  const { error: bizErr } = await supabase
    .from('businesses')
    .insert({
      user_id:      userId,
      wa_connected: true,
      settings: {
        business_name: BUSINESS_NAME,
        dialect:       DIALECT,
        tone:          TONE,
        description:   'خدمة عملاء ذكية مدعومة بالذكاء الاصطناعي',
        products:      '',
        working_hours: '',
        location:      '',
        custom_rules:  '',
      },
      updated_at: new Date().toISOString(),
    });

  if (bizErr) {
    console.error('❌ فشل إنشاء البيزنس:', bizErr.message);
    process.exit(1);
  }

  console.log(`✅ تم إنشاء البيزنس: ${BUSINESS_NAME}`);
  printSummary();
}

function printSummary() {
  console.log('\n══════════════════════════════════');
  console.log('✅ الإعداد مكتمل! يمكنك الآن:');
  console.log('   node server.js   ← شغّل السيرفر + واتساب');
  console.log('   ثم افتح المتصفح على: http://localhost:3000');
  console.log('══════════════════════════════════\n');
}

setup().catch(err => {
  console.error('❌ خطأ غير متوقع:', err.message);
  process.exit(1);
});
