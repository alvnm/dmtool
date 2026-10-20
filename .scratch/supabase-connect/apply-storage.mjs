import { DB_URL } from './conn.mjs';
import pg from 'pg';
import { readFileSync } from 'node:fs';

const schema = readFileSync('../../supabase/schema.sql', 'utf8');
const marker = '-- STORAGE: bucket privado "uploads"';
const idx = schema.indexOf(marker);
if (idx === -1) { console.error('No se encontró la sección STORAGE en schema.sql'); process.exit(1); }
const sql = schema.slice(idx);

const c = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
try {
  await c.query('BEGIN');
  await c.query(sql);
  await c.query('COMMIT');
  console.log('Sección STORAGE aplicada OK');
} catch (e) {
  await c.query('ROLLBACK');
  console.error('ERROR:', e.message);
  process.exitCode = 1;
}
const b = await c.query(`select id, public, file_size_limit, allowed_mime_types from storage.buckets`);
console.log('buckets:', JSON.stringify(b.rows));
const pol = await c.query(`select policyname from pg_policies where schemaname='storage' and policyname like 'uploads%' order by policyname`);
console.log('policies:', pol.rows.map(r => r.policyname).join(', '));
await c.end();
