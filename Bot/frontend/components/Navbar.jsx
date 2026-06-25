import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { t, getCurrentLang, setLanguage, isRTL } from '../lib/i18n.js';
import { getSavedThemePref, setTheme } from '../lib/theme.js';
import { clearSession, isAdmin, identify } from '../lib/auth.js';

// ── أيقونات SVG ──────────────────────────────────────────
const IconGear    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IconMoon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const IconSun     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const IconUser    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconContact = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IconLogout  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconGlobe   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IconMenu    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IconX       = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const PLAN_BADGE = {
  free:  { key: 'plan_free',  cls: 'badge-muted'   },
  basic: { key: 'plan_basic', cls: 'badge-info'    },
  pro:   { key: 'plan_pro',   cls: 'badge-warning' },
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [, setTick] = useState(0);
  const forceUpdate = () => setTick(n => n + 1);

  const [open,      setOpen]      = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAcct,  setShowAcct]  = useState(false);
  const [themePref, setThemePref] = useState(getSavedThemePref());
  const panelRef = useRef(null);
  const mobilePanelRef = useRef(null);

  // مراقبة تغييرات اللغة والثيم من أي مكان
  useEffect(() => {
    window.addEventListener('zi:langchange',  forceUpdate);
    window.addEventListener('zi:themechange', forceUpdate);
    return () => {
      window.removeEventListener('zi:langchange',  forceUpdate);
      window.removeEventListener('zi:themechange', forceUpdate);
    };
  }, []);

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // إغلاق قائمة الموبايل عند الضغط خارجها أو تغيير الصفحة
  useEffect(() => {
    if (!mobileOpen) return;
    function handler(e) {
      if (mobilePanelRef.current && !mobilePanelRef.current.contains(e.target)) setMobileOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  function cycleTheme() {
    const cycle = { system: 'light', light: 'dark', dark: 'system' };
    const next  = cycle[themePref] || 'system';
    setThemePref(next);
    setTheme(next);
  }

  function switchLanguage() {
    setLanguage(getCurrentLang() === 'ar' ? 'en' : 'ar');
  }

  async function logout() {
    clearSession();
    // إعادة توليد fingerprint وتحديد الجهاز مجدداً
    try { await identify(); } catch { /* ignore */ }
    navigate('/', { replace: true });
  }

  const NAV_LINKS = [
    { path: '/dashboard', labelKey: 'nav_dashboard', icon: '▦' },
    { path: '/setup',     labelKey: 'nav_setup',     icon: '⚙' },
    { path: '/upgrade',   labelKey: 'nav_upgrade',   icon: '✦' },
  ];

  const themeIcon   = themePref === 'light' ? <IconSun /> : <IconMoon />;
  const themeLabel  = themePref === 'dark'
    ? t('nav_theme_dark')
    : themePref === 'light'
    ? t('nav_theme_light')
    : (window.matchMedia?.('(prefers-color-scheme: light)').matches ? t('nav_theme_light') : t('nav_theme_dark'));

  const ToggleIcon  = { system: IconGear, light: IconSun, dark: IconMoon }[themePref] || IconGear;

  return (
    <nav style={{
      background: 'rgba(13,13,31,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div className="nav-inner" style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap',
      }}>
        {/* Logo + Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 900, color: '#000',
            }}>Z</div>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.01em' }}>ZIbot</span>
          </div>

          <div className="nav-links-desktop" style={{ gap: 4 }}>
            {NAV_LINKS.map(link => {
              const active = location.pathname === link.path;
              return (
                <button key={link.path} onClick={() => navigate(link.path)}
                  style={{
                    background: active ? 'var(--accent-glow)' : 'transparent',
                    border: active ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    padding: '6px 14px', borderRadius: 8,
                    fontFamily: 'Tajawal, sans-serif', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  <span style={{ fontSize: 12 }}>{link.icon}</span>
                  {t(link.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Hamburger (mobile) + Plan + Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} ref={panelRef}>
          {/* Mobile nav toggle — only visible under the responsive breakpoint */}
          <button
            className="nav-hamburger-btn"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={t('nav_dashboard')}
            style={{
              alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
              background: mobileOpen ? 'var(--accent-glow)' : 'var(--surface2)',
              border: `1px solid ${mobileOpen ? 'var(--accent)' : 'var(--border)'}`,
              color: mobileOpen ? 'var(--accent)' : 'var(--text)',
              cursor: 'pointer',
            }}>
            {mobileOpen ? <IconX /> : <IconMenu />}
          </button>

          {/* Plan Badge */}
          {(() => {
            const user   = JSON.parse(localStorage.getItem('zi_user') || '{}');
            const planCfg = PLAN_BADGE[user.plan] || PLAN_BADGE.free;
            return <span className={`badge ${planCfg.cls}`}>{t(planCfg.key)}</span>;
          })()}

          {/* Settings Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 8,
                background: 'var(--surface2)',
                border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
                color: open ? 'var(--accent)' : 'var(--text)',
                cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: 'Tajawal, sans-serif',
              }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--info) 0%, var(--accent) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
              }}>Z</div>
              <span className="nav-settings-label" style={{ fontSize: 14, fontWeight: 600 }}>ZIbot</span>
              <div style={{ color: 'var(--text-muted)', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>
                <IconGear />
              </div>
            </button>

            {/* Dropdown */}
            {open && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)',
                [isRTL() ? 'left' : 'right']: 0,
                minWidth: 240, borderRadius: 12,
                background: 'var(--surface)',
                border: '1px solid var(--border2)',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden', zIndex: 200,
                animation: 'fadeSlideDown 0.15s ease',
              }}>
                {/* Header */}
                <div style={{
                  padding: '14px 16px', borderBottom: '1px solid var(--border)',
                  background: 'var(--surface2)',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>ZIbot</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {t('account_device_value')}
                  </div>
                </div>

                {/* Theme Toggle */}
                <button onClick={cycleTheme} style={menuItemStyle}>
                  <span style={{ color: 'var(--accent)' }}>{themeIcon}</span>
                  <span style={{ flex: 1 }}>{themeLabel}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-subtle)', background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, display: 'flex', alignItems: 'center' }}>
                    <ToggleIcon />
                  </span>
                </button>

                {/* Language Toggle */}
                <button onClick={switchLanguage} style={menuItemStyle}>
                  <span style={{ color: 'var(--info)' }}><IconGlobe /></span>
                  <span style={{ flex: 1 }}>
                    {getCurrentLang() === 'ar' ? 'English' : 'العربية'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)', background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4 }}>
                    {getCurrentLang() === 'ar' ? 'EN' : 'ع'}
                  </span>
                </button>

                {/* Account Info */}
                <button onClick={() => { setShowAcct(true); setOpen(false); }} style={menuItemStyle}>
                  <span style={{ color: 'var(--success)' }}><IconUser /></span>
                  <span>{t('nav_account')}</span>
                </button>

                {/* Contact */}
                <a href="https://wa.me/966500000000" target="_blank" rel="noopener noreferrer"
                  style={{ ...menuItemStyle, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)', padding: '11px 16px' }}>
                  <span style={{ color: 'var(--success)' }}><IconContact /></span>
                  <span>{t('nav_contact')}</span>
                </a>

                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                {/* Logout (re-identify) */}
                <button onClick={logout} style={{ ...menuItemStyle, color: 'var(--danger)' }}>
                  <IconLogout />
                  <span>{t('nav_logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Links Panel */}
      {mobileOpen && (
        <div ref={mobilePanelRef} className="nav-mobile-panel" style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
          padding: 8,
          display: 'flex', flexDirection: 'column', gap: 4,
          animation: 'fadeSlideDown 0.15s ease',
        }}>
          {NAV_LINKS.map(link => {
            const active = location.pathname === link.path;
            return (
              <button key={link.path} onClick={() => { navigate(link.path); setMobileOpen(false); }}
                style={{
                  background: active ? 'var(--accent-glow)' : 'transparent',
                  border: active ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  padding: '12px 14px', borderRadius: 8,
                  fontFamily: 'Tajawal, sans-serif', fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s', width: '100%',
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'right',
                }}>
                <span style={{ fontSize: 14 }}>{link.icon}</span>
                {t(link.labelKey)}
              </button>
            );
          })}
        </div>
      )}

      {/* Account Modal */}
      {showAcct && (
        <div onClick={() => setShowAcct(false)} style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--surface)', borderRadius: 16,
            border: '1px solid var(--border2)', padding: 32,
            minWidth: 320, boxShadow: 'var(--shadow-lg)',
            animation: 'fadeSlideDown 0.2s ease',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>
              {t('account_modal_title')}
            </h3>
            {(() => {
              const user    = JSON.parse(localStorage.getItem('zi_user') || '{}');
              const planCfg = PLAN_BADGE[user.plan] || PLAN_BADGE.free;
              return (
                <>
                  <Row label={t('account_plan')}   value={t(planCfg.key)} />
                  <Row label={t('account_device')} value={t('account_device_value')} />
                  <Row
                    label={t('account_joined')}
                    value={user.tokens_limit?.toLocaleString() + ' ' + (getCurrentLang() === 'ar' ? 'توكن' : 'tokens')}
                  />
                </>
              );
            })()}
            <button onClick={() => setShowAcct(false)} className="btn btn-ghost btn-full" style={{ marginTop: 20 }}>
              {t('close')}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nav-links-desktop { display: flex; }
        .nav-hamburger-btn { display: none; }
        .nav-mobile-panel  { display: none; }
        @media (max-width: 768px) {
          .nav-links-desktop { display: none; }
          .nav-hamburger-btn { display: flex; }
          .nav-mobile-panel  { display: flex; }
          .nav-inner { padding: 0 16px; }
        }
        @media (max-width: 420px) {
          .nav-settings-label { display: none; }
          .nav-inner { padding: 0 12px; }
        }
      `}</style>
    </nav>
  );
}

const menuItemStyle = {
  display: 'flex', alignItems: 'center', gap: 10,
  width: '100%', padding: '11px 16px',
  background: 'transparent', border: 'none',
  color: 'var(--text)', fontFamily: 'Tajawal, sans-serif',
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
  textAlign: 'right', transition: 'background 0.15s',
};

function Row({ label, value }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: 14 }}>{value}</span>
    </div>
  );
}
