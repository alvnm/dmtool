import { DB_URL } from './conn.mjs';
import pg from 'pg';
const c = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const owner = await c.query(`select pg_get_userbyid(relowner) as owner, relrowsecurity as rls, relforcerowsecurity as force from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='storage' and c.relname='buckets'`);
console.log('owner de storage.buckets:', JSON.stringify(owner.rows[0]));
for (const role of ['anon', 'authenticated']) {
  const r = await c.query(`set role ${role}; select id from storage.buckets; reset role;`).catch(e => ({ err: e.message }));
  console.log(`select como ${role}:`, r.err ?? (r.rows?.map(x => x.id).join(',') || '(vacío)'));
}
await c.end();
