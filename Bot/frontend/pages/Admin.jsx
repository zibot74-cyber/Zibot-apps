// pages/Admin.jsx — لوحة إدارة SaaS الكاملة
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/auth.js';

const API = '/api/admin';

// ── أيقونات ───────────────────────────────────────────────
const IconChart    = (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IconUsers    = (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconCard     = (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconSettings = (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IconUserPlus = (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>;
const IconDollar   = (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconClock    = (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconAlertTriangle = (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconCheck    = (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12"/></svg>;
const IconX        = (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconShield   = (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconBan      = (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
const IconWarn     = (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconRecharge = (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IconAdmin    = (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>;
const IconUnban    = (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>;

const TABS = [
  { id: 'stats',    label: 'الإحصائيات', icon: <IconChart /> },
  { id: 'users',    label: 'المستخدمون', icon: <IconUsers /> },
  { id: 'payments', label: 'المدفوعات',  icon: <IconCard />  },
  { id: 'settings', label: 'الإعدادات',  icon: <IconSettings /> },
];

// ── Badge الحالة ─────────────────────────────────────────
function StatusBadge({ status }) {
  const map = { completed: ['#10b981','مكتمل'], pending: ['#f59e0b','قيد الانتظار'], failed: ['#ef4444','مرفوض'], refunded: ['#8b5cf6','مُسترد'] };
  const [color, label] = map[status] || ['#6b7280', status];
  return <span style={{ background:`${color}18`, color, border:`1px solid ${color}30`, borderRadius:6, padding:'3px 10px', fontSize:12, fontWeight:700 }}>{label}</span>;
}

function PlanBadge({ plan }) {
  const map = { free: ['var(--text-muted)','مجاني'], basic: ['#3b82f6','أساسي'], pro: ['#f59e0b','احترافي'] };
  const [color, label] = map[plan] || ['#6b7280', plan];
  return <span style={{ color, fontWeight:700, fontSize:13 }}>{label}</span>;
}

// ── بطاقة إحصائية ────────────────────────────────────────
function StatCard({ icon, label, value, color='var(--accent)' }) {
  return (
    <div className="card" style={{ padding:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:`${color}18`, color, display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</div>
        <span style={{ fontSize:13, color:'var(--text-muted)', fontWeight:600 }}>{label}</span>
      </div>
      <div style={{ fontSize:28, fontWeight:900, color }}>{value}</div>
    </div>
  );
}

// ════════════════════════════════════════
//  مودال إجراءات المستخدم
// ════════════════════════════════════════
function UserActionsModal({ user, onClose, onDone }) {
  const [action,    setAction]    = useState('');
  const [hours,     setHours]     = useState('24');
  const [reason,    setReason]    = useState('');
  const [warnMsg,   setWarnMsg]   = useState('');
  const [plan,      setPlan]      = useState(user.plan || 'basic');
  const [tokens,    setTokens]    = useState(String(user.tokens_limit || 1500));
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState(null);

  const inp = { padding:'9px 13px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text)', fontSize:13, width:'100%', boxSizing:'border-box' };
  const sel = { ...inp };

  async function submit() {
    setLoading(true); setMsg(null);
    try {
      let res, body;
      switch (action) {
        case 'ban_perm':
          res = await apiFetch(`${API}/users/${user.id}/ban`, { method:'POST', body: JSON.stringify({ reason, hours: null }) });
          break;
        case 'ban_temp':
          if (!hours || Number(hours) < 1) { setMsg({ ok:false, text:'أدخل عدد ساعات صحيح' }); setLoading(false); return; }
          res = await apiFetch(`${API}/users/${user.id}/ban`, { method:'POST', body: JSON.stringify({ reason, hours: Number(hours) }) });
          break;
        case 'unban':
          res = await apiFetch(`${API}/users/${user.id}/unban`, { method:'POST' });
          break;
        case 'warn':
          if (!warnMsg.trim()) { setMsg({ ok:false, text:'أدخل نص الإنذار' }); setLoading(false); return; }
          res = await apiFetch(`${API}/users/${user.id}/warn`, { method:'POST', body: JSON.stringify({ message: warnMsg.trim() }) });
          break;
        case 'recharge':
          res = await apiFetch(`${API}/users/${user.id}/recharge`, { method:'POST', body: JSON.stringify({ plan, tokens: Number(tokens) }) });
          break;
        case 'toggle_admin':
          res = await apiFetch(`${API}/users/${user.id}/toggle-admin`, { method:'POST' });
          break;
        default:
          setMsg({ ok:false, text:'اختر إجراء' }); setLoading(false); return;
      }
      const d = await res.json();
      if (d.success) { setMsg({ ok:true, text:'تمّ بنجاح ✓' }); setTimeout(() => { onDone(); onClose(); }, 1200); }
      else setMsg({ ok:false, text: d.error || 'خطأ' });
    } catch(e) { setMsg({ ok:false, text: e.message }); }
    setLoading(false);
  }

  const ACTIONS = [
    { id:'ban_perm',      label:'حظر دائم',         color:'#ef4444', icon:<IconBan />    },
    { id:'ban_temp',      label:'حظر مؤقت',         color:'#f59e0b', icon:<IconClock />  },
    { id:'unban',         label:'رفع الحظر',         color:'#10b981', icon:<IconUnban />  },
    { id:'warn',          label:'إرسال إنذار',       color:'#f97316', icon:<IconWarn />   },
    { id:'recharge',      label:'شحن الباقة',        color:'#3b82f6', icon:<IconRecharge />},
    { id:'toggle_admin',  label: user.is_admin ? 'إزالة صلاحية أدمن' : 'تعيين كأدمن', color:'#8b5cf6', icon:<IconAdmin /> },
  ];

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'var(--bg-card)', borderRadius:20, padding:24, width:'100%', maxWidth:480, border:'1px solid var(--border)', maxHeight:'90vh', overflowY:'auto' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <h2 style={{ fontWeight:800, fontSize:16, marginBottom:4 }}>إعدادات الحساب</h2>
            <p style={{ fontSize:12, color:'var(--text-muted)', direction:'ltr' }}>{user.email}</p>
            {user.is_banned && <span style={{ fontSize:11, background:'rgba(239,68,68,0.1)', color:'#ef4444', borderRadius:6, padding:'2px 8px', marginTop:4, display:'inline-block' }}>محظور حالياً</span>}
            {user.is_admin  && <span style={{ fontSize:11, background:'rgba(139,92,246,0.1)', color:'#8b5cf6', borderRadius:6, padding:'2px 8px', marginTop:4, display:'inline-block', marginRight:4 }}>أدمن</span>}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:20, display:'flex' }}><IconX /></button>
        </div>

        {/* اختيار الإجراء */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:20 }}>
          {ACTIONS.map(a => (
            <button key={a.id} onClick={() => setAction(a.id)} style={{
              padding:'10px 6px', borderRadius:10, border:`1.5px solid ${action===a.id ? a.color : 'var(--border)'}`,
              background: action===a.id ? `${a.color}15` : 'var(--bg-secondary)',
              color: action===a.id ? a.color : 'var(--text-muted)', cursor:'pointer', fontSize:12, fontWeight:700,
              display:'flex', flexDirection:'column', alignItems:'center', gap:5, transition:'all 0.15s',
            }}>
              <span style={{ color: a.color }}>{a.icon}</span>{a.label}
            </button>
          ))}
        </div>

        {/* حقول الإجراء */}
        {action === 'ban_perm' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <label style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600 }}>سبب الحظر (اختياري)</label>
            <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="مخالفة الشروط..." style={inp} maxLength={200} />
          </div>
        )}
        {action === 'ban_temp' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <label style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600 }}>مدة الحظر (بالساعات)</label>
            <input type="number" value={hours} onChange={e=>setHours(e.target.value)} placeholder="24" style={inp} min="1" max="8760" />
            <label style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600 }}>سبب الحظر (اختياري)</label>
            <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="مخالفة الشروط..." style={inp} maxLength={200} />
          </div>
        )}
        {action === 'warn' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <label style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600 }}>نص الإنذار</label>
            <textarea value={warnMsg} onChange={e=>setWarnMsg(e.target.value)} placeholder="تحذير: لقد انتهكت سياسة الاستخدام..." style={{ ...inp, minHeight:90, resize:'vertical' }} maxLength={500} />
          </div>
        )}
        {action === 'recharge' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <label style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600 }}>الباقة الجديدة</label>
            <select value={plan} onChange={e=>setPlan(e.target.value)} style={sel}>
              <option value="free">مجاني</option>
              <option value="basic">أساسي</option>
              <option value="pro">احترافي</option>
            </select>
            <label style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600 }}>حد التوكن الجديد</label>
            <input type="number" value={tokens} onChange={e=>setTokens(e.target.value)} placeholder="1500" style={inp} min="100" max="1000000" />
          </div>
        )}
        {(action === 'unban' || action === 'toggle_admin') && (
          <p style={{ fontSize:13, color:'var(--text-muted)', padding:'10px 14px', background:'var(--bg-secondary)', borderRadius:8 }}>
            {action === 'unban' ? 'سيتم رفع الحظر عن هذا الحساب فوراً.' : user.is_admin ? 'سيتم إزالة صلاحيات الأدمن من هذا الحساب.' : 'سيتم منح هذا الحساب صلاحيات الأدمن الكاملة.'}
          </p>
        )}

        {/* رسالة النتيجة */}
        {msg && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:8, background: msg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: msg.ok ? '#10b981' : '#ef4444', fontSize:13, fontWeight:600, marginTop:14 }}>
            {msg.ok ? <IconCheck /> : <IconX />}{msg.text}
          </div>
        )}

        {/* أزرار */}
        {action && (
          <div style={{ display:'flex', gap:10, marginTop:18 }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ flex:1 }}>إلغاء</button>
            <button onClick={submit} disabled={loading} style={{ flex:2, padding:'10px 0', borderRadius:10, border:'none', background: ACTIONS.find(a=>a.id===action)?.color || 'var(--accent)', color:'#fff', fontWeight:700, fontSize:13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? '...' : ACTIONS.find(a=>a.id===action)?.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  تبويب الإحصائيات
// ════════════════════════════════════════
function StatsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`${API}/stats`).then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign:'center', padding:40 }}><div className="spinner" style={{ margin:'0 auto' }} /></div>;
  if (!data)   return <p style={{ color:'var(--danger)' }}>خطأ في تحميل الإحصائيات</p>;

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:16, marginBottom:24 }}>
        <StatCard icon={<IconUsers />}    label="إجمالي المستخدمين"  value={data.total_users}        color="var(--accent)" />
        <StatCard icon={<IconUserPlus />} label="جدد هذا الشهر"      value={data.new_this_month}     color="#10b981" />
        <StatCard icon={<IconCard />}     label="مستخدمون مدفوعون"   value={data.paying_users}       color="#3b82f6" />
        <StatCard icon={<IconDollar />}   label="الإيرادات (USD)"     value={`$${data.total_revenue_usd}`} color="#f59e0b" />
        <StatCard icon={<IconClock />}    label="مدفوعات منتظرة"      value={data.pending_payments}   color="#ef4444" />
        <StatCard icon={<IconCheck />}    label="مدفوعات مكتملة"      value={data.completed_payments} color="#10b981" />
      </div>
      <div className="card" style={{ padding:20 }}>
        <h3 style={{ fontWeight:700, marginBottom:16, fontSize:15 }}>توزيع الباقات</h3>
        <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
          {Object.entries(data.plan_breakdown || {}).map(([plan, count]) => (
            <div key={plan} style={{ textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:900 }}>{count}</div>
              <PlanBadge plan={plan} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  تبويب المستخدمين
// ════════════════════════════════════════
function UsersTab() {
  const [data, setData]             = useState({ users:[], total:0, pages:1 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [planFilter, setPlanFilter] = useState('');
  const [search, setSearch]         = useState('');
  const [msg, setMsg]               = useState('');
  const [modalUser, setModalUser]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, limit:20, ...(planFilter && { plan:planFilter }), ...(search && { q:search }) });
      const res = await apiFetch(`${API}/users?${q}`);
      setData(await res.json());
    } finally { setLoading(false); }
  }, [page, planFilter, search]);

  useEffect(() => { load(); }, [load]);

  async function resetTokens(userId) {
    const res = await apiFetch(`${API}/users/${userId}/reset-tokens`, { method:'POST' });
    if (res.ok) { setMsg({ ok:true, text:'تم إعادة تعيين التوكن' }); load(); setTimeout(() => setMsg(''), 3000); }
  }

  return (
    <div>
      {msg && <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderRadius:8, background: msg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: msg.ok ? '#10b981' : '#ef4444', marginBottom:16, fontSize:13, fontWeight:600 }}>{msg.ok ? <IconCheck /> : <IconX />}{msg.text}</div>}

      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <input placeholder="بحث بالبريد..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text)', fontSize:13, direction:'ltr', flex:1, minWidth:180 }} />
        <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
          style={{ padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text)', fontSize:13 }}>
          <option value="">كل الباقات</option>
          <option value="free">مجاني</option>
          <option value="basic">أساسي</option>
          <option value="pro">احترافي</option>
        </select>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:40 }}><div className="spinner" style={{ margin:'0 auto' }} /></div> : (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--bg-secondary)' }}>
                {['البريد','الباقة','التوكن','الحالة','الإجراءات'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'right', fontWeight:700, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.users?.map(u => (
                <tr key={u.id} style={{ borderTop:'1px solid var(--border)', background: u.is_banned ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                  <td style={{ padding:'12px 16px', color:'var(--text)', direction:'ltr' }}>
                    {u.email || <span style={{ color:'var(--text-muted)' }}>— بدون بريد</span>}
                    {u.is_admin && <span style={{ fontSize:10, background:'rgba(139,92,246,0.15)', color:'#8b5cf6', borderRadius:4, padding:'1px 5px', marginRight:6 }}>أدمن</span>}
                  </td>
                  <td style={{ padding:'12px 16px' }}><PlanBadge plan={u.plan} /></td>
                  <td style={{ padding:'12px 16px', color:'var(--text-muted)', fontSize:12 }}>{u.tokens_used}/{u.tokens_limit}</td>
                  <td style={{ padding:'12px 16px' }}>
                    {u.is_banned
                      ? <span style={{ fontSize:11, background:'rgba(239,68,68,0.1)', color:'#ef4444', borderRadius:6, padding:'2px 8px', fontWeight:700 }}>محظور</span>
                      : <span style={{ fontSize:11, background:'rgba(16,185,129,0.1)', color:'#10b981', borderRadius:6, padding:'2px 8px', fontWeight:700 }}>نشط</span>
                    }
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize:11, padding:'4px 8px', display:'flex', alignItems:'center', gap:4 }} onClick={() => resetTokens(u.id)} title="إعادة تعيين التوكن"><IconClock style={{ width:12, height:12 }} /></button>
                      <button onClick={() => setModalUser(u)} style={{ padding:'4px 10px', borderRadius:7, border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text)', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                        <IconSettings style={{ width:12, height:12 }} /> إعدادات
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.pages > 1 && (
            <div style={{ display:'flex', gap:8, padding:16, justifyContent:'center' }}>
              <button className="btn btn-ghost btn-sm" disabled={page===1} onClick={() => setPage(p => p-1)}>←</button>
              <span style={{ padding:'6px 12px', fontSize:13, color:'var(--text-muted)' }}>{page} / {data.pages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page===data.pages} onClick={() => setPage(p => p+1)}>→</button>
            </div>
          )}
        </div>
      )}

      {modalUser && <UserActionsModal user={modalUser} onClose={() => setModalUser(null)} onDone={load} />}
    </div>
  );
}

// ════════════════════════════════════════
//  تبويب المدفوعات
// ════════════════════════════════════════
function PaymentsTab() {
  const [data, setData]             = useState({ payments:[], total:0, pages:1 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [msg, setMsg]               = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, limit:20, ...(statusFilter && { status:statusFilter }) });
      const res = await apiFetch(`${API}/payments?${q}`);
      setData(await res.json());
    } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const act = async (id, action) => {
    const res = await apiFetch(`${API}/payments/${id}/${action}`, { method:'PATCH' });
    const d = await res.json();
    if (d.success) { setMsg({ ok:true, text:`تم ${action==='confirm' ? 'تأكيد' : 'رفض'} الدفع` }); load(); }
    else setMsg({ ok:false, text:d.error });
    setTimeout(() => setMsg(''), 4000);
  };

  const METHOD_LABELS = { stripe:'Stripe', paypal:'PayPal', vodafone:'فودافون كاش', orange:'أورنج كاش', etisalat:'اتصالات كاش', instapay:'إنستاباي', bank:'تحويل بنكي' };

  return (
    <div>
      {msg && <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderRadius:8, background: msg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: msg.ok ? '#10b981' : '#ef4444', marginBottom:16, fontSize:13, fontWeight:600 }}>{msg.ok ? <IconCheck /> : <IconX />}{msg.text}</div>}
      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text)', fontSize:13 }}>
          <option value="">كل المدفوعات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="completed">مكتملة</option>
          <option value="failed">مرفوضة</option>
        </select>
      </div>
      {loading ? <div style={{ textAlign:'center', padding:40 }}><div className="spinner" style={{ margin:'0 auto' }} /></div> : (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--bg-secondary)' }}>
                {['المستخدم','الباقة','المبلغ','الطريقة','المرجع','الحالة','التاريخ','الإجراءات'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'right', fontWeight:700, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.payments?.map(p => (
                <tr key={p.id} style={{ borderTop:'1px solid var(--border)' }}>
                  <td style={{ padding:'12px 16px', fontSize:12, direction:'ltr', color:'var(--text-muted)' }}>{p.users?.email || '—'}</td>
                  <td style={{ padding:'12px 16px' }}><PlanBadge plan={p.plan} /></td>
                  <td style={{ padding:'12px 16px', fontWeight:700 }}>{p.amount} {p.currency}</td>
                  <td style={{ padding:'12px 16px', fontSize:12 }}>{METHOD_LABELS[p.method] || p.method}</td>
                  <td style={{ padding:'12px 16px', fontFamily:'monospace', fontSize:12 }}>{p.reference || '—'}</td>
                  <td style={{ padding:'12px 16px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding:'12px 16px', color:'var(--text-muted)', fontSize:12 }}>{new Date(p.created_at).toLocaleDateString('ar')}</td>
                  <td style={{ padding:'12px 16px' }}>
                    {p.status === 'pending' && (
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-sm" style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(16,185,129,0.15)', color:'#10b981', border:'1px solid rgba(16,185,129,0.3)', fontSize:11, padding:'4px 10px' }} onClick={() => act(p.id,'confirm')}><IconCheck /> تأكيد</button>
                        <button className="btn btn-sm" style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)', fontSize:11, padding:'4px 10px' }} onClick={() => act(p.id,'reject')}><IconX /> رفض</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!data.payments?.length && <tr><td colSpan={8} style={{ padding:32, textAlign:'center', color:'var(--text-muted)' }}>لا توجد مدفوعات</td></tr>}
            </tbody>
          </table>
          {data.pages > 1 && (
            <div style={{ display:'flex', gap:8, padding:16, justifyContent:'center' }}>
              <button className="btn btn-ghost btn-sm" disabled={page===1} onClick={() => setPage(p => p-1)}>←</button>
              <span style={{ padding:'6px 12px', fontSize:13, color:'var(--text-muted)' }}>{page} / {data.pages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page===data.pages} onClick={() => setPage(p => p+1)}>→</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════
//  بطاقة حالة واتساب + QR رسمي (في الإعدادات)
// ════════════════════════════════════════
function WhatsAppStatusCard() {
  const [status,  setStatus]  = useState('idle');
  const [qrData,  setQrData]  = useState(null);
  const [errMsg,  setErrMsg]  = useState('');

  async function loadQR() {
    setStatus('loading'); setErrMsg('');
    try {
      const res  = await apiFetch('/api/whatsapp/qr');
      const data = await res.json();
      if (!res.ok || !data.configured) { setStatus('error'); setErrMsg(data.error || 'غير مهيأ'); return; }
      if (!data.qr_url) { setStatus('error'); setErrMsg('لم يُرجع Meta رمز QR — تحقق من WA_PHONE_NUMBER_ID'); return; }
      setQrData(data); setStatus('ready');
    } catch (e) { setStatus('error'); setErrMsg(e.message); }
  }

  return (
    <div className="card" style={{ padding:20 }}>
      <h3 style={{ fontWeight:800, fontSize:14, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
        <IconSettings style={{ color:'#25D366' }} /> واتساب — QR الرسمي (Meta)
      </h3>

      {status === 'idle' && (
        <div style={{ textAlign:'center', padding:'16px 0' }}>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:14 }}>
            اعرض رمز QR الرسمي من Meta لمشاركته مع العملاء
          </p>
          <button className="btn btn-primary btn-sm" onClick={loadQR}>تحميل QR</button>
        </div>
      )}
      {status === 'loading' && (
        <div style={{ textAlign:'center', padding:16 }}><div className="spinner" style={{ margin:'0 auto' }} /></div>
      )}
      {status === 'error' && (
        <div style={{ color:'var(--danger)', fontSize:13, padding:'10px 14px', background:'rgba(239,68,68,0.08)', borderRadius:8, display:'flex', alignItems:'center', gap:8 }}>
          <IconAlertTriangle /> {errMsg}
          <button className="btn btn-ghost btn-sm" style={{ marginRight:'auto' }} onClick={loadQR}>إعادة</button>
        </div>
      )}
      {status === 'ready' && qrData && (
        <div style={{ display:'flex', gap:20, alignItems:'flex-start', flexWrap:'wrap' }}>
          <div style={{ background:'#fff', padding:12, borderRadius:12, border:'2px solid #25D366', flexShrink:0 }}>
            <img src={qrData.qr_url} alt="WhatsApp QR" style={{ width:160, height:160, display:'block' }} />
          </div>
          <div style={{ flex:1, minWidth:180 }}>
            {qrData.verified_name && <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>{qrData.verified_name}</div>}
            {qrData.phone_number  && <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12, direction:'ltr' }}>{qrData.phone_number}</div>}
            <div style={{ fontSize:12, color:'#10b981', padding:'8px 12px', background:'rgba(16,185,129,0.08)', borderRadius:8, border:'1px solid rgba(16,185,129,0.2)', marginBottom:10 }}>
              QR رسمي صادر من Meta — مرتبط مباشرة بالرقم المسجّل
            </div>
            <button className="btn btn-ghost btn-sm" onClick={loadQR} style={{ fontSize:12 }}>تحديث</button>
          </div>
        </div>
      )}
    </div>
  );
}


// ════════════════════════════════════════
//  تبويب الإعدادات
// ════════════════════════════════════════
function SettingsTab() {
  const [info, setInfo]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`${API}/stats`).then(r => r.json()).then(setInfo).finally(() => setLoading(false));
  }, []);

  const row = (label, val, color) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontSize:13, color:'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:700, color: color || 'var(--text)' }}>{val}</span>
    </div>
  );

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:20 }}>
      {/* معلومات النظام */}
      <div className="card" style={{ padding:20 }}>
        <h3 style={{ fontWeight:800, fontSize:14, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}><IconShield style={{ color:'#8b5cf6' }} />أمان المفاتيح</h3>
        {row('موقع مفاتيح API', '.app_runtime (مشفّر)', '#10b981')}
        {row('تتبع Git', 'مستثنى عبر .gitignore', '#10b981')}
        {row('إمكانية الوصول من الفرونت', 'مسدودة — Server-only', '#10b981')}
        {row('بروتوكول التحميل', 'dotenv → process.env', '#3b82f6')}
        <div style={{ marginTop:14, padding:12, background:'rgba(16,185,129,0.06)', borderRadius:8, border:'1px solid rgba(16,185,129,0.2)' }}>
          <p style={{ fontSize:12, color:'#10b981', lineHeight:1.7, margin:0 }}>
            ✓ جميع مفاتيح API محفوظة في ملف <code>.app_runtime</code> على السيرفر فقط.<br/>
            ✓ لا يُعرض أي مفتاح للفرونت إند أو الشبكة.<br/>
            ✓ يُستحسن تدوير المفاتيح كل 90 يوماً.
          </p>
        </div>
      </div>

      {/* الإحصائيات السريعة */}
      <div className="card" style={{ padding:20 }}>
        <h3 style={{ fontWeight:800, fontSize:14, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}><IconChart style={{ color:'var(--accent)' }} />لمحة سريعة</h3>
        {loading ? <div className="spinner" style={{ margin:'20px auto' }} /> : info && (<>
          {row('إجمالي المستخدمين',  info.total_users, 'var(--accent)')}
          {row('جدد هذا الشهر',       info.new_this_month, '#10b981')}
          {row('مدفوعات منتظرة',      info.pending_payments, info.pending_payments > 0 ? '#f59e0b' : 'var(--text)')}
          {row('إيرادات USD',          `$${info.total_revenue_usd}`, '#f59e0b')}
        </>)}
      </div>

      {/* حالة واتساب + QR الرسمي */}
      <WhatsAppStatusCard />

      {/* دليل الإجراءات */}
      <div className="card" style={{ padding:20, gridColumn:'1 / -1' }}>
        <h3 style={{ fontWeight:800, fontSize:14, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}><IconAdmin style={{ color:'#3b82f6' }} />دليل إجراءات الإدارة</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
          {[
            { icon:<IconBan style={{ color:'#ef4444' }} />, title:'حظر دائم', desc:'يمنع المستخدم من تسجيل الدخول نهائياً حتى رفع الحظر يدوياً.' },
            { icon:<IconClock style={{ color:'#f59e0b' }} />, title:'حظر مؤقت', desc:'يمنع الوصول لفترة محددة بالساعات ثم يُرفع تلقائياً.' },
            { icon:<IconUnban style={{ color:'#10b981' }} />, title:'رفع الحظر', desc:'يُعيد الحساب المحظور إلى الوضع الطبيعي فوراً.' },
            { icon:<IconWarn style={{ color:'#f97316' }} />, title:'إرسال إنذار', desc:'يرسل رسالة تحذير للمستخدم وتُسجَّل في سجل التدقيق.' },
            { icon:<IconRecharge style={{ color:'#3b82f6' }} />, title:'شحن الباقة', desc:'يغيّر الباقة ويضبط حد التوكن بشكل فوري.' },
            { icon:<IconAdmin style={{ color:'#8b5cf6' }} />, title:'تعيين/إزالة أدمن', desc:'يمنح أو يسحب صلاحيات لوحة الإدارة الكاملة.' },
          ].map((item, i) => (
            <div key={i} style={{ padding:14, background:'var(--bg-secondary)', borderRadius:10, border:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>{item.icon}<strong style={{ fontSize:13 }}>{item.title}</strong></div>
              <p style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6, margin:0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  الصفحة الرئيسية للأدمن
// ════════════════════════════════════════
export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <div style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border)', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#ef4444,#dc2626)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}><IconShield /></div>
          <div>
            <h1 style={{ fontSize:16, fontWeight:800 }}>لوحة الإدارة</h1>
            <p style={{ fontSize:12, color:'var(--text-muted)' }}>ZIbot Admin Panel</p>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>← الداشبورد</button>
      </div>

      <div style={{ borderBottom:'1px solid var(--border)', background:'var(--bg-card)', padding:'0 24px', display:'flex', gap:4, overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
            padding:'14px 20px', fontSize:13, fontWeight:600, background:'none', border:'none',
            borderBottom: tab===t.id ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab===t.id ? 'var(--accent)' : 'var(--text-muted)', cursor:'pointer', transition:'all 0.2s',
          }}>{t.icon}{t.label}</button>
        ))}
      </div>

      <div style={{ padding:24, maxWidth:1200, margin:'0 auto' }}>
        {tab==='stats'    && <StatsTab />}
        {tab==='users'    && <UsersTab />}
        {tab==='payments' && <PaymentsTab />}
        {tab==='settings' && <SettingsTab />}
      </div>
    </div>
  );
}
