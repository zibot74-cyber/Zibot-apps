import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './index.css';
import { initTheme }        from './lib/theme.js';
import { applyDocumentDir } from './lib/i18n.js';
import { identify, getStoredUser, isAdmin } from './lib/auth.js';
import Setup     from './pages/Setup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Upgrade   from './pages/Upgrade.jsx';
import Auth      from './pages/Auth.jsx';
import Admin     from './pages/Admin.jsx';
import { IconAlertTriangle } from './components/Icons.jsx';

initTheme();
applyDocumentDir();

// ── تسجيل دخول تلقائي عبر Fingerprint ───────────────────
function AutoLogin({ onDone }) {
  const navigate = useNavigate();
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (getStoredUser()) {
          if (!cancelled) { onDone(); navigate('/dashboard', { replace: true }); }
          return;
        }
        await identify();
        if (!cancelled) { onDone(); navigate('/dashboard', { replace: true }); }
      } catch (e) {
        if (!cancelled) { setError(e.message || 'خطأ في الاتصال بالسيرفر'); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:20, background:'var(--bg)' }}>
      <div style={{ width:64, height:64, borderRadius:18, background:'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, fontWeight:900, color:'#000', boxShadow:'0 8px 32px rgba(245,158,11,0.35)' }}>Z</div>
      <h1 style={{ fontSize:26, fontWeight:900 }}>ZIbot</h1>
      {loading && !error && (
        <><div className="spinner" style={{ width:32, height:32 }} /><p style={{ color:'var(--text-muted)', fontSize:14 }}>جاري التحميل...</p></>
      )}
      {error && (
        <div style={{ textAlign:'center' }}>
          <p style={{ color:'var(--danger)', marginBottom:12 }}>{error}</p>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:20 }}>تأكد أن السيرفر يعمل على البورت 3000</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => window.location.reload()} className="btn btn-primary">إعادة المحاولة</button>
            <button onClick={() => navigate('/auth')} className="btn btn-ghost">تسجيل الدخول بالبريد</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PrivateRoute({ children, authed }) {
  return authed ? children : <Navigate to="/" replace />;
}

function AdminRoute({ children, authed }) {
  if (!authed) return <Navigate to="/auth" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
}

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e) { console.error('[ErrorBoundary]', e); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, background:'var(--bg)' }}>
        <div style={{ fontSize:40, color: 'var(--danger)' }}><IconAlertTriangle /></div>
        <h2 style={{ color:'var(--danger)' }}>حدث خطأ غير متوقع</h2>
        <button onClick={() => window.location.reload()} className="btn btn-primary">تحديث الصفحة</button>
      </div>
    );
  }
}

function App() {
  const [authed, setAuthed] = useState(!!getStoredUser());
  const [, tick] = useState(0);

  useEffect(() => {
    const h = () => tick(n => n + 1);
    window.addEventListener('zi:langchange', h);
    return () => window.removeEventListener('zi:langchange', h);
  }, []);

  const handleAuth = () => setAuthed(true);

  return (
    <BrowserRouter>
      <Routes>
        {/* صفحة البداية — fingerprint login تلقائي */}
        <Route path="/"            element={authed ? <Navigate to="/dashboard" replace /> : <AutoLogin onDone={handleAuth} />} />

        {/* تسجيل الدخول / إنشاء حساب بالبريد */}
        <Route path="/auth"        element={authed ? <Navigate to="/dashboard" replace /> : <Auth onAuth={handleAuth} />} />

        {/* صفحات تأكيد البريد / إعادة التعيين (تفتح خارج الجلسة) */}
        <Route path="/verify-email" element={<Auth />} />
        <Route path="/reset-password" element={<Auth />} />

        {/* صفحات خاصة */}
        <Route path="/dashboard"   element={<PrivateRoute authed={authed}><Dashboard /></PrivateRoute>} />
        <Route path="/setup"       element={<PrivateRoute authed={authed}><Setup /></PrivateRoute>} />
        <Route path="/upgrade"     element={<PrivateRoute authed={authed}><Upgrade /></PrivateRoute>} />

        {/* لوحة الإدارة */}
        <Route path="/admin"       element={<AdminRoute authed={authed}><Admin /></AdminRoute>} />

        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>
);
