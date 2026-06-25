// routes/admin.js — لوحة إدارة SaaS الكاملة
const express = require('express');
const router  = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const { confirmManualPayment } = require('../services/payment');
const { createClient } = require('@supabase/supabase-js');
const { config } = require('../config');
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// ── UUID ──────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validUUID(id) { return UUID_RE.test(String(id||'')); }

// ── سجل تدقيق لكل عملية إدارية حساسة ──────────────────────
async function logAction(req, action, targetId, details = {}) {
  try {
    await supabase.from('audit_logs').insert({
      admin_id: req.user?.id || null, action, target_id: targetId || null,
      details, ip: (req.headers['x-forwarded-for']||'').split(',')[0].trim() || req.socket?.remoteAddress || null,
    });
  } catch (e) { console.error('[AUDIT]', e.message); }
}

// جميع مسارات /api/admin تتطلب صلاحية أدمن
router.use(adminMiddleware);

// ── GET /api/admin/stats ─────────────────────────────────
router.get('/stats', async (_req, res) => {
  try {
    const [usersRes, paymentsRes] = await Promise.all([
      supabase.from('users').select('id,plan,created_at', { count: 'exact' }),
      supabase.from('payments').select('id,plan,amount,currency,status,method,created_at'),
    ]);
    const users    = usersRes.data  || [];
    const payments = paymentsRes.data || [];

    const completedPayments = payments.filter(p => p.status === 'completed');
    const pendingPayments   = payments.filter(p => p.status === 'pending');

    // Fix 9: حُذف سعر الصرف الثابت 3.75
    // الإيراد يُعرض بالعملة الأصلية منفصلاً لمنع أخطاء الحسابات المالية
    const revenueUSD = completedPayments
      .filter(p => !p.currency || p.currency === 'USD')
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const revenueSAR = completedPayments
      .filter(p => p.currency === 'SAR')
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const planCounts = users.reduce((acc, u) => {
      acc[u.plan] = (acc[u.plan] || 0) + 1; return acc;
    }, {});

    // مستخدمون جدد هذا الشهر
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    const newThisMonth = users.filter(u => new Date(u.created_at) >= monthStart).length;

    res.json({
      total_users:        users.length,
      new_this_month:     newThisMonth,
      plan_breakdown:     planCounts,
      paying_users:       (planCounts.basic||0) + (planCounts.pro||0),
      total_revenue_usd:  Math.round(revenueUSD * 100) / 100,
      total_revenue_sar:  Math.round(revenueSAR * 100) / 100,
      pending_payments:   pendingPayments.length,
      completed_payments: completedPayments.length,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/admin/users ─────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1'));
    const limit = Math.min(50, parseInt(req.query.limit || '20'));
    const plan  = req.query.plan;
    const q     = req.query.q?.trim();
    const from  = (page - 1) * limit;

    let query = supabase.from('users')
      .select('id,email,plan,tokens_used,tokens_limit,is_admin,email_verified,created_at,next_reset_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (plan) query = query.eq('plan', plan);
    if (q)    query = query.ilike('email', `%${q}%`);

    const { data, count, error } = await query;
    if (error) throw error;
    res.json({ users: data, total: count, page, limit, pages: Math.ceil(count / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/admin/users/:id/reset-tokens ───────────────
// Bug #14 Fix: _req → req (الاصطلاح _ يعني "غير مستخدم"، لكنه يُستخدم هنا بـ req.params.id)
router.post('/users/:id/reset-tokens', async (req, res) => {
  try {
    const { id } = req.params;
    if (!validUUID(id)) return res.status(400).json({ error: 'معرّف غير صالح' });
    const { data: user } = await supabase.from('users').select('tokens_limit').eq('id', id).single();
    if (!user) return res.status(404).json({ error: 'مستخدم غير موجود' });
    await supabase.from('users').update({ tokens_used: 0 }).eq('id', id);
    await logAction(req, 'reset_tokens', id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/admin/users/:id/ban — حظر مؤقت أو دائم ─────
router.post('/users/:id/ban', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, hours } = req.body; // hours غير موجودة = حظر دائم
    if (!validUUID(id)) return res.status(400).json({ error: 'معرّف غير صالح' });
    if (id === req.user.id) return res.status(400).json({ error: 'لا يمكنك حظر حسابك الخاص' });

    const { data: target } = await supabase.from('users').select('id,is_admin').eq('id', id).single();
    if (!target) return res.status(404).json({ error: 'مستخدم غير موجود' });
    if (target.is_admin) return res.status(403).json({ error: 'لا يمكن حظر حساب أدمن' });

    const banned_until = hours ? new Date(Date.now() + Number(hours) * 60 * 60 * 1000).toISOString() : null;
    await supabase.from('users').update({
      is_banned: true, banned_until, ban_reason: reason ? String(reason).slice(0, 200) : null,
    }).eq('id', id);

    await logAction(req, 'ban_user', id, { permanent: !hours, hours: hours || null, reason: reason || null });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/admin/users/:id/unban ──────────────────────
router.post('/users/:id/unban', async (req, res) => {
  try {
    const { id } = req.params;
    if (!validUUID(id)) return res.status(400).json({ error: 'معرّف غير صالح' });
    await supabase.from('users').update({ is_banned: false, banned_until: null, ban_reason: null }).eq('id', id);
    await logAction(req, 'unban_user', id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/admin/users/:id — حذف نهائي ──────────────
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!validUUID(id)) return res.status(400).json({ error: 'معرّف غير صالح' });
    if (id === req.user.id) return res.status(400).json({ error: 'لا يمكنك حذف حسابك الخاص' });

    const { data: target } = await supabase.from('users').select('id,is_admin,email').eq('id', id).single();
    if (!target) return res.status(404).json({ error: 'مستخدم غير موجود' });
    if (target.is_admin) return res.status(403).json({ error: 'لا يمكن حذف حساب أدمن' });

    await supabase.from('users').delete().eq('id', id);
    await logAction(req, 'delete_user', id, { email: target.email });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/admin/audit-logs ─────────────────────────────
router.get('/audit-logs', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1'));
    const limit = Math.min(50, parseInt(req.query.limit || '20'));
    const from  = (page - 1) * limit;
    const { data, count, error } = await supabase.from('audit_logs')
      .select('id,action,target_id,details,ip,created_at,users!audit_logs_admin_id_fkey(email)', { count: 'exact' })
      .order('created_at', { ascending: false }).range(from, from + limit - 1);
    if (error) throw error;
    res.json({ logs: data, total: count, page, limit, pages: Math.ceil(count / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/admin/payments ──────────────────────────────
router.get('/payments', async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page   || '1'));
    const limit  = Math.min(50, parseInt(req.query.limit  || '20'));
    const status = req.query.status;
    const from   = (page - 1) * limit;

    let query = supabase.from('payments')
      .select(`id,plan,amount,currency,method,status,reference,notes,created_at,confirmed_at,
               users!payments_user_id_fkey(id,email,plan)`, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, count, error } = await query;
    if (error) throw error;
    res.json({ payments: data, total: count, page, limit, pages: Math.ceil(count / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/admin/payments/:id/confirm ────────────────
router.patch('/payments/:id/confirm', async (req, res) => {
  try {
    if (!validUUID(req.params.id)) return res.status(400).json({ error: 'معرّف غير صالح' });
    const result = await confirmManualPayment(req.params.id, req.user.id);
    await logAction(req, 'payment_confirm', req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.message.includes('غير موجود') ? 404 : 400).json({ error: err.message });
  }
});

// ── PATCH /api/admin/payments/:id/reject ─────────────────
router.patch('/payments/:id/reject', async (req, res) => {
  try {
    const { notes } = req.body;
    if (!validUUID(req.params.id)) return res.status(400).json({ error: 'معرّف غير صالح' });
    const { data: pay } = await supabase.from('payments').select('id,status').eq('id', req.params.id).single();
    if (!pay) return res.status(404).json({ error: 'الدفع غير موجود' });
    if (pay.status !== 'pending') return res.status(400).json({ error: 'الدفع ليس قيد الانتظار' });
    await supabase.from('payments').update({
      status: 'failed', notes: notes ? String(notes).slice(0,200) : null,
      updated_at: new Date().toISOString(),
    }).eq('id', req.params.id);
    await logAction(req, 'payment_reject', req.params.id, { notes: notes || null });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/admin/users/:id/warn — إرسال إنذار ──────────
router.post('/users/:id/warn', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!validUUID(id)) return res.status(400).json({ error: 'معرّف غير صالح' });
    if (!message || !String(message).trim()) return res.status(400).json({ error: 'نص الإنذار مطلوب' });
    const { data: user } = await supabase.from('users').select('id,email').eq('id', id).single();
    if (!user) return res.status(404).json({ error: 'مستخدم غير موجود' });
    // حفظ الإنذار في جدول التدقيق
    await logAction(req, 'warn_user', id, { message: String(message).slice(0, 500) });
    // يمكن ربطه بخدمة البريد لإرسال إشعار للمستخدم
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/admin/users/:id/recharge — شحن الباقة ───────
router.post('/users/:id/recharge', async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, tokens } = req.body;
    if (!validUUID(id)) return res.status(400).json({ error: 'معرّف غير صالح' });
    const validPlans = ['free', 'basic', 'pro'];
    if (plan && !validPlans.includes(plan)) return res.status(400).json({ error: 'باقة غير صالحة' });
    const tokenLimit = tokens ? Math.max(100, Math.min(1000000, Number(tokens))) : undefined;
    const update = {};
    if (plan) update.plan = plan;
    if (tokenLimit) { update.tokens_limit = tokenLimit; update.tokens_used = 0; }
    if (!Object.keys(update).length) return res.status(400).json({ error: 'لا توجد تغييرات' });
    const { data: user } = await supabase.from('users').select('id').eq('id', id).single();
    if (!user) return res.status(404).json({ error: 'مستخدم غير موجود' });
    await supabase.from('users').update(update).eq('id', id);
    await logAction(req, 'recharge_user', id, { plan: plan || null, tokens: tokenLimit || null });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/admin/users/:id/toggle-admin ─────────────────
router.post('/users/:id/toggle-admin', async (req, res) => {
  try {
    const { id } = req.params;
    if (!validUUID(id)) return res.status(400).json({ error: 'معرّف غير صالح' });
    if (id === req.user.id) return res.status(400).json({ error: 'لا يمكنك تغيير صلاحياتك الخاصة' });
    const { data: target } = await supabase.from('users').select('id,is_admin,email').eq('id', id).single();
    if (!target) return res.status(404).json({ error: 'مستخدم غير موجود' });
    const newIsAdmin = !target.is_admin;
    await supabase.from('users').update({ is_admin: newIsAdmin }).eq('id', id);
    await logAction(req, newIsAdmin ? 'grant_admin' : 'revoke_admin', id, { email: target.email });
    res.json({ success: true, is_admin: newIsAdmin });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
