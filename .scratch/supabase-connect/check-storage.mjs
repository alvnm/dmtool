import { DB_URL } from './conn.mjs';
import pg from 'pg';
const c = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const pol = await c.query(`select policyname from pg_policies where schemaname='storage' and policyname like 'uploads%'`);
console.log('policies uploads en storage.objects:', pol.rows.map(r => r.policyname).join(', ') || '(ninguna)');
const b = await c.query(`select count(*)::int n from storage.buckets`);
console.log('buckets:', b.rows[0].n);
await c.end();
