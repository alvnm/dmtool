import { DB_URL } from './conn.mjs';
import pg from 'pg';
const BASE = 'https://qpnvdantkcudqdecqggr.supabase.co';
const KEY = 'sb_publishable_nQKoUFSei0-rrj5sZGSy-A_d7AH4Rf9';
const EMAIL = process.env.TEST_EMAIL;

const db = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
await db.connect();
await db.query(`update auth.users set email_confirmed_at = now() where email = $1`, [EMAIL]);
const u = await db.query(`select id, email_confirmed_at is not null as confirmed from auth.users where email = $1`, [EMAIL]);
console.log('usuario confirmado:', JSON.stringify(u.rows[0]));

const r = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: 'TestPass1234!' }),
});
const session = await r.json();
console.log('password grant HTTP', r.status, session.access_token ? '-> session OK' : JSON.stringify(session).slice(0, 200));
if (!session.access_token) process.exit(1);
const T = session.access_token;
const uid = session.user?.id;

const b = await fetch(`${BASE}/storage/v1/bucket/uploads`, { headers: { apikey: KEY, Authorization: `Bearer ${T}` } });
console.log('GET /bucket/uploads (authenticated) -> HTTP', b.status, (await b.text()).slice(0, 200).replace(/\n/g, ' '));

// subida real de un objeto de prueba
const payload = Buffer.from('test-upload');
const up = await fetch(`${BASE}/storage/v1/object/uploads/${uid}/_test/conexion.txt`, {
  method: 'POST',
  headers: { apikey: KEY, Authorization: `Bearer ${T}`, 'Content-Type': 'text/plain' },
  body: payload,
});
console.log('POST /object/uploads/<uid>/_test/conexion.txt -> HTTP', up.status, (await up.text()).slice(0, 200).replace(/\n/g, ' '));

const del = await fetch(`${BASE}/storage/v1/object/uploads/${uid}/_test/conexion.txt`, {
  method: 'DELETE', headers: { apikey: KEY, Authorization: `Bearer ${T}` },
});
console.log('DELETE objeto de prueba -> HTTP', del.status, (await del.text()).slice(0, 150).replace(/\n/g, ' '));

// limpieza total del usuario de prueba
const objs = await db.query(`delete from storage.objects where bucket_id='uploads' and name like $1`, [`${uid}/%`]);
await db.query(`delete from auth.refresh_tokens where user_id = $1`, [uid]);
await db.query(`delete from auth.identities where user_id = $1`, [uid]);
const delUser = await db.query(`delete from auth.users where id = $1 returning email`, [uid]);
console.log('limpieza: objetos borrados=', objs.rowCount, '| usuario de prueba borrado=', delUser.rows[0]?.email ?? 'NO');
await db.end();
