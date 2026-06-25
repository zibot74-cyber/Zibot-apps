// ════════════════════════════════════════════════════════
//  auth.js  —  مدير الجلسة (Cookie-based — Secure)
//  الـ JWT يُحفظ في httpOnly cookie لا يمكن قراءته من JS
//  هنا نحفظ فقط بيانات المستخدم غير الحساسة في localStorage
// ════════════════════════════════════════════════════════

import { getOrCreateFingerprint, getMetadata } from './fingerprint.js';

const USER_KEY = 'zi_user';
const API      = '/api';

const FETCH_OPTS = { credentials: 'include' };

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearSession() {
  try { localStorage.removeItem(USER_KEY); } catch { /* ignore */ }
}

function saveUser(user) {
  try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch { /* ignore */ }
}

export async function identify() {
  const fingerprint = await getOrCreateFingerprint();
  const metadata    = getMetadata();

  // يجب استدعاء GET /api/auth/challenge أولاً قبل إرسال /identify
  const chRes = await fetch(`${API}/auth/challenge`, { ...FETCH_OPTS });
  if (!chRes.ok) throw new Error('CHALLENGE_FETCH_FAILED');
  const { nonce, ts, sig } = await chRes.json();

  const res = await fetch(`${API}/auth/identify`, {
    ...FETCH_OPTS,
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      fingerprint, metadata,
      challenge_nonce: nonce, challenge_ts: ts, challenge_sig: sig,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  saveUser(data.user);
  return data;
}

export async function refreshToken() {
  const res = await fetch(`${API}/auth/refresh`, {
    ...FETCH_OPTS,
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error('refresh_failed');

  const data = await res.json();
  if (data.user) saveUser(data.user);
  return data;
}

export async function logout() {
  try {
    await fetch(`${API}/auth/logout`, { ...FETCH_OPTS, method: 'POST' });
  } catch { /* ignore */ }
  clearSession();
}

export async function apiFetch(url, options = {}) {
  let res = await fetch(url, { ...options, ...FETCH_OPTS,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });

  if (res.status === 401) {
    try {
      await refreshToken();
      res = await fetch(url, { ...options, ...FETCH_OPTS,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      });
    } catch {
      clearSession();
      try {
        await identify();
        res = await fetch(url, { ...options, ...FETCH_OPTS,
          headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        });
      } catch {
        throw new Error('AUTH_FAILED');
      }
    }
  }

  return res;
}

export async function registerEmail(email, password, name = '') {
  const res = await fetch(`${API}/auth/register`, {
    ...FETCH_OPTS,
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  if (data.user) saveUser(data.user);
  return data;
}

export async function loginEmail(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    ...FETCH_OPTS,
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  if (data.user) saveUser(data.user);
  return data;
}

export async function forgotPassword(email) {
  const res = await fetch(`${API}/auth/forgot-password`, {
    ...FETCH_OPTS,
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function resetPassword(token, password) {
  const res = await fetch(`${API}/auth/reset-password`, {
    ...FETCH_OPTS,
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function verifyEmail(token) {
  const res = await fetch(`${API}/auth/verify-email/${encodeURIComponent(token)}`, { ...FETCH_OPTS });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export function isAdmin() {
  try {
    const u = JSON.parse(localStorage.getItem('zi_user') || '{}');
    return !!u.is_admin;
  } catch { return false; }
}

export function getStoredToken() { return null; }
