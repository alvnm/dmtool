import { DB_URL } from './conn.mjs';
import pg from 'pg';
const c = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const r = await c.query(`select email, created_at, confirmation_sent_at, confirmation_token <> '' as has_conf_token, recovery_sent_at, email_change_sent_at, invited_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data from auth.users order by created_at desc limit 3`);
for (const row of r.rows) console.log(JSON.stringify(row, null, 1));
await c.end();
