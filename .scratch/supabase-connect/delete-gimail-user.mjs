import { DB_URL } from './conn.mjs';
import pg from 'pg';

const c = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const res = await c.query(`DELETE FROM auth.users WHERE email = 'alisitogamer056@gimail.com'`);
console.log('Filas eliminadas:', res.rowCount);
await c.end();
