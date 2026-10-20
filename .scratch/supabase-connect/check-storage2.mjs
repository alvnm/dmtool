import { DB_URL } from './conn.mjs';
import pg from 'pg';
const c = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

const pol = await c.query(`select tablename, policyname, roles, cmd, qual from pg_policies where schemaname='storage' and tablename='buckets'`);
console.log('policies storage.buckets:', pol.rowCount);
for (const p of pol.rows) console.log(`  - ${p.policyname} [${p.roles}] ${p.cmd} qual=${(p.qual||'').slice(0,80)}`);

const rls = await c.query(`select relrowsecurity as rls, relforcerowsecurity as force from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='storage' and c.relname='buckets'`);
console.log('RLS storage.buckets:', JSON.stringify(rls.rows[0]));

const grants = await c.query(`select grantee, string_agg(privilege_type, ',') p from information_schema.role_table_grants where table_schema='storage' and table_name='buckets' group by grantee`);
console.log('grants storage.buckets:', grants.rows.map(r => `${r.grantee}:${r.p}`).join(' | '));

// ¿ve anon el bucket bajo RLS?
const anon = await c.query(`set role anon; select id from storage.buckets; reset role;`).catch(e => ({ rows: [], err: e.message }));
console.log('select como anon:', anon.err ?? (anon.rows.map(r => r.id).join(',') || '(vacío)'));

await c.end();
