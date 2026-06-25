import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { apiFetch } from '../lib/auth.js';
import { t } from '../lib/i18n.js';
import { IconSmartphone, IconCheckCircle, IconAlertTriangle, IconRefreshCw } from '../components/Icons.jsx';

const API = '/api';

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <div className="flex-between">
        <label>{label}</label>
        {hint && <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ════════════════════════════════════════
//  مكوّن QR Code — Meta Cloud API الرسمي
//  يجلب wa_qr مباشرة من Meta Graph API
//  (رمز QR يُمكّن العملاء من مسحه لبدء محادثة)
// ════════════════════════════════════════
function WhatsAppQR() {
  const [status,   setStatus]   = useState('idle');   // idle | loading | ready | error
  const [qrData,   setQrData]   = useState(null);     // { qr_url, phone_number, verified_name }
  const [errorMsg, setErrorMsg] = useState('');
  const pollRef = useRef(null);

  // مراقبة تغيير اللغة
  const [, setTick] = useState(0);
  useEffect(() => {
    const h = () => setTick(n => n + 1);
    window.addEventListener('zi:langchange', h);
    return () => window.removeEventListener('zi:langchange', h);
  }, []);

  const stopPoll = () => { if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; } };

  useEffect(() => () => stopPoll(), []);

  async function fetchQR() {
    setStatus('loading');
    setErrorMsg('');
    try {
      const res  = await apiFetch('/api/whatsapp/qr?t=' + Date.now());
      const data = await res.json();

      if (!res.ok || !data.configured) {
        setStatus('error');
        setErrorMsg(data.error || 'تعذر الاتصال بـ Meta — تحقق من مفاتيح WA_CLOUD_TOKEN و WA_PHONE_NUMBER_ID');
        return;
      }

      if (!data.qr_url) {
        setStatus('error');
        setErrorMsg('لم يتم إرجاع QR من Meta — تأكد أن الحساب مُفعَّل في Meta Business Manager');
        return;
      }

      setQrData(data);
      setStatus('ready');
    } catch (e) {
      setStatus('error');
      setErrorMsg(e.message || 'خطأ في الاتصال بالسيرفر');
    }
  }

  if (status === 'idle') return (
    <div style={{ textAlign: 'center', padding: '28px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 12, color: 'var(--text-subtle)', display: 'flex', justifyContent: 'center' }}><IconSmartphone /></div>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
        اضغط لعرض رمز QR الرسمي من Meta — يتيح للعملاء بدء محادثة مع رقمك التجاري مباشرةً
      </p>
      <button onClick={fetchQR} className="btn btn-primary">عرض QR الرسمي</button>
    </div>
  );

  if (status === 'loading') return (
    <div style={{ textAlign: 'center', padding: '28px 0' }}>
      <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>جاري جلب QR من Meta...</p>
    </div>
  );

  if (status === 'error') return (
    <div style={{ textAlign: 'center', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', color: 'var(--danger)', marginBottom: 12, fontSize: 14 }}>
        <IconAlertTriangle /> {errorMsg}
      </div>
      <button onClick={fetchQR} className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <IconRefreshCw /> إعادة المحاولة
      </button>
    </div>
  );

  // status === 'ready'
  return (
    <div style={{ textAlign: 'center' }}>

      {/* معلومات الرقم */}
      {(qrData?.verified_name || qrData?.phone_number) && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 20, marginBottom: 16,
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
          fontSize: 13, fontWeight: 700, color: '#10b981',
        }}>
          <IconCheckCircle />
          {qrData.verified_name || ''} — {qrData.phone_number || ''}
        </div>
      )}

      {/* رابط واتساب المباشر */}
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: 20, borderRadius: 16, background: '#f0fdf4', border: '2px solid #10b981' }}>
        <p style={{ fontSize: 13, color: '#065f46', fontWeight: 700, marginBottom: 12 }}>رابط واتساب — انسخه أو اضغط عليه مباشرة:</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <input
            readOnly
            value={qrData?.raw_qr || ''}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #10b981', background: '#fff', fontSize: 13, direction: 'ltr', fontFamily: 'monospace' }}
            onClick={e => e.target.select()}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigator.clipboard.writeText(qrData?.raw_qr || '')}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >نسخ</button>
        </div>
        <a
          href={qrData?.raw_qr}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', padding: '12px 0', background: '#25D366', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 800, textDecoration: 'none', textAlign: 'center' }}
        >📲 افتح محادثة واتساب</a>
      </div>

      {/* تعليمات */}
      <div style={{
        marginTop: 18, padding: '16px 18px', background: 'var(--bg-secondary)',
        borderRadius: 12, textAlign: 'right', fontSize: 13, color: 'var(--text-muted)',
        lineHeight: 2.1, maxWidth: 340, margin: '18px auto 0', border: '1px solid var(--border)',
      }}>
        <p style={{ fontWeight: 800, color: 'var(--text)', marginBottom: 10, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconSmartphone style={{ color: '#10b981' }} /> كيف يستخدم العميل هذا الكود؟
        </p>
        <p>١. يفتح واتساب على هاتفه</p>
        <p>٢. يضغط على أيقونة المسح أو يختار "فتح رابط"</p>
        <p>٣. يصوّب الكاميرا نحو الكود</p>
        <p>٤. ستبدأ المحادثة مع رقمك التجاري فوراً</p>
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 8,
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
        }}>
          <p style={{ color: '#10b981', fontWeight: 700, fontSize: 12, margin: 0 }}>
            هذا QR رسمي صادر مباشرة من Meta — آمن 100% ومرتبط برقمك المسجّل
          </p>
        </div>
      </div>

      {/* إعادة جلب */}
      <button onClick={fetchQR} className="btn btn-ghost btn-sm" style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <IconRefreshCw /> تحديث QR
      </button>
    </div>
  );
}

// ════════════════════════════════════════
//  الصفحة الرئيسية
// ════════════════════════════════════════
export default function Setup() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');
  const [form,   setForm]   = useState({
    business_name: '', description: '', products: '',
    working_hours: '', location: '', tone: '',
    dialect: '', custom_rules: '', fb_page_id: '',
  });
  const [, setTick] = useState(0);

  const TONES    = [t('tone_friendly'), t('tone_formal'), t('tone_fun'), t('tone_neutral')];
  const DIALECTS = [t('dialect_fus7a'), t('dialect_saudi'), t('dialect_gulf'), t('dialect_egypt'), t('dialect_sham'), t('dialect_morocc')];

  useEffect(() => {
    const h = () => setTick(n => n + 1);
    window.addEventListener('zi:langchange', h);
    return () => window.removeEventListener('zi:langchange', h);
  }, []);

  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    apiFetch(`${API}/settings`)
      .then(r => r.json())
      .then(d => {
        if (d.business) {
          const s = d.business.settings || {};
          setForm(f => ({
            ...f, ...s,
            tone:    s.tone    || TONES[0],
            dialect: s.dialect || DIALECTS[0],
            fb_page_id: d.business.fb_page_id || '',
          }));
        }
      })
      .catch(() => setLoadError(true));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function save() {
    if (!form.business_name.trim()) { setError(t('setup_name_required')); return; }
    setError(''); setSaving(true); setSaved(false);
    try {
      const res  = await apiFetch(`${API}/settings`, {
        method: 'POST',
        body:   JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'فشل الحفظ'); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(t('serverError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="page" style={{ maxWidth: 720 }}>

        <div className="animate-fadeup mb-32">
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>{t('setup_title')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t('setup_subtitle')}</p>
          {loadError && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontSize: 13, background: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: 8 }}>
              <IconAlertTriangle /> تعذر تحميل إعداداتك الحالية — احفظ فقط إذا كنت متأكداً من القيم أدناه
            </div>
          )}
        </div>

        {/* معلومات النشاط */}
        <div className="card mb-16 animate-fadeup delay-1">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t('setup_section_info')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field label={`${t('setup_name')} *`} hint={t('required')}>
              <input placeholder={t('setup_name_ph')} value={form.business_name} onChange={set('business_name')} />
            </Field>
            <Field label={t('setup_desc')} hint={t('optional')}>
              <textarea rows={3} placeholder={t('setup_desc_ph')} value={form.description} onChange={set('description')} />
            </Field>
            <Field label={t('setup_products')} hint={t('setup_products_hint')}>
              <textarea rows={4} placeholder={t('setup_products_ph')} value={form.products} onChange={set('products')} />
            </Field>
            <div className="grid-2">
              <Field label={t('setup_hours')}>
                <input placeholder={t('setup_hours_ph')} value={form.working_hours} onChange={set('working_hours')} />
              </Field>
              <Field label={t('setup_location')}>
                <input placeholder={t('setup_location_ph')} value={form.location} onChange={set('location')} />
              </Field>
            </div>
          </div>
        </div>

        {/* شخصية المساعد */}
        <div className="card mb-16 animate-fadeup delay-2">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t('setup_section_persona')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="grid-2">
              <Field label={t('setup_tone')}>
                <select value={form.tone} onChange={set('tone')}>
                  {TONES.map(tone => <option key={tone}>{tone}</option>)}
                </select>
              </Field>
              <Field label={t('setup_dialect')}>
                <select value={form.dialect} onChange={set('dialect')}>
                  {DIALECTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </Field>
            </div>
            <Field label={t('setup_rules')} hint={t('optional')}>
              <textarea rows={3} placeholder={t('setup_rules_ph')} value={form.custom_rules} onChange={set('custom_rules')} />
            </Field>
          </div>
        </div>

        {/* ربط واتساب */}
        <div className="card mb-16 animate-fadeup delay-3">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t('setup_section_wa')}
          </div>
          <WhatsAppQR />
        </div>

        {/* ربط ماسنجر */}
        <div className="card mb-24 animate-fadeup delay-4">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t('setup_section_msg')}
          </div>
          <Field label={t('setup_fb_id')} hint={t('optional')}>
            <input placeholder={t('setup_fb_id_ph')} value={form.fb_page_id} onChange={set('fb_page_id')} />
          </Field>
        </div>

        {/* الأزرار */}
        <div className="flex-between animate-fadeup">
          <button onClick={() => navigate('/dashboard')} className="btn btn-ghost">
            {t('back')}
          </button>
          <div className="flex gap-12">
            {saved && (
              <div className="flex gap-8" style={{ color: 'var(--success)', fontSize: 14, fontWeight: 600 }}>
                <span>✓</span> {t('saved')}
              </div>
            )}
            {error && <div style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</div>}
            <button onClick={save} disabled={saving} className="btn btn-primary">
              {saving ? <span className="spinner" style={{ borderTopColor: '#000' }} /> : t('save')}
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
