/**
 * Reparación puntual del codemod de diseño (dos fases, sin reescrituras
 * anidadas; se puede repetir sin acumular nada):
 *  1. Los chips de encabezado pasaron a acento ámbar, pero el color del módulo
 *     se queda en el icono: se recupera del HEAD y se inyecta.
 *  2. Los contenedores de modal que quedaron como `.card` perdieron su `p-6`
 *     (la tarjeta usa p-4): se restaura el padding original del HEAD.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync as _exec } from 'node:child_process';

const sh = cmd => _exec(cmd, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const changed = sh('git diff --name-only -- src')
  .split('\n')
  .map(s => s.trim())
  .filter(f => f.endsWith('.tsx'));

let icons = 0;
let modals = 0;

for (const file of changed) {
  let current;
  try {
    current = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  let original;
  try {
    original = sh(`git show HEAD:${file.replace(/\\/g, '/')}`);
  } catch {
    continue;
  }

  // Colores originales de los chips, en orden de aparición.
  const originalColors = [...original.matchAll(/bg-([a-z]+)-500\/10 border border-\1-500\/30 rounded-lg/g)].map(m => m[1]);

  // FASE 1: localizar los iconos a repintar (offset + color), sin escribir.
  const chipRe = /className="p-3 bg-amber-500\/10 border border-amber-500\/30 rounded-lg"/g;
  const patches = [];
  let idx = 0;
  let m;
  while ((m = chipRe.exec(current))) {
    const color = originalColors[idx] ?? 'amber';
    idx += 1;
    const tail = current.slice(m.index, m.index + 600);
    const icon = tail.match(/<([A-Z][\w.]*)\s+className="([^"]*)"/);
    if (icon && !icon[2].includes('text-')) {
      patches.push({ at: m.index + icon.index, full: icon[0], cls: icon[2], color });
    }
  }

  // FASE 2: aplicar de atrás hacia delante para conservar los offsets.
  for (const p of patches.sort((a, b) => b.at - a.at)) {
    const patched = p.full.replace(`className="${p.cls}"`, `className="${p.cls} text-${p.color}-400"`);
    current = current.slice(0, p.at) + patched + current.slice(p.at + p.full.length);
    icons += 1;
  }

  // Modales: restaurar p-6 (guardado en el HEAD).
  current = current.replace(/className="(card max-w-[^"]*)"/g, (match, cls) => {
    const maxw = (cls.match(/max-w-\S+/) ?? [])[0];
    if (!maxw) return match;
    const originalModal = original.match(new RegExp(`bg-dungeon-900 border border-dungeon-800[^"]*${maxw}[^"]*`));
    if (originalModal && /\sp-6\b/.test(originalModal[0]) && !/\sp-6\b/.test(cls)) {
      modals += 1;
      return `className="${cls.replace('card ', 'card p-6 ')}"`;
    }
    return match;
  });

  writeFileSync(file, current);
}

console.log(`Iconos de chip repintados: ${icons}`);
console.log(`Modales con p-6 restaurado: ${modals}`);
