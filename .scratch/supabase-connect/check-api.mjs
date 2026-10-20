const URL_ = 'https://qpnvdantkcudqdecqggr.supabase.co';
const KEY = 'sb_publishable_nQKoUFSei0-rrj5sZGSy-A_d7AH4Rf9';
const h = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function probe(name, path, extra = {}) {
  try {
    const r = await fetch(URL_ + path, { headers: { ...h, ...extra.headers } });
    let body = '';
    try { body = (await r.text()).slice(0, 300); } catch {}
    console.log(`[${name}] HTTP ${r.status} ${r.statusText}`);
    console.log('   ' + body.replace(/\n/g, ' '));
    return r.status;
  } catch (e) {
    console.log(`[${name}] ERROR de red/SSL: ${e.cause?.code || e.message}`);
    return 0;
  }
}

await probe('auth health', '/auth/v1/health');
await probe('rest root', '/rest/v1/');
await probe('tabla campaigns', '/rest/v1/campaigns?select=id&limit=1');
await probe('tabla monsters', '/rest/v1/monsters?select=id&limit=1');
await probe('storage bucket uploads', '/storage/v1/bucket/uploads');
