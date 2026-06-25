// pages/Upgrade.jsx — صفحة الترقية مع نظام دفع حقيقي
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { apiFetch } from '../lib/auth.js';
import { getCurrentLang } from '../lib/i18n.js';
import { IconXCircle, IconSend, IconGem, IconPartyPopper, IconZap, IconCheckCircle, IconWhatsAppBadge, IconVodafoneBadge, IconEtisalatBadge, IconOrangeBadge } from '../components/Icons.jsx';

// ── تحميل مسبق لصور وسائل الدفع (أولوية قصوى) ──────────────
// الصور محمّلة أيضاً من index.html لأقصى سرعة — هذا تعزيز إضافي للـ SPA
const PAYMENT_IMGS = ['/payments/whatsapp.jpg','/payments/vodafone-cash.jpg','/payments/etisalat-cash.jpg','/payments/orange-cash.jpg'];
PAYMENT_IMGS.forEach(src => {
  const img = new Image(); img.src = src; // warm browser cache immediately
});

const SUPPORT_WHATSAPP = 'https://wa.me/966500000000';

// Bug #5 Fix: أُزيل ar و PLANS_DEF من مستوى الـ module
// كانا يُحسَبان مرة واحدة عند import → تجميد اللغة
// الآن يُحسَبان داخل الـ component عند كل render

// ═══════════════════════════════════════
//  مودال الدفع — يدعم Paymob التلقائي + اليدوي كـ fallback
// ═══════════════════════════════════════
function PaymentModal({ plan, planDef, methods, onClose }) {
  const [step,         setStep]         = useState('choose'); // choose | paymob | manual | success | error
  const [manualM,      setManualM]      = useState('');
  const [walletPhone,  setWalletPhone]  = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [reference,    setReference]    = useState('');
  const [notes,        setNotes]        = useState('');
  const [msg,          setMsg]          = useState('');
  const [loading,      setLoading]      = useState(false);

  const today = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── Paymob: بدء الدفع التلقائي ──────────────────────────
  async function submitPaymob() {
    if (!walletPhone.trim()) { setMsg('أدخل رقم المحفظة'); return; }
    if (!/^01[0-9]{9}$/.test(walletPhone.trim())) { setMsg('رقم غير صحيح — 11 رقم يبدأ بـ 01'); return; }
    setLoading(true);
    try {
      const res  = await apiFetch('/api/payment/paymob/wallet', { method: 'POST', body: JSON.stringify({ plan, method: manualM, walletPhone: walletPhone.trim(), contactPhone: contactPhone.trim() }) });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(data.error || 'خطأ في بدء الدفع');
      }
    } catch (e) { setMsg(e.message); setLoading(false); }
  }

  // ── يدوي: إرسال مرجع الدفع ───────────────────────────────
  async function submitManual() {
    if (!reference.trim()) { setMsg('أدخل رقم المرجع'); return; }
    setLoading(true);
    try {
      const res  = await apiFetch('/api/payment/manual', { method: 'POST', body: JSON.stringify({ plan, method: manualM, reference: reference.trim(), notes }) });
      const data = await res.json();
      if (data.success) setStep('success');
      else throw new Error(data.error || 'خطأ');
    } catch (e) { setMsg(e.message); } finally { setLoading(false); }
  }

  // بيانات كل طريقة
  const methodMap = {
    vodafone: { label: 'فودافون كاش',  Icon: IconVodafoneBadge, number: methods?.vodafone?.number, paymob: methods?.vodafone?.paymob },
    etisalat: { label: 'اتصالات كاش', Icon: IconEtisalatBadge, number: methods?.etisalat?.number, paymob: methods?.etisalat?.paymob },
    orange:   { label: 'أورنج كاش',   Icon: IconOrangeBadge,   number: methods?.orange?.number,   paymob: methods?.orange?.paymob   },
  };
  const mInfo = methodMap[manualM] || {};

  const inp    = { padding: '10px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 13, width: '100%', boxSizing: 'border-box', direction: 'ltr' };
  const lbl    = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 };
  const row    = (label, value) => (
    <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ color:'var(--text-muted)', fontSize:13 }}>{label}</span>
      <strong style={{ fontSize:13 }}>{value}</strong>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'var(--bg-card)', borderRadius:24, padding:28, width:'100%', maxWidth:560, border:'1px solid var(--border)', maxHeight:'90vh', overflowY:'auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <h2 style={{ fontWeight:800, fontSize:18 }}>ترقية إلى {planDef?.label}</h2>
            <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:4 }}>{planDef?.price} {planDef?.currency} / شهر</p>
          </div>
          <button onClick={onClose} aria-label="إغلاق" style={{ background:'none', border:'none', fontSize:20, color:'var(--text-muted)', cursor:'pointer', padding:4, display:'flex' }}><IconXCircle /></button>
        </div>

        {/* ─── اختيار طريقة الدفع ─── */}
        {step === 'choose' && (
          <div>
            {msg && <p style={{ color:'var(--danger)', fontSize:13, background:'rgba(239,68,68,0.08)', padding:'10px 14px', borderRadius:8, marginBottom:14 }}>{msg}</p>}
            <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16, textAlign:'center' }}>اختر طريقة الدفع المناسبة لك</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:14 }}>
              {[
                { key:'whatsapp', Icon:IconWhatsAppBadge, name:'WhatsApp',      desc:'تواصل مع خدمة العملاء للدفع وتفعيل الاشتراك' },
                { key:'vodafone', Icon:IconVodafoneBadge, name:'Vodafone Cash', desc:'دفع تلقائي فوري عبر فودافون كاش' },
                { key:'etisalat', Icon:IconEtisalatBadge, name:'Etisalat Cash', desc:'دفع تلقائي فوري عبر اتصالات كاش' },
                { key:'orange',   Icon:IconOrangeBadge,   name:'Orange Cash',   desc:'دفع تلقائي فوري عبر أورنج كاش' },
              ].map(({ key, Icon, name, desc }) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === 'whatsapp') { window.open(SUPPORT_WHATSAPP, '_blank', 'noopener,noreferrer'); return; }
                    setManualM(key);
                    setMsg('');
                    // إذا Paymob متاح → الدفع التلقائي، وإلا → اليدوي
                    setStep(methodMap[key]?.paymob ? 'paymob' : 'manual');
                  }}
                  style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, aspectRatio:'1', padding:16, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer', transition:'all 0.2s', textAlign:'center' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <Icon style={{ width:56, height:56, borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }} />
                  <span style={{ fontWeight:800, fontSize:14, color:'var(--text)' }}>{name}</span>
                  <span style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.5 }}>{desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Paymob: إدخال رقم المحفظة ─── */}
        {step === 'paymob' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <button className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start' }} onClick={() => { setStep('choose'); setMsg(''); }}>← رجوع</button>

            {/* بطاقة معلومات الدفع */}
            <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:18, border:'1px solid var(--border)' }}>
              <p style={{ fontWeight:800, marginBottom:14, fontSize:15, display:'flex', alignItems:'center', gap:8 }}>
                {mInfo.Icon && <mInfo.Icon style={{ width:32, height:32, borderRadius:8 }} />}
                طريقة الدفع: {mInfo.label}
              </p>
              {row('سعر الباقة', `${planDef?.price} ${planDef?.currency || 'ر.س'}`)}
              {row('اسم الباقة', planDef?.label || plan)}
              {row('التاريخ', today)}
            </div>

            {/* رقم المحفظة */}
            <div>
              <label style={lbl}>رقم المحفظة (للدفع) *</label>
              <input style={inp} placeholder="01xxxxxxxxx" maxLength={11} value={walletPhone} onChange={e => { setWalletPhone(e.target.value.replace(/\D/g,'')); setMsg(''); }} />
              <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
                سيصلك رمز تأكيد على هذا الرقم — أدخله لإتمام الدفع
              </p>
            </div>

            {/* رقم التواصل */}
            <div>
              <label style={lbl}>رقم التواصل (اختياري)</label>
              <input style={inp} placeholder="01xxxxxxxxx" maxLength={11} value={contactPhone} onChange={e => setContactPhone(e.target.value.replace(/\D/g,''))} />
            </div>

            {msg && <p style={{ color:'var(--danger)', fontSize:13, background:'rgba(239,68,68,0.08)', padding:'10px 14px', borderRadius:8 }}>{msg}</p>}

            <button className="btn btn-primary btn-full" onClick={submitPaymob} disabled={loading || walletPhone.length < 11} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {loading ? 'جاري التحويل إلى بوابة الدفع...' : <><IconSend /> ادفع الآن</>}
            </button>
            <p style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', lineHeight:1.6 }}>
              ستتحول إلى بوابة Paymob الآمنة · يُفعَّل اشتراكك فوراً بعد الدفع
            </p>
          </div>
        )}

        {/* ─── يدوي (fallback): إدخال مرجع الدفع ─── */}
        {step === 'manual' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <button className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start' }} onClick={() => { setStep('choose'); setMsg(''); }}>← رجوع</button>
            <div style={{ background:'var(--bg-secondary)', borderRadius:12, padding:16, border:'1px solid var(--border)' }}>
              <p style={{ fontWeight:700, marginBottom:10, fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
                {mInfo.Icon && <mInfo.Icon style={{ width:28, height:28, borderRadius:6 }} />} {mInfo.label}
              </p>
              {mInfo.number
                ? <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><span style={{ color:'var(--text-muted)', fontSize:13 }}>الرقم:</span><strong style={{ fontFamily:'monospace', letterSpacing:2 }}>{mInfo.number}</strong></div>
                : <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>سيتم تزويدك برقم التحويل من الإدارة — <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer" style={{ color:'var(--accent)' }}>تواصل عبر واتساب</a></p>
              }
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ color:'var(--text-muted)', fontSize:13 }}>المبلغ:</span>
                <strong style={{ color:'var(--accent)' }}>{planDef?.price} {planDef?.currency || 'ر.س'}</strong>
              </div>
            </div>
            <div>
              <label style={lbl}>رقم المرجع / رقم العملية *</label>
              <input style={inp} placeholder="أدخل الرقم المرجعي بعد الدفع" value={reference} onChange={e => { setReference(e.target.value); setMsg(''); }} />
            </div>
            <div>
              <label style={lbl}>ملاحظات (اختياري)</label>
              <textarea style={{ ...inp, height:70, resize:'vertical' }} placeholder="أي معلومات إضافية..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            {msg && <p style={{ color:'var(--danger)', fontSize:13, background:'rgba(239,68,68,0.08)', padding:'10px 14px', borderRadius:8 }}>{msg}</p>}
            <button className="btn btn-primary btn-full" onClick={submitManual} disabled={loading || !reference.trim()} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {loading ? 'جاري الإرسال...' : <><IconSend /> إرسال طلب الدفع</>}
            </button>
            <p style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center' }}>سيتم تفعيل باقتك خلال 24 ساعة بعد التحقق</p>
          </div>
        )}

        {/* ─── نجاح ─── */}
        {step === 'success' && (
          <div style={{ textAlign:'center', padding:'12px 0' }}>
            <div style={{ fontSize:48, marginBottom:16, display:'flex', justifyContent:'center', color:'var(--success)' }}><IconPartyPopper /></div>
            <h3 style={{ fontWeight:800, fontSize:18, marginBottom:10 }}>تم استلام طلبك!</h3>
            <p style={{ color:'var(--text-muted)', fontSize:14, lineHeight:1.7 }}>سيتم مراجعة طلبك وتفعيل باقة <strong style={{ color:'var(--accent)' }}>{planDef?.label}</strong> خلال 24 ساعة.</p>
            <button className="btn btn-primary" style={{ marginTop:24 }} onClick={onClose}>حسناً، شكراً!</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//  بطاقة الخطة
// ═══════════════════════════════════════
function PlanCard({ plan, current, onUpgrade, ar }) {  // Bug #5 Fix: ar كـ prop بدلاً من module-level
  const isCurrent = current === plan.id;
  const isPaid    = plan.id !== 'free';
  const isPro     = plan.id === 'pro';

  return (
    <div style={{
      background:'var(--bg-card)', borderRadius:16, border:`1px solid ${isPro ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
      padding:28, position:'relative', overflow:'hidden', display:'flex', flexDirection:'column',
      boxShadow: isPro ? '0 0 40px rgba(245,158,11,0.08)' : 'none', transition:'all 0.3s',
    }}>
      {isPro && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,var(--accent),transparent)' }} />}
      {plan.badge && <div style={{ marginBottom:14 }}><span style={{ background:`${plan.accent}18`, color:plan.accent, border:`1px solid ${plan.accent}30`, borderRadius:6, padding:'3px 10px', fontSize:12, fontWeight:700 }}>{plan.badge}</span></div>}

      <h3 style={{ fontWeight:800, fontSize:20, marginBottom:4 }}>{plan.label}</h3>
      <div style={{ display:'flex', alignItems:'baseline', gap:4, margin:'12px 0' }}>
        <span style={{ fontSize:38, fontWeight:900, color: isPro ? 'var(--accent)' : 'var(--text)' }}>{plan.price}</span>
        {plan.currency && <span style={{ fontSize:14, color:'var(--text-muted)' }}>{plan.currency}{plan.period}</span>}
        {!plan.price && <span style={{ fontSize:14, color:'var(--text-muted)' }}>مجاناً</span>}
      </div>
      <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:8, background:`${plan.accent}14`, border:`1px solid ${plan.accent}28`, fontSize:13, fontWeight:700, color:plan.accent, marginBottom:20 }}>
        <IconZap /> {plan.tokens} {ar ? 'توكن/شهر' : 'tokens/mo'}
      </div>

      <div style={{ flex:1, marginBottom:22 }}>
        {plan.features.map(f => (
          <div key={f} style={{ display:'flex', gap:8, marginBottom:9, fontSize:14, color:'var(--text-muted)', alignItems:'flex-start' }}>
            <span style={{ color:'#10b981', fontSize:15, flexShrink:0 }}>✓</span>{f}
          </div>
        ))}
      </div>

      <button
        disabled={isCurrent || !isPaid}
        onClick={() => isPaid && !isCurrent && onUpgrade(plan.id)}
        className={`btn btn-full ${isPro && !isCurrent ? 'btn-primary' : ''}`}
        style={isCurrent ? { background:'var(--bg-secondary)', color:'var(--text-muted)', cursor:'default' } :
               !isPaid    ? { background:'var(--bg-secondary)', color:'var(--text-muted)', cursor:'default' } : {}}>
        {isCurrent ? `✓ ${ar ? 'خطتك الحالية' : 'Current Plan'}` : ar ? 'ترقية الآن' : 'Upgrade Now'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════
//  الصفحة الرئيسية
// ═══════════════════════════════════════
export default function Upgrade() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const user           = JSON.parse(localStorage.getItem('zi_user') || '{}');
  const [methods,   setMethods]   = useState({});
  const [modal,     setModal]     = useState(null);   // plan id
  const [toast,     setToast]     = useState(null);
  const [, setTick] = useState(0);

  // Bug #5 Fix: ar و PLANS_DEF داخل الـ component → تُعاد حسابها عند تغيير اللغة
  const ar = getCurrentLang() === 'ar';
  const PLANS_DEF = [
    {
      id: 'free', label: ar ? 'مجاني' : 'Free', price: 0,
      tokens: '1,500', period: ar ? '/شهر' : '/mo',
      features: ar
        ? ['1,500 توكن شهرياً','رد تلقائي على واتساب وماسنجر','إعداد أساسي','دعم بالبريد']
        : ['1,500 tokens/month','Auto-reply WhatsApp & Messenger','Basic setup','Email support'],
      badge: null, accent: 'var(--border)',
    },
    {
      id: 'basic', label: ar ? 'أساسي' : 'Basic', price: 49, currency: ar ? 'ر.س' : 'SAR',
      tokens: '15,000', period: ar ? '/شهر' : '/mo',
      features: ar
        ? ['15,000 توكن شهرياً','كل القنوات','إحصائيات متقدمة','دعم أولوي','تخصيص الشخصية']
        : ['15,000 tokens/month','All channels','Advanced analytics','Priority support','Custom personality'],
      badge: ar ? 'الأكثر طلباً' : 'Popular', accent: '#3b82f6',
    },
    {
      id: 'pro', label: ar ? 'احترافي' : 'Pro', price: 149, currency: ar ? 'ر.س' : 'SAR',
      tokens: ar ? 'غير محدود' : 'Unlimited', period: ar ? '/شهر' : '/mo',
      features: ar
        ? ['توكنز غير محدودة','أولوية قصوى','مدير حساب مخصص','تقارير شهرية','API مباشر']
        : ['Unlimited tokens','Top priority','Dedicated manager','Monthly reports','Direct API'],
      badge: '✦ Pro', accent: 'var(--accent)',
    },
  ];

  useEffect(() => {
    const h = () => setTick(n => n + 1);
    window.addEventListener('zi:langchange', h);
    return () => window.removeEventListener('zi:langchange', h);
  }, []);

  // تحميل وسائل الدفع المتاحة
  useEffect(() => {
    apiFetch('/api/payment/methods').then(r => r.json()).then(d => setMethods(d.methods || {})).catch(() => {});
  }, []);

  // معالجة العودة من Stripe/PayPal
  useEffect(() => {
    const payment = searchParams.get('payment');
    const orderId = searchParams.get('token');   // PayPal passes order ID as ?token=
    const timers  = [];   // Bug C Fix: تتبع كل الـ timeouts لإلغائها عند unmount

    // Bug G Fix: رسائل Toast حسب اللغة الحالية
    const msgSuccess  = ar ? 'تم الدفع بنجاح! جارٍ تفعيل باقتك...' : 'Payment successful! Activating your plan...';
    const msgCancelled = ar ? 'تم إلغاء الدفع' : 'Payment cancelled';
    const msgCapError  = ar ? 'خطأ في تأكيد الدفع' : 'Payment confirmation failed';

    if (payment === 'success') {
      setToast({ type: 'success', text: msgSuccess });
      timers.push(setTimeout(() => { navigate('/dashboard'); }, 3000));
    } else if (payment === 'cancelled') {
      setToast({ type: 'error', text: msgCancelled });
      timers.push(setTimeout(() => setToast(null), 4000));
    } else if (orderId) {
      // capture PayPal — PayPal passes order ID as ?token= param
      // ملاحظة (الجزء 2): 409 يعني أن الدفع تم تأكيده مسبقاً — حالة متوقعة وليست خطأ عاماً.
      // 403 يعني أن الطلب لا يخص المستخدم الحالي — لا نُظهره كخطأ عام في التأكيد.
      apiFetch(`/api/payment/paypal/capture/${orderId}`, { method: 'POST' })
        .then(async r => {
          const d = await r.json().catch(() => ({}));
          if (r.status === 409) {
            // الدفع كان مكتملاً بالفعل — يُعامل كحالة نجاح وليس خطأ
            setToast({ type: 'success', text: msgSuccess });
            timers.push(setTimeout(() => navigate('/dashboard'), 3000));
            return;
          }
          if (r.status === 403) {
            setToast({ type: 'error', text: ar ? 'هذه العملية غير مرتبطة بحسابك' : 'This payment is not linked to your account' });
            return;
          }
          if (d.success) {
            setToast({ type: 'success', text: msgSuccess });
            timers.push(setTimeout(() => navigate('/dashboard'), 3000));
          } else {
            setToast({ type: 'error', text: d.error || (ar ? 'خطأ في تأكيد الدفع' : 'Payment confirmation failed') });
          }
        }).catch(() => setToast({ type: 'error', text: msgCapError }));
    }

    // Bug C Fix: cleanup — يُلغي كل timeout عند unmount لتجنب memory leak
    return () => timers.forEach(id => clearTimeout(id));
  }, []);

  return (
    <>
      <Navbar />
      <div className="page">

        {/* Toast */}
        {toast && (
          <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', zIndex:999, background: toast.type === 'success' ? '#0f3' : '#f33', color:'#000', padding:'12px 24px', borderRadius:12, fontWeight:700, fontSize:14, boxShadow:'0 8px 32px rgba(0,0,0,0.3)', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:8 }}>
            {toast.type === 'success' ? <IconCheckCircle /> : <IconXCircle />} {toast.text}
          </div>
        )}

        {/* العنوان */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 16px', borderRadius:20, marginBottom:14, background:'var(--accent-glow)', border:'1px solid rgba(245,158,11,0.2)', fontSize:13, fontWeight:700, color:'var(--accent)' }}>
            <IconZap /> ZIbot Plans
          </div>
          <h1 style={{ fontSize:30, fontWeight:900, marginBottom:10 }}>{ar ? 'اختر باقتك المناسبة' : 'Choose Your Plan'}</h1>
          <p style={{ color:'var(--text-muted)', fontSize:15 }}>{ar ? 'جميع الباقات تشمل ردوداً تلقائية على واتساب وماسنجر' : 'All plans include WhatsApp & Messenger auto-replies'}</p>
        </div>

        {/* بطاقات الخطط */}
        <div className="grid-3 mb-40">
          {PLANS_DEF.map(p => <PlanCard key={p.id} plan={p} current={user.plan || 'free'} onUpgrade={setModal} ar={ar} />)}
        </div>

        {/* برنامج الشركاء */}
        <div className="card" style={{ background:'linear-gradient(135deg, var(--bg-card) 0%, rgba(99,102,241,0.05) 100%)', border:'1px solid rgba(99,102,241,0.2)', marginBottom:32 }}>
          <div className="flex-between" style={{ flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#818cf8', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:6 }}><IconGem /> {ar ? 'برنامج الشركاء' : 'Affiliate Program'}</div>
              <h3 style={{ fontWeight:800, fontSize:18, marginBottom:6 }}>{ar ? 'اكسب 30% عمولة مدى الحياة' : 'Earn 30% Lifetime Commission'}</h3>
              <p style={{ color:'var(--text-muted)', fontSize:13, maxWidth:480 }}>
                {ar ? 'شارك رابطك واحصل على 30% من كل اشتراك — طالما المستخدم مشترك' : 'Share your link and earn 30% of every subscription — for life'}
              </p>
            </div>
            <button className="btn btn-secondary" style={{ flexShrink:0 }}>{ar ? 'انضم الآن →' : 'Join Now →'}</button>
          </div>
        </div>

        <div style={{ textAlign:'center' }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm">{ar ? '← العودة' : '← Back'}</button>
        </div>
      </div>

      {/* مودال الدفع */}
      {modal && <PaymentModal plan={modal} planDef={PLANS_DEF.find(p => p.id === modal)} methods={methods} onClose={() => setModal(null)} />}
    </>
  );
}
