// pages/Auth.jsx — تسجيل الدخول / إنشاء حساب / نسيت كلمة المرور / تأكيد البريد
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { loginEmail, registerEmail, forgotPassword, resetPassword, verifyEmail, getStoredUser } from '../lib/auth.js';
import { IconMail, IconCheckCircle, IconXCircle } from '../components/Icons.jsx';

const VIEWS = { login: 'login', register: 'register', forgot: 'forgot', reset: 'reset', sent: 'sent', resetDone: 'resetDone', verifying: 'verifying', verified: 'verified', verifyError: 'verifyError' };

export default function Auth({ onAuth }) {
  const navigate       = useNavigate();
  const location        = useLocation();
  const [params]       = useSearchParams();
  const [view, setView] = useState(params.get('mode') === 'register' ? VIEWS.register : VIEWS.login);
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', name: '' });
  const [err,  setErr]  = useState('');
  const [ok,   setOk]   = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // التحقق من البريد الإلكتروني (GET /api/auth/verify-email/:token) — مسار /verify-email فقط
  // إنشاء حساب جديد (مسار /reset-password) — مسارٌ منفصلٌ تماماً ولا يجب خلطه بمسار التحقق من البريد
  useEffect(() => {
    const token = params.get('token');

    if (location.pathname === '/verify-email') {
      if (!token) { setVerifyMsg('رابط التحقق غير صالح'); setView(VIEWS.verifyError); return; }
      setView(VIEWS.verifying);
      verifyEmail(token)
        .then(() => setView(VIEWS.verified))
        .catch(e => { setVerifyMsg(e.message || 'فشل التحقق من البريد'); setView(VIEWS.verifyError); });
      return;
    }

    if (location.pathname === '/reset-password' && token) {
      setView(VIEWS.reset);
      return;
    }

    // إذا كان مسجلاً دخوله أصلاً (ولسنا في رابط تحقق/إعادة تعيين) — توجيه للوحة التحكم مباشرة
    if (getStoredUser()) navigate('/dashboard', { replace: true });
  }, []); // eslint-disable-line

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setErr(''); };

  async function handleLogin(e) {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await loginEmail(form.email.trim(), form.password);
      onAuth?.(); navigate('/dashboard', { replace: true });
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault(); setErr(''); setLoading(true);
    if (form.password !== form.confirmPassword) { setErr('كلمتا المرور غير متطابقتين'); setLoading(false); return; }
    if (form.password.length < 8) { setErr('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); setLoading(false); return; }
    try {
      await registerEmail(form.email.trim(), form.password, form.name.trim());
      onAuth?.(); navigate('/dashboard', { replace: true });
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  async function handleForgot(e) {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await forgotPassword(form.email.trim());
      setView(VIEWS.sent);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  async function handleReset(e) {
    e.preventDefault(); setErr(''); setLoading(true);
    if (form.password !== form.confirmPassword) { setErr('كلمتا المرور غير متطابقتين'); setLoading(false); return; }
    try {
      const token = params.get('token');
      await resetPassword(token, form.password);
      setView(VIEWS.resetDone);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)',
    background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 14,
    outline: 'none', boxSizing: 'border-box', direction: 'ltr',
    transition: 'border-color 0.2s',
  };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#000', margin: '0 auto 12px', boxShadow: '0 8px 32px rgba(245,158,11,0.35)' }}>Z</div>
          <h1 style={{ fontSize: 22, fontWeight: 900 }}>ZIbot</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>مساعد ذكي لبيزنسك</p>
        </div>

        <div className="card" style={{ padding: 28 }}>

          {/* ─── تسجيل الدخول ─── */}
          {view === VIEWS.login && (
            <>
              <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>تسجيل الدخول</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>مرحباً بعودتك!</p>
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label style={labelStyle}>البريد الإلكتروني</label>
                  <input type="email" placeholder="you@example.com" required value={form.email} onChange={set('email')} style={inputStyle} /></div>
                <div><label style={labelStyle}>كلمة المرور</label>
                  <input type="password" placeholder="••••••••" required value={form.password} onChange={set('password')} style={inputStyle} /></div>
                {err && <p style={{ color: 'var(--danger)', fontSize: 13, background: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: 8, margin: 0 }}>{err}</p>}
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'جاري الدخول...' : 'دخول'}</button>
              </form>
              <div style={{ marginTop: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setView(VIEWS.forgot); setErr(''); }}>نسيت كلمة المرور؟</button>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>ليس لديك حساب؟{' '}
                  <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }} onClick={() => { setView(VIEWS.register); setErr(''); }}>إنشاء حساب</button>
                </p>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← استخدام بدون حساب</button>
              </div>
            </>
          )}

          {/* ─── إنشاء حساب ─── */}
          {view === VIEWS.register && (
            <>
              <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>إنشاء حساب جديد</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>مجاني — لا يلزم بطاقة بنكية</p>
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={labelStyle}>الاسم (اختياري)</label>
                  <input type="text" placeholder="اسمك" value={form.name} onChange={set('name')} style={inputStyle} /></div>
                <div><label style={labelStyle}>البريد الإلكتروني</label>
                  <input type="email" placeholder="you@example.com" required value={form.email} onChange={set('email')} style={inputStyle} /></div>
                <div><label style={labelStyle}>كلمة المرور</label>
                  <input type="password" placeholder="8 أحرف على الأقل" required value={form.password} onChange={set('password')} style={inputStyle} /></div>
                <div><label style={labelStyle}>تأكيد كلمة المرور</label>
                  <input type="password" placeholder="أعد كتابة كلمة المرور" required value={form.confirmPassword} onChange={set('confirmPassword')} style={inputStyle} /></div>
                {err && <p style={{ color: 'var(--danger)', fontSize: 13, background: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: 8, margin: 0 }}>{err}</p>}
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}</button>
              </form>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 20 }}>لديك حساب؟{' '}
                <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }} onClick={() => { setView(VIEWS.login); setErr(''); }}>تسجيل الدخول</button>
              </p>
            </>
          )}

          {/* ─── نسيت كلمة المرور ─── */}
          {view === VIEWS.forgot && (
            <>
              <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>نسيت كلمة المرور؟</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>أدخل بريدك وسنرسل لك رابط إعادة التعيين</p>
              <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label style={labelStyle}>البريد الإلكتروني</label>
                  <input type="email" placeholder="you@example.com" required value={form.email} onChange={set('email')} style={inputStyle} /></div>
                {err && <p style={{ color: 'var(--danger)', fontSize: 13, background: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: 8, margin: 0 }}>{err}</p>}
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}</button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setView(VIEWS.login); setErr(''); }}>← العودة لتسجيل الدخول</button>
              </div>
            </>
          )}

          {/* ─── تم الإرسال ─── */}
          {view === VIEWS.sent && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16, color: 'var(--accent)', display: 'flex', justifyContent: 'center' }}><IconMail /></div>
              <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>تم الإرسال!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>تحقق من بريدك الإلكتروني واضغط على الرابط لإعادة تعيين كلمة المرور.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 12 }}>لم يصل؟ تحقق من مجلد Spam</p>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 20 }} onClick={() => setView(VIEWS.login)}>← العودة</button>
            </div>
          )}

          {/* ─── إعادة تعيين كلمة المرور ─── */}
          {view === VIEWS.reset && (
            <>
              <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>كلمة مرور جديدة</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>اختر كلمة مرور قوية ولا تشاركها مع أحد</p>
              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label style={labelStyle}>كلمة المرور الجديدة</label>
                  <input type="password" placeholder="8 أحرف على الأقل" required value={form.password} onChange={set('password')} style={inputStyle} /></div>
                <div><label style={labelStyle}>تأكيد كلمة المرور</label>
                  <input type="password" placeholder="أعد كتابة كلمة المرور" required value={form.confirmPassword} onChange={set('confirmPassword')} style={inputStyle} /></div>
                {err && <p style={{ color: 'var(--danger)', fontSize: 13, background: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: 8, margin: 0 }}>{err}</p>}
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}</button>
              </form>
            </>
          )}

          {/* ─── تم إعادة التعيين ─── */}
          {view === VIEWS.resetDone && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16, color: 'var(--success)', display: 'flex', justifyContent: 'center' }}><IconCheckCircle /></div>
              <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>تم تغيير كلمة المرور!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
              <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => setView(VIEWS.login)}>تسجيل الدخول</button>
            </div>
          )}

          {/* ─── جاري التحقق من البريد الإلكتروني ─── */}
          {view === VIEWS.verifying && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>جاري التحقق من بريدك الإلكتروني...</p>
            </div>
          )}

          {/* ─── تم تأكيد البريد ─── */}
          {view === VIEWS.verified && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16, color: 'var(--success)', display: 'flex', justifyContent: 'center' }}><IconCheckCircle /></div>
              <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>تم تأكيد بريدك الإلكتروني!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>يمكنك الآن استخدام كامل مزايا حسابك.</p>
              <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => navigate(getStoredUser() ? '/dashboard' : '/auth')}>
                {getStoredUser() ? 'الذهاب للوحة التحكم' : 'تسجيل الدخول'}
              </button>
            </div>
          )}

          {/* ─── تعذر التحقق من البريد ─── */}
          {view === VIEWS.verifyError && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16, color: 'var(--danger)', display: 'flex', justifyContent: 'center' }}><IconXCircle /></div>
              <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>تعذر التحقق من البريد</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{verifyMsg}</p>
              <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => navigate('/auth')}>تسجيل الدخول</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
