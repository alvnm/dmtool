const KEY = 'sb_publishable_nQKoUFSei0-rrj5sZGSy-A_d7AH4Rf9';
const base = 'https://qpnvdantkcudqdecqggr.supabase.co/storage/v1';
for (const path of ['/bucket/uploads', '/buckets']) {
  const r = await fetch(base + path, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  const body = (await r.text()).slice(0, 250);
  console.log(`GET ${path} -> HTTP ${r.status}:`, body.replace(/\n/g, ' '));
}
