#!/usr/bin/env node
/**
 * Comprobación rápida de credenciales Supabase en .env.local.
 *
 * `next build` falla con un error críptico ("Package subpath './...'" o
 * trazas del cliente Supabase) cuando NEXT_PUBLIC_SUPABASE_URL /
 * NEXT_PUBLIC_SUPABASE_ANON_KEY siguen siendo los placeholders del
 * repositorio. Este script lo deja claro ANTES de compilar.
 *
 * Uso:  node scripts/check-supabase-env.mjs
 * Sale con código 0 si todo está bien (o si no hay .env.local: modo demo).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PLACEHOLDERS = [
  'https://placeholder-project.supabase.co',
  'placeholder-anon-key',
  'your-project.supabase.co',
  'your-anon-key',
];

const envPath = resolve(process.cwd(), '.env.local');

if (!existsSync(envPath)) {
  console.log('check-supabase-env: no hay .env.local (modo demo/local). OK.');
  process.exit(0);
}

const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
const problems = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq < 0) continue;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim();
  if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
    if (PLACEHOLDERS.includes(value)) {
      problems.push('NEXT_PUBLIC_SUPABase_URL sigue con el placeholder del repositorio.');
    } else if (!/^https:\/\/.+\.supabase\.co$/.test(value)) {
      problems.push(`NEXT_PUBLIC_SUPABASE_URL no parece una URL válida: ${value.slice(0, 40)}`);
    } else {
      console.log(`  URL OK: ${value.replace(/^(https:\/\/).*(\.supabase\.co)$/, '$1***$2')}`);
    }
  }
  if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
    if (PLACEHOLDERS.includes(value)) {
      problems.push('NEXT_PUBLIC_SUPABASE_ANON_KEY sigue con la clave placeholder del repositorio.');
    } else if (value.length < 40) {
      problems.push('NEXT_PUBLIC_SUPABASE_ANON_KEY parece demasiado corta para ser la anon key.');
    } else {
      console.log(`  Clave anon OK (${value.length} caracteres).`);
    }
  }
}

if (problems.length) {
  console.error('\ncheck-supabase-env: credenciales de Supabase no configuradas:');
  for (const p of problems) console.error('  ✗ ' + p);
  console.error('\n  Edita .env.local con la URL y la clave anon de tu proyecto:');
  console.error('    NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co');
  console.error('    NEXT_PUBLIC_SUPABASE_ANON_KEY=<clave anon/publishable>');
  console.error('  (NUNCA uses la clave service_role en el navegador.)\n');
  process.exit(1);
}

console.log('check-supabase-env: credenciales válidas. OK.');