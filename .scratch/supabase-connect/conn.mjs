// Carga SUPABASE_DB_URL desde .env.local (gitignored) — ninguna credencial vive en estos scripts.
import { readFileSync } from 'node:fs';

const envPath = new URL('../../.env.local', import.meta.url);
const env = readFileSync(envPath, 'utf8');
for (const line of env.split('\n')) {
  const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line.trim());
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
}

export const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) {
  console.error('Falta SUPABASE_DB_URL en .env.local');
  process.exit(1);
}
