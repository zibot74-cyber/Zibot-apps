#!/usr/bin/env node
// أداة تشخيص ZIbot QR — تعمل من Termux مباشرة
// الاستخدام: node zibot_qr_test.js

'use strict';

const BASE = 'http://localhost:3000';

async function step(label, fn) {
  process.stdout.write(`\n[${label}] ... `);
  try {
    const r = await fn();
    console.log('✅');
    return r;
  } catch (e) {
    console.log(`❌ ${e.message}`);
    process.exit(1);
  }
}

// ── مخزن الـ cookies بين الطلبات ──
const cookieJar = {};

function parseCookies(headers) {
  const raw = headers.get ? headers.get('set-cookie') : headers['set-cookie'];
  if (!raw) return;
  (Array.isArray(raw) ? raw : [raw]).forEach(c => {
    const [pair] = c.split(';');
    const [k, v] = pair.split('=');
    if (k && v) cookieJar[k.trim()] = v.trim();
  });
}

function cookieHeader() {
  return Object.entries(cookieJar).map(([k,v]) => `${k}=${v}`).join('; ');
}

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader(),
      ...(opts.headers || {}),
    },
  });
  parseCookies(res.headers);
  return res;
}

async function main() {
  console.log('\n══════════════════════════════════');
  console.log('  ZIbot QR Diagnostic Tool');
  console.log('══════════════════════════════════');

  // 1. تحقق السيرفر شغال
  await step('HEALTH', async () => {
    const r = await api('/api/health');
    if (!r.ok && r.status !== 404) throw new Error(`HTTP ${r.status}`);
    return r;
  });

  // 2. challenge
  const { nonce, ts, sig } = await step('CHALLENGE', async () => {
    const r = await api('/api/auth/challenge');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    console.log(`\n    nonce=${d.nonce?.slice(0,8)}... ts=${d.ts}`);
    return d;
  });

  // 3. fingerprint مزيف (للاختبار فقط)
  const fingerprint = 'termux-test-fp-' + Date.now() + '-abcdefghijklmnopqrstuvwxyz123456';

  // 4. identify
  const user = await step('IDENTIFY', async () => {
    const r = await api('/api/auth/identify', {
      method: 'POST',
      body: JSON.stringify({
        fingerprint,
        metadata: { ua: 'Termux/Test', lang: 'ar', tz: 'Africa/Cairo' },
        challenge_nonce: nonce,
        challenge_ts: ts,
        challenge_sig: sig,
      }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
    console.log(`\n    user_id=${d.user?.id} plan=${d.user?.plan} admin=${d.user?.is_admin}`);
    return d.user;
  });

  // 5. جلب QR
  const qr = await step('FETCH QR', async () => {
    const r = await api('/api/whatsapp/qr');
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
    return d;
  });

  // 6. عرض النتيجة
  console.log('\n══════════════════════════════════');
  console.log('  النتيجة:');
  console.log('══════════════════════════════════');
  console.log(`  configured  : ${qr.configured}`);
  console.log(`  phone       : ${qr.phone_number}`);
  console.log(`  verified    : ${qr.verified_name}`);
  console.log(`  error       : ${qr.error || 'لا يوجد'}`);
  console.log(`  qr_url type : ${qr.qr_url ? qr.qr_url.slice(0, 30) + '...' : 'NULL ❌'}`);

  if (qr.qr_url) {
    console.log('\n  ✅ QR يعمل بشكل صحيح!');
    console.log(`  wa link     : ${qr.raw_qr}`);

    // حفظ QR كملف HTML يفتح في المتصفح
    const html = `<!DOCTYPE html>
<html dir="rtl">
<head><meta charset="utf-8"><title>ZIbot QR Test</title></head>
<body style="text-align:center;padding:40px;font-family:sans-serif">
  <h2>✅ QR يعمل</h2>
  <p>الرقم: <b>${qr.phone_number}</b> — ${qr.verified_name}</p>
  <img src="${qr.qr_url}" style="width:300px;height:300px;border:1px solid #ccc;padding:10px"/>
  <p><a href="${qr.raw_qr}">${qr.raw_qr}</a></p>
  <p style="color:gray;font-size:12px">هذا ملف اختبار من zibot_qr_test.js</p>
</body></html>`;
    require('fs').writeFileSync('/data/data/com.termux/files/home/zibot_qr.html', html);
    console.log('\n  📄 فُتح ملف: /data/data/com.termux/files/home/zibot_qr.html');
    console.log('  افتحه في المتصفح لترى الـ QR الحقيقي\n');
  } else {
    console.log('\n  ❌ qr_url فارغ — المشكلة في getWhatsAppQR()');
    console.log(`  error: ${qr.error}\n`);
  }
}

main().catch(e => { console.error('\n❌ خطأ غير متوقع:', e.message); process.exit(1); });
