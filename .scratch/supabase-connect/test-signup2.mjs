const BASE = 'https://qpnvdantkcudqdecqggr.supabase.co';
const KEY = 'sb_publishable_nQKoUFSei0-rrj5sZGSy-A_d7AH4Rf9';
const h = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
for (const email of [`sbtest-${Date.now()}@gmail.com`, `sbtest-${Date.now()}@correo.net`]) {
  const r = await fetch(`${BASE}/auth/v1/signup`, { method: 'POST', headers: h, body: JSON.stringify({ email, password: 'TestPass1234!' }) });
  const body = await r.json();
  console.log('signup', email, '->', r.status, JSON.stringify(body).slice(0, 300));
}
