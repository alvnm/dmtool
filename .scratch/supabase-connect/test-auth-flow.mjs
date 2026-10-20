const BASE = 'https://qpnvdantkcudqdecqggr.supabase.co';
const KEY = 'sb_publishable_nQKoUFSei0-rrj5sZGSy-A_d7AH4Rf9';
const h = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const email = `sbtest-${Date.now()}@example.com`;
const password = 'TestPass1234!';

const r = await fetch(`${BASE}/auth/v1/signup`, {
  method: 'POST', headers: h,
  body: JSON.stringify({ email, password, data: {} }),
});
const body = await r.json();
console.log('signup HTTP', r.status);
console.log('  keys:', Object.keys(body).join(', '));
console.log('  tiene access_token:', Boolean(body.access_token));
console.log('  user id:', body.user?.id ?? body.id ?? '(ninguno)');
if (body.access_token) {
  const sKEY = body.access_token;
  const b = await fetch(`${BASE}/storage/v1/bucket/uploads`, { headers: { apikey: KEY, Authorization: `Bearer ${sKEY}` } });
  console.log('GET /bucket/uploads como authenticated -> HTTP', b.status, (await b.text()).slice(0, 200).replace(/\n/g, ' '));
}
console.log('EMAIL_TEST=' + email);
