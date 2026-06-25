// services/cron.js — مهام الجدولة الدورية (منطق مُصحَّح)
'use strict';
const cron     = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const { config }       = require('../config');
const { sendEmail }    = require('./email');

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// ─────────────────────────────────────────────────────────
//  دالة إضافة شهر تقويمي دقيق — تحلّ مشكلة الانجراف
//  مثال: 31 يناير + شهر = 28 فبراير (ليس 3 مارس)
// ─────────────────────────────────────────────────────────
function addOneCalendarMonth(from = new Date()) {
  const d   = new Date(from);
  const day = d.getDate(); // احتفظ بيوم الاشتراك الأصلي
  d.setMonth(d.getMonth() + 1);
  // تصحيح الحافة: إذا تغير اليوم (مثل 31 يناير → 3 مارس) ارجع للآخر
  if (d.getDate() !== day) d.setDate(0);
  return d;
}

// ─────────────────────────────────────────────────────────
//  منطق التوكنز الصحيح:
//
//  ● مستخدم مجاني:  reset فقط (tokens_used = 0)
//  ● مستخدم مدفوع: انتهى الشهر المدفوع → يرجع لـ free تلقائياً
//    لا يُمكنه الاستمرار على الباقة المدفوعة بدون دفع جديد
// ─────────────────────────────────────────────────────────
async function processSubscriptions() {
  const now = new Date();
  const nowISO = now.toISOString();

  const nextReset = addOneCalendarMonth(now).toISOString();
  let resetCount = 0, downgradeCount = 0, totalProcessed = 0;
  const BATCH = 100;   // معالجة دفعات — يمنع تحميل DB دفعة واحدة
  // معرّفات المستخدمين اللي فشل تحديثهم — لازم نستثنيهم من كل استعلام
  // جديد، وإلا هيفضلوا في صدارة range(0, BATCH-1) للأبد ويعلّقوا الحلقة.
  const failedIds = new Set();

  // نستمر حتى ننتهي من كل المستخدمين الذين انتهت دورتهم
  while (true) {
    let query = supabase
      .from('users')
      .select('id, plan, tokens_used, tokens_limit, email, next_reset_at')
      .lte('next_reset_at', nowISO);
    if (failedIds.size) {
      query = query.not('id', 'in', `(${[...failedIds].join(',')})`);
    }
    const { data: users, error } = await query.range(0, BATCH - 1);

    if (error) { console.error('[CRON] خطأ في استعلام المستخدمين:', error.message); break; }
    if (!users?.length) break;

    totalProcessed += users.length;
    const sizeBefore = failedIds.size;

    // Bug #12 Fix: تصحيح المسافات البادئة — الـ for داخل الـ while (كانت 2 مسافات مقابل 6 للجسم)
    for (const user of users) {
      try {
        if (user.plan === 'free') {
          // ── مجاني: reset فقط ───────────────────────────
          await supabase.from('users').update({
            tokens_used:   0,
            next_reset_at: nextReset,
            last_reset_at: nowISO,
          }).eq('id', user.id);
          resetCount++;

        } else {
          // ── مدفوع: انتهت الفترة → رجوع لـ free ─────────
          // لا دفع جديد = لا استمرار للاشتراك
          await supabase.from('users').update({
            plan:          'free',
            tokens_limit:  1500,
            tokens_used:   0,
            next_reset_at: nextReset,
            last_reset_at: nowISO,
          }).eq('id', user.id);
          downgradeCount++;

          // إشعار بالبريد
          if (user.email) {
            await sendEmail(user.email, 'subscriptionExpired', {
              planName: { basic: 'أساسي', pro: 'احترافي' }[user.plan] || user.plan,
            }).catch(() => {});
          }

          console.log(`[CRON] ⬇️ رجّع للـ free: ${user.id}`);
        }
      } catch (e) {
        console.error(`[CRON] خطأ مع ${user.id}:`, e.message);
        failedIds.add(user.id);
      }
    }

    // لو الدفعة كاملة فشلت بدون أي تقدّم فعلي، نوقف بدل ما نلف للأبد
    if (failedIds.size === sizeBefore + users.length) {
      console.error('[CRON] ⚠️ توقف: دفعة كاملة فشلت بدون تقدّم');
      break;
    }

    // تأخير صغير بين الدفعات لتخفيف الضغط
    if (users.length === BATCH) await new Promise(r => setTimeout(r, 200));
  }

  console.log(`[CRON] ✅ إجمالي: ${totalProcessed} | Reset: ${resetCount} | Downgrade: ${downgradeCount}`);
}

// ─────────────────────────────────────────────────────────
//  تحذيرات التوكنز المنخفضة (80% استهلاك)
// ─────────────────────────────────────────────────────────
async function checkLowTokens() {
  const { data: users } = await supabase
    .from('users')
    .select('id, email, plan, tokens_used, tokens_limit')
    .not('email', 'is', null)
    .gt('tokens_used', 0)
    .limit(500);

  if (!users?.length) return;

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);

  for (const u of users) {
    const pct = u.tokens_used / u.tokens_limit;
    if (pct < 0.80) continue;

    // تحقق: هل أُرسل إشعار اليوم بالفعل؟ (منع التكرار)
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', u.id)
      .eq('type', 'low_tokens')
      .gte('created_at', todayStart.toISOString())
      .maybeSingle();
    if (existing) continue;

    // حفظ الإشعار أولاً لمنع إرسال مزدوج
    await supabase.from('notifications').insert({
      user_id: u.id, type: 'low_tokens',
      title: 'رصيد التوكن منخفض',
      body: `تبقى ${u.tokens_limit - u.tokens_used} توكن`,
    }).catch(() => {});

    if (u.email) {
      await sendEmail(u.email, 'lowTokens', {
        remaining: u.tokens_limit - u.tokens_used,
      }).catch(() => {});
    }
  }
}

// ─────────────────────────────────────────────────────────
//  تنظيف جداول الرموز المنتهية
// ─────────────────────────────────────────────────────────
async function cleanupExpiredTokens() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('password_resets').delete().lt('expires_at', cutoff);
  await supabase.from('email_verifications').delete().lt('expires_at', cutoff);
  // تنظيف المدفوعات الفاشلة القديمة جداً (أكثر من 90 يوم)
  const oldCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('payments').delete()
    .eq('status', 'failed').lt('created_at', oldCutoff);
  console.log('[CRON] 🧹 تنظيف مكتمل');
}

// ─────────────────────────────────────────────────────────
//  بدء الجدول الزمني
// ─────────────────────────────────────────────────────────
function startCron() {
  // معالجة الاشتراكات — كل يوم الساعة 2:00 صباحاً
  cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] ▶ معالجة الاشتراكات والتوكنز...');
    await processSubscriptions().catch(e => console.error('[CRON]', e.message));
  }, { timezone: 'Asia/Riyadh' });

  // تحذيرات التوكنز — كل يوم الساعة 10:00 صباحاً
  cron.schedule('0 10 * * *', async () => {
    await checkLowTokens().catch(e => console.error('[CRON] lowTokens:', e.message));
  }, { timezone: 'Asia/Riyadh' });

  // تنظيف — كل أحد الساعة 3:00 صباحاً
  cron.schedule('0 3 * * 0', async () => {
    await cleanupExpiredTokens().catch(e => console.error('[CRON] cleanup:', e.message));
  }, { timezone: 'Asia/Riyadh' });

  console.log('[CRON] ✅ المهام الدورية مفعّلة');
}

module.exports = { startCron, processSubscriptions, addOneCalendarMonth };
