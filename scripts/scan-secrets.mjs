#!/usr/bin/env node
/**
 * Escaneo de secretos en los archivos rastreados por git.
 * Uso: npm run secrets:scan
 * Devuelve código de salida 1 si detecta algo parecido a una credencial.
 */
import { execFileSync } from 'node:child_process';

const PATTERNS = [
  { name: 'JWT de Supabase (anon/service_role)', re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: 'Clave service_role / sb_secret_', re: /sb_secret_[A-Za-z0-9-]{8,}|service_role/i },
  { name: 'Llave privada', re: /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY/ },
  { name: 'Token estilo Stripe/AI', re: /\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{16,}|\bsk-[A-Za-z0-9]{20,}\b/ },
  { name: 'Credencial AWS', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Password en texto plano', re: /(password|passwd|pwd|secret|api[_-]?key)\s*[:=]\s*["'][^"']{8,}["']/i },
  { name: 'URL con credenciales', re: /[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]{6,}@/i },
];

// Archivos que se ignoran a propósito (contienen placeholders, no secretos).
const ALLOWLIST = new Set([
  'scripts/scan-secrets.mjs',
  'src/lib/supabase/keys.ts',
  '.env.local.example',
]);

let files;
try {
  files = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);
} catch {
  console.error('[secrets:scan] No se pudo leer la lista de archivos de git.');
  process.exit(2);
}

const fs = await import('node:fs');
let findings = 0;

for (const file of files) {
  if (ALLOWLIST.has(file)) continue;
  if (!fs.existsSync(file)) continue;
  const stat = fs.statSync(file);
  if (!stat.isFile() || stat.size > 2_000_000) continue;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    for (const { name, re } of PATTERNS) {
      if (re.test(line)) {
        findings += 1;
        console.log(`[secrets:scan] POSIBLE SECRETO (${name}) -> ${file}:${index + 1}`);
        console.log(`  ${line.trim().slice(0, 120)}`);
        break;
      }
    }
  });
}

if (findings > 0) {
  console.error(`\n[secrets:scan] ${findings} coincidencia(s). Si es un placeholder legítimo, añade el archivo a la allowlist de scripts/scan-secrets.mjs.`);
  process.exit(1);
}

console.log('[secrets:scan] OK: sin secretos en los archivos rastreados por git.');
