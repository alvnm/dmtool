import { DB_URL } from './conn.mjs';
import pg from 'pg';
const BASE = 'https://qpnvdantkcudqdecqggr.supabase.co';
const KEY = 'sb_publishable_nQKoUFSei0-rrj5sZGSy-A_d7AH4Rf9';
const EMAIL = process.env.TEST_EMAIL;

const r = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
  method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: 'TestPass1234!' }),
});
const session = await r.json();
if (!session.access_token) { console.log('sin sesión:', JSON.stringify(session).slice(0, 200)); process.exit(1); }
const T = session.access_token, uid = session.user.id;
const path = `uploads/${uid}/_test/conexion.png`;
// 1x1 PNG transparente
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

const up = await fetch(`${BASE}/storage/v1/object/${path}`, {
  method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${T}`, 'Content-Type': 'image/png' }, body: png,
});
console.log('UPLOAD png ->', up.status, (await up.text()).slice(0, 150).replace(/\n/g, ' '));

const get = await fetch(`${BASE}/storage/v1/object/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${T}` } });
console.log('DOWNLOAD como dueño ->', get.status, '(bytes:', (await get.arrayBuffer()).byteLength, ')');

const del = await fetch(`${BASE}/storage/v1/object/${path}`, { method: 'DELETE', headers: { apikey: KEY, Authorization: `Bearer ${T}` } });
console.log('DELETE como dueño ->', del.status, (await del.text()).slice(0, 120).replace(/\n/g, ' '));

// limpieza del usuario de prueba
const db = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
await db.connect();
const objs = await db.query(`select count(*)::int n from storage.objects where bucket_id='uploads'`).catch(() => null);
console.log('objetos restantes en uploads:', objs?.rows[0].n ?? '(no consultable)');
await db.query(`delete from auth.refresh_tokens where user_id = $1`, [uid]);
await db.query(`delete from auth.identities where user_id = $1`, [uid]);
const du = await db.query(`delete from auth.users where id = $1 returning email`, [uid]);
console.log('usuario de prueba eliminado:', du.rows[0]?.email ?? 'NO');
const total = await db.query(`select count(*)::int n from auth.users`);
console.log('auth.users total ahora:', total.rows[0].n);
await db.end();
