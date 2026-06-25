const STORAGE_KEY = '__zi_fp';

async function sha256(msg) {
  try {
    const buf  = new TextEncoder().encode(msg);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
  } catch {
    // fallback لـ HTTP بدون HTTPS (Termux local)
    let h = 0;
    for (let i = 0; i < msg.length; i++) h = ((h << 5) - h + msg.charCodeAt(i)) | 0;
    return Math.abs(h).toString(16).padStart(8,'0').repeat(8).slice(0,64);
  }
}

async function canvasFingerprint() {
  try {
    const c = document.createElement('canvas');
    c.width = 200; c.height = 50;
    const ctx = c.getContext('2d');
    ctx.textBaseline = 'top'; ctx.font = '14px Arial';
    ctx.fillStyle = '#f60'; ctx.fillRect(125,1,62,20);
    ctx.fillStyle = '#069'; ctx.fillText('ZIbot',2,15);
    ctx.fillStyle = 'rgba(102,204,0,0.7)'; ctx.fillText('ZIbot',4,17);
    return c.toDataURL();
  } catch { return 'canvas-blocked'; }
}

async function audioFingerprint() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return 'no-audio';
    const ctx = new AC(), osc = ctx.createOscillator(), analyser = ctx.createAnalyser(), gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(analyser); analyser.connect(gain); gain.connect(ctx.destination);
    osc.start(0);
    const data = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(data);
    osc.stop(); await ctx.close();
    return data.slice(0,10).join(',');
  } catch { return 'audio-blocked'; }
}

async function generateFingerprint() {
  return sha256([
    navigator.userAgent,
    navigator.language,
    (navigator.languages||[]).join(','),
    String(screen.colorDepth),
    `${screen.width}x${screen.height}`,
    String(window.devicePixelRatio||1),
    Intl.DateTimeFormat().resolvedOptions().timeZone||'',
    String(navigator.hardwareConcurrency||0),
    navigator.platform||'',
    await canvasFingerprint(),
    await audioFingerprint(),
  ].join('|||'));
}

export async function getOrCreateFingerprint() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && /^[a-f0-9]{64}$/.test(saved)) return saved;
  } catch {}
  const fp = await generateFingerprint();
  try { localStorage.setItem(STORAGE_KEY, fp); } catch {}
  return fp;
}

export function getMetadata() {
  return {
    ua:       navigator.userAgent,
    lang:     navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone||'',
    platform: navigator.platform||'',
  };
}
