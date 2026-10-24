/**
 * Codemod único (ejecutar con `node scripts/codemod-design.mjs`) que aplica el
 * vocabulario visual compartido de globals.css a todos los .tsx de src:
 *   - inputs/textarea/select  -> .input (+ utilidades que sobrescriben)
 *   - <label> de formulario   -> .label
 *   - botones primarios/secundarios/de solo-icono -> .btn + variante
 *   - tarjetas de módulo      -> .card (.card-interactive)
 *   - text-[10px]/[11px]      -> .text-micro (escala única de 11px)
 *   - chips de encabezado     -> acento ámbar único, color solo en el icono
 *
 * Idempotente: se puede volver a ejecutar sin acumular clases.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = [];
const walk = d => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) files.push(p);
  }
};
walk('src');

const stats = {};
const bump = k => (stats[k] = (stats[k] ?? 0) + 1);

const tokenize = s => s.split(/\s+/).filter(Boolean);
const dedupe = toks => [...new Set(toks)];

const DROP_INPUT = new Set([
  'w-full', 'bg-dungeon-950', 'border', 'border-dungeon-800', 'rounded-lg', 'rounded',
  'p-2', 'text-sm', 'text-slate-200', 'placeholder:text-slate-500',
  'focus:border-amber-500', 'focus:border-amber-500/50', 'focus:outline-none',
]);
const DROP_LABEL = new Set([
  'block', 'text-xs', 'font-semibold', 'text-slate-400', 'mb-1',
]);

function transformInput(tags, tokens) {
  const has = t => tokens.includes(t);
  const isField = (has('bg-dungeon-950') || has('bg-dungeon-900')) && has('border-dungeon-800') &&
    (has('rounded-lg') || has('rounded')) && has('text-slate-200');
  if (!isField) return null;
  bump('input');
  const kept = tokens.filter(t => !DROP_INPUT.has(t));
  // Si el original era text-xs, lo conservamos para sobrescribir el text-sm de .input.
  if (has('text-xs')) kept.push('text-xs');
  if (has('bg-dungeon-900')) kept.push('bg-dungeon-900');
  if (has('text-center')) kept.push('text-center');
  if (has('font-mono')) kept.push('font-mono');
  if (has('resize-none')) kept.push('resize-none');
  return dedupe(['input', ...kept]).join(' ');
}

function transformButton(tags, tokens) {
  const has = t => tokens.includes(t);
  const isPrimary =
    (has('bg-amber-500') && has('hover:bg-amber-450') && has('text-slate-950')) ||
    (has('from-amber-600') && has('to-amber-500') && has('text-slate-950'));
  const isSecondary =
    !isPrimary && has('bg-dungeon-800') && has('border-dungeon-700') &&
    (has('text-slate-300') || has('text-slate-400')) && has('hover:bg-dungeon-700');
  const isIcon =
    (has('p-1.5') || has('p-1') || has('p-2')) &&
    (has('hover:text-amber-400') || has('hover:text-red-400') || has('hover:text-purple-300')) &&
    (has('hover:bg-amber-500/10') || has('hover:bg-red-500/10') || has('hover:bg-dungeon-800') || has('hover:bg-purple-950') || !has('hover:bg-dungeon-700'));

  const drop = new Set(['transition', 'rounded-lg', 'rounded', 'font-bold', 'font-semibold', 'font-medium', 'text-xs']);
  let variant = null;

  if (isPrimary) {
    variant = 'btn-primary';
    ['bg-amber-500', 'hover:bg-amber-450', 'text-slate-950', 'bg-gradient-to-r',
      'from-amber-600', 'to-amber-500', 'hover:from-amber-500', 'hover:to-amber-400',
      'px-4', 'py-2'].forEach(t => drop.add(t));
    bump('btn-primary');
  } else if (isSecondary) {
    variant = 'btn-secondary';
    ['bg-dungeon-800', 'hover:bg-dungeon-700', 'border', 'border-dungeon-700',
      'text-slate-300', 'text-slate-400', 'hover:text-slate-100'].forEach(t => drop.add(t));
    bump('btn-secondary');
  } else if (isIcon) {
    variant = 'btn-icon';
    ['p-1.5', 'p-1', 'p-2'].forEach(t => drop.add(t));
    bump('btn-icon');
  } else {
    // Botón no reconocido: solo normalizamos tamaño base sin colors.
    variant = null;
  }

  const kept = tokens.filter(t => !drop.has(t) && !t.startsWith('from-') && !t.startsWith('to-') && !t.startsWith('hover:from') && !t.startsWith('hover:to'));
  // Normalizamos texto-slate-500 (bajo contraste) a 400 en botones de icono.
  const out = kept.map(t => (variant === 'btn-icon' && t === 'text-slate-500' ? 'text-slate-400' : t));
  return dedupe(['btn', variant, ...out].filter(Boolean)).join(' ');
}

function transformCard(tags, tokens) {
  const has = t => tokens.includes(t);
  if (!(has('bg-dungeon-900') && has('border-dungeon-800') && (has('rounded-xl') || has('rounded-lg')))) return null;
  const drop = new Set(['bg-dungeon-900', 'border', 'border-dungeon-800', 'rounded-xl', 'rounded-lg', 'p-4', 'p-5', 'p-6', 'shadow-lg', 'shadow-md', 'shadow-xl', 'transition']);
  const kept = tokens.filter(t => !drop.has(t));
  const interactive = tokens.some(t => t.startsWith('hover:border-'));
  bump(interactive ? 'card-interactive' : 'card');
  return dedupe(['card', interactive ? 'card-interactive' : null, ...kept].filter(Boolean)).join(' ');
}

// --- Recorrido por etiquetas JSX (parser de atributos a nivel de llaves) ----
function parseTag(src, i) {
  let depth = 0, q = null;
  for (let j = i + 1; j < src.length; j++) {
    const c = src[j];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '{' || c === '(' || c === '[') depth++;
    else if (c === '}' || c === ')' || c === ']') depth--;
    else if (c === '>' && depth === 0) return { text: src.slice(i, j + 1), end: j + 1 };
    else if (c === '<' && depth === 0) return null;
  }
  return null;
}

const CHIP_RE = /bg-([a-z]+)-500\/10 border border-\1-500\/30 rounded-lg text-\1-400/;

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  const re = /<([A-Za-z][\w.]*)/g;
  const edits = [];
  let m;
  while ((m = re.exec(src))) {
    const tag = m[1];
    const parsed = parseTag(src, m.index);
    if (!parsed) continue;
    const cm = parsed.text.match(/className="([^"]*)"/);
    if (!cm) continue;
    const className = cm[1];
    if (className.includes('${')) continue; // plantillas dinámicas: se dejan a mano

    let tokens = tokenize(className);
    let next = null;

    if (/^(input|textarea|select)$/.test(tag)) next = transformInput(tag, tokens);
    else if (/^(button|motion\.button)$/.test(tag)) next = transformButton(tag, tokens);
    else if (/^(div|section|article)$/.test(tag)) next = transformCard(tag, tokens);
    else if (tag === 'label' && tokens.includes('block') && tokens.includes('text-xs') && tokens.includes('text-slate-400')) {
      next = 'label';
      bump('label');
    }

    if (next && next !== className) {
      edits.push([cm[0], `className="${next}"`]);
    }
  }

  // Aplicamos de atrás hacia delante para conservar offsets.
  for (let k = edits.length - 1; k >= 0; k--) {
    src = src.replace(edits[k][0], () => edits[k][1]);
  }

  // Chips de encabezado: acento ámbar único, el color queda solo en el icono.
  src = src.replace(
    new RegExp(CHIP_RE.source, 'g'),
    (full, color) => {
      bump('chip-header');
      // El siguiente icono hereda el color del módulo.
      src = src.replace(
        new RegExp(`(<${'[A-Z][A-Za-z]*'}[^>]*className=")(w-6 h-6)(")`),
        (f, a, size, b) => `${a}${size} text-${color}-400${b}`
      );
      return `bg-amber-500/10 border border-amber-500/30 rounded-lg`;
    }
  );

  // Escala única de texto pequeño.
  const micro = src.match(/text-\[1[01]px\]/g);
  if (micro) {
    src = src.replace(/text-\[10px\]/g, 'text-micro').replace(/text-\[11px\]/g, 'text-micro');
    bump('text-micro');
  }

  writeFileSync(file, src);
}

console.log('Codemod aplicado:');
Object.entries(stats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
