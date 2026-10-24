// Confirmación SQL del usuario temporal de la auditoría (patrón ya usado el 2026-10-20).
// Uso: node confirm-audit-user.mjs <email>
import { DB_URL } from './conn.mjs';
import pg from 'pg';

const email = process.argv[2];
if (!email) { console.error('Falta el email'); process.exit(1); }

const c = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const res = await c.query(
  `UPDATE auth.users
      SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
          confirmed_at = COALESCE(confirmed_at, now()),
          confirmation_token = ''
    WHERE email = $1`,
  [email]
);
console.log('Filas confirmadas:', res.rowCount);
await c.end();
