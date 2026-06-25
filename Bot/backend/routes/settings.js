const express      = require('express');
const router       = express.Router();
const { createClient }     = require('@supabase/supabase-js');
const authMiddleware       = require('../middleware/authMiddleware');
const { validateSettings } = require('../middleware/validator');
const { config }           = require('../config');

const supabase = createClient(config.supabaseUrl, config.supabaseKey);
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('businesses').select('*').eq('user_id', req.user.id).single();
    if (error) return res.status(404).json({ error: 'لا يوجد بيزنس مسجل' });
    res.json({ business: data });
  } catch { res.status(500).json({ error: 'خطأ في السيرفر' }); }
});

router.post('/', validateSettings, async (req, res) => {
  try {
    const { business_name, description, products, working_hours, location, tone, dialect, custom_rules, fb_page_id } = req.body;
    const settings = { business_name, description: description||'', products: products||'', working_hours: working_hours||'', location: location||'', tone: tone||'ودّي ومحترف', dialect: dialect||'عربي فصيح', custom_rules: custom_rules||'' };
    const { data, error } = await supabase.from('businesses')
      .upsert({ user_id: req.user.id, fb_page_id: fb_page_id||null, settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select().single();
    if (error) throw error;
    res.json({ success: true, business: data });
  } catch (err) { console.error('🔴 settings:', err.message); res.status(500).json({ error: 'فشل حفظ الإعدادات' }); }
});

router.get('/usage', async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('tokens_used, tokens_limit, plan').eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    const { count } = await supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('user_id', req.user.id).eq('role', 'assistant');
    if (!res.headersSent) res.json({ plan: user.plan, tokens_used: user.tokens_used, tokens_limit: user.tokens_limit, tokens_left: user.tokens_limit - user.tokens_used, percent_used: Math.round((user.tokens_used / Math.max(1, user.tokens_limit)) * 100), total_replies: count || 0 });
  } catch { if (!res.headersSent) res.status(500).json({ error: 'خطأ في الإحصائيات' }); }
});

router.get('/conversations', async (req, res) => {
  try {
    const { data } = await supabase.from('conversations').select('sender_id, role, content, channel, created_at').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(50);
    if (!res.headersSent) res.json({ conversations: data || [] });
  } catch { if (!res.headersSent) res.status(500).json({ error: 'خطأ في المحادثات' }); }
});

router.post('/connect-whatsapp', async (req, res) => {
  try {
    const { data: existing } = await supabase.from('businesses').select('id').eq('user_id', req.user.id).single();
    if (!existing) {
      await supabase.from('businesses').insert({ user_id: req.user.id, wa_connected: true, settings: { business_name: 'My Business', tone: 'ودّي ومحترف', dialect: 'عربي فصيح' }, updated_at: new Date().toISOString() });
    } else {
      await supabase.from('businesses').update({ wa_connected: true, updated_at: new Date().toISOString() }).eq('user_id', req.user.id);
    }
    res.json({ success: true });
  } catch (err) { console.error('🔴 connect-wa:', err.message); res.status(500).json({ error: 'فشل' }); }
});

router.post('/disconnect-whatsapp', async (req, res) => {
  try {
    await supabase.from('businesses').update({ wa_connected: false, updated_at: new Date().toISOString() }).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { console.error('🔴 disconnect-wa:', err.message); res.status(500).json({ error: 'فشل' }); }
});

module.exports = router;
