import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { apiFetch, clearSession, identify } from '../lib/auth.js';
import { t, getCurrentLang } from '../lib/i18n.js';
import { IconMessageCircle, IconZap, IconLayers, IconSmartphone, IconAlertTriangle, IconBot } from '../components/Icons.jsx';

const API = '/api';

function StatCard({ icon, label, value, sub, accent, delay }) {
  return (
    <div className={`card animate-fadeup delay-${delay}`} style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: -20, left: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: accent ? `${accent}18` : 'var(--accent-glow)',
        filter: 'blur(30px)', pointerEvents: 'none',
      }} />
      <div style={{ fontSize: 26, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontSize: 34, fontWeight: 900, color: accent || 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function UsageBar({ used, limit }) {
  const pct   = Math.min(100, Math.round((used / (limit || 1)) * 100));
  const color = pct > 90 ? 'var(--danger)' : pct > 70 ? 'var(--accent)' : 'var(--success)';
  return (
    <div>
      <div className="flex-between" style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
        <span>{t('dash_tokens_pct')}</span>
        <span style={{ color, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ background: 'var(--surface2)', borderRadius: 99, height: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 99, transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
          boxShadow: `0 0 8px ${color}`,
        }} />
      </div>
      <div className="flex-between" style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 6 }}>
        <span>{used.toLocaleString()} {t('dash_usage_used')}</span>
        <span>{(limit - used).toLocaleString()} {t('dash_usage_left')}</span>
      </div>
    </div>
  );
}

function timeAgo(ts) {
  const m = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (m < 1)  return t('dash_ago_now');
  if (m < 60) return t('dash_ago_min',  { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('dash_ago_hour', { n: h });
  return t('dash_ago_day', { n: Math.floor(h / 24) });
}

export default function Dashboard() {
  const navigate  = useNavigate();
  const [usage,    setUsage]    = useState(null);
  const [convs,    setConvs]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(false);
  const [, setTick] = useState(0);

  // إعادة render عند تغيير اللغة
  useEffect(() => {
    const h = () => setTick(n => n + 1);
    window.addEventListener('zi:langchange', h);
    return () => window.removeEventListener('zi:langchange', h);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [uRes, cRes] = await Promise.all([
          apiFetch(`${API}/settings/usage`),
          apiFetch(`${API}/settings/conversations`),
        ]);

        if (uRes.status === 401) {
          // إعادة تسجيل الدخول التلقائي
          await identify();
          if (!cancelled) setTick(n => n + 1);
          return;
        }

        const [u, c] = await Promise.all([uRes.json(), cRes.json()]);
        if (!cancelled) {
          setUsage(u);
          setConvs(c.conversations || []);
        }
      } catch {
        if (!cancelled) setFetchErr(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const threads   = convs.reduce((acc, msg) => {
    if (!acc[msg.sender_id]) acc[msg.sender_id] = [];
    acc[msg.sender_id].push(msg);
    return acc;
  }, {});
  const threadList = Object.entries(threads).slice(0, 8);
  const channelIcon = ch => ch === 'whatsapp' ? <IconSmartphone /> : <IconMessageCircle />;

  const PLAN_LABELS = { free: t('plan_free'), basic: t('plan_basic'), pro: t('plan_pro') };

  if (fetchErr) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 40, color: 'var(--danger)' }}><IconAlertTriangle /></div>
        <span style={{ color: 'var(--danger)', fontSize: 16, fontWeight: 700 }}>{t('serverError')}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('serverErrorHint')}</span>
        <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: 8 }}>
          {t('retry')}
        </button>
      </div>
    </>
  );

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t('loading')}</span>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="page">

        {/* Header */}
        <div className="flex-between mb-32 animate-fadeup">
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>
              {t('dash_hello')}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {t('dash_subtitle')}
            </p>
          </div>
          <div className="flex gap-8">
            <span className={`badge ${usage?.plan === 'pro' ? 'badge-warning' : usage?.plan === 'basic' ? 'badge-info' : 'badge-muted'}`}>
              ✦ {PLAN_LABELS[usage?.plan] || t('plan_free')}
            </span>
            <button onClick={() => navigate('/upgrade')} className="btn btn-primary btn-sm">
              {t('dash_upgrade_btn')}
            </button>
          </div>
        </div>

        {/* Stats */}
        {usage && (
          <div className="grid-3 mb-24">
            <StatCard delay={1} icon={<IconMessageCircle />} label={t('dash_replies')} value={(usage.total_replies || 0).toLocaleString()} sub={t('dash_replies_sub')} />
            <StatCard delay={2} icon={<IconZap />} label={t('dash_tokens')} value={usage.tokens_used?.toLocaleString()} sub={`${t('dash_usage_left')}: ${usage.tokens_limit?.toLocaleString()}`} accent="var(--accent)" />
            <StatCard delay={3} icon={<IconLayers />} label={t('dash_convs')} value={threadList.length} sub={t('dash_convs_sub')} accent="var(--info)" />
          </div>
        )}

        {/* Usage Bar */}
        {usage && (
          <div className="card mb-24 animate-fadeup delay-4">
            <div className="flex-between mb-16">
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>{t('dash_usage_title')}</h3>
              {usage.percent_used > 80 && (
                <button onClick={() => navigate('/upgrade')} className="btn btn-danger btn-sm">
                  {t('dash_upgrade_now')}
                </button>
              )}
            </div>
            <UsageBar used={usage.tokens_used || 0} limit={usage.tokens_limit || 1500} />
          </div>
        )}

        {/* Conversations */}
        <div className="animate-fadeup">
          <div className="flex-between mb-16">
            <h3 style={{ fontWeight: 700, fontSize: 16 }}>{t('dash_convs_title')}</h3>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{convs.length} {t('dash_convs_count')}</span>
          </div>

          {threadList.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 40, marginBottom: 12, color: 'var(--text-subtle)', display: 'flex', justifyContent: 'center' }}><IconBot /></div>
              <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>{t('dash_no_convs')}</p>
              <p style={{ color: 'var(--text-subtle)', fontSize: 13, marginTop: 6 }}>
                {t('dash_no_convs_hint')}
              </p>
              <button onClick={() => navigate('/setup')} className="btn btn-secondary" style={{ marginTop: 20 }}>
                {t('dash_setup_btn')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {threadList.map(([senderId, msgs]) => {
                // الرسائل تصل من السيرفر بترتيب created_at DESC (الأحدث أولاً)
                // ونُدخل بنفس الترتيب في threads — يعني msgs[0] هي الأحدث،
                // وليس msgs[msgs.length - 1] (كانت تُعرض أقدم رسالة بالخطأ).
                const last    = msgs[0];
                const replies = msgs.filter(m => m.role === 'assistant').length;
                return (
                  <div key={senderId} className="card card-hover" style={{ padding: '16px 20px' }}>
                    <div className="flex-between">
                      <div className="flex gap-12">
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--info), var(--accent))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                          {channelIcon(last.channel)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>
                            {senderId.length > 20 ? senderId.slice(0, 18) + '...' : senderId}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {last.content}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: getCurrentLang() === 'ar' ? 'left' : 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 4 }}>
                          {timeAgo(last.created_at)}
                        </div>
                        <div className="flex gap-8" style={{ justifyContent: getCurrentLang() === 'ar' ? 'flex-end' : 'flex-start' }}>
                          <span className="badge badge-muted" style={{ fontSize: 11 }}>
                            {msgs.length} {t('dash_msg_count')}
                          </span>
                          <span className="badge badge-success" style={{ fontSize: 11 }}>
                            {replies} {t('dash_reply_count')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
