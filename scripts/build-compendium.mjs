#!/usr/bin/env node
/**
 * build-compendium.mjs
 * ---------------------------------------------------------------------------
 * Pipeline de extracción y unificación de datos D&D 5e desde:
 *   B1: github.com/beaurancourt/bestiary         (Markdown Jekyll en _posts/ — monstruos)
 *   B2: github.com/Libco/bestiary5thedition      (JSON SRD en assets/srd_5e.json — monstruos)
 *   B3: github.com/vorpalhex/srd_spells          (JSON SRD en spells.json — 396 hechizos)
 *
 * Salidas (data/compendium/):
 *   monsters.json      -> esquema unificado rico (superset de ambos orígenes)
 *   monsters.app.json  -> mapeado al tipo `Monster` de src/types del proyecto
 *   monsters.md        -> informe: fuentes, deduplicación, conflictos, tabla
 *   spells.json        -> grimorio SRD completo (esquema documentado)
 *   spells.app.json    -> mapeado al tipo `Spell` de src/types (escuela/clases en español)
 *
 * Uso:  node scripts/build-compendium.mjs
 * Requiere los repos clonados en .sources/bestiary1, .sources/bestiary2 y .sources/spells1.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC1 = path.join(ROOT, '.sources', 'bestiary1', '_posts');
const SRC2 = path.join(ROOT, '.sources', 'bestiary2', 'app', 'src', 'main', 'assets', 'srd_5e.json');
const SRC3 = path.join(ROOT, '.sources', 'spells1', 'spells.json');
const OUT = path.join(ROOT, 'data', 'compendium');

const REPORT = { warnings: [], conflicts: [], recovered: [], unknownLabels: [] };

// ---------------------------------------------------------------- utilidades
const stripCr = (s) => s.replace(/\r/g, '');
const clean = (s) => (s ?? '').toString().trim().replace(/\s+/g, ' ').replace(/ft\.\d+/g, 'ft.'); // limpia números de página pegados ("ft.268")
const normKey = (name) =>
  clean(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
const slugify = (name) =>
  clean(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const XP_BY_CR = { 0: 10, 0.125: 25, 0.25: 50, 0.5: 100, 1: 200, 2: 450, 3: 700, 4: 1100,
  5: 1800, 6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900, 11: 7200, 12: 8400, 13: 10000,
  14: 11500, 15: 13000, 16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000,
  21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000, 26: 90000, 27: 105000,
  28: 120000, 29: 135000, 30: 155000 };

function crToString(cr) {
  const n = typeof cr === 'string' ? parseFloat(cr) : cr;
  if (n === 0.125) return '1/8';
  if (n === 0.25) return '1/4';
  if (n === 0.5) return '1/2';
  if (Number.isInteger(n)) return String(n);
  return String(n);
}
function xpForCr(crStr) {
  const n = crStr.includes('/') ? ({ '1/8': 0.125, '1/4': 0.25, '1/2': 0.5 }[crStr] ?? parseFloat(crStr)) : parseFloat(crStr);
  return XP_BY_CR[n] ?? null;
}
const DMG_TYPES = new Set(['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic',
  'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder']);

function splitList(v) {
  if (Array.isArray(v)) {
    return v.map((x) => (typeof x === 'object' && x?.name ? x.name : String(x)))
      .map(clean).filter(Boolean);
  }
  const s = String(v ?? '');
  if (!s.trim()) return [];
  const out = [];
  for (const segment of s.split(';')) {
    if (!segment.trim()) continue;
    let frags = segment.split(',').map(clean).filter(Boolean);
    // une fragmentos que empiezan con "and " al anterior
    const merged = [];
    for (const f of frags) {
      if (/^and\s+/i.test(f) && merged.length) merged[merged.length - 1] += ', ' + f;
      else merged.push(f);
    }
    // si un fragmento es frase calificativa ("... from nonmagical weapons", "... that aren't ...")
    // absorbe los tipos conocidos que lo preceden
    const res = [];
    for (const f of merged) {
      if (/\s(from|that|damage|nonmagical)\b/i.test(f) && DMG_TYPES.has((res.at(-1) || '').toLowerCase())) {
        res[res.length - 1] += ', ' + f;
      } else res.push(f);
    }
    out.push(...res);
  }
  return out.map(clean).filter((x) => x && x !== '—');
}

// -------------------------------------------------- B1: parser Markdown Jekyll
const META_LABELS = new Set(['Armor Class', 'Hit Points', 'Speed', 'Saving Throws', 'Skills',
  'Senses', 'Languages', 'Challenge', 'Damage Vulnerabilities', 'Damage Resistances',
  'Damage Immunities', 'Condition Immunities', 'Condition Resistances']);
const SECTION_HEADERS = new Set(['Actions', 'Reactions', 'Legendary Actions']);
const SAVE_ABBR = { str: 'strength', dex: 'dexterity', con: 'constitution', int: 'intelligence', wis: 'wisdom', cha: 'charisma' };

// Heurística anti-"línea pegada": parte `Nombre. Desc. Nombre2. Desc2` en entradas.
// Candidato: palabras iniciales Mayúscula (1-5) seguidas de punto; inicia tras ". "
// o al comienzo de línea. Para palabras sueltas se aplica lista negra de conectores.
const COMMON_STARTERS = new Set(('the if when on a an it he she they each every this that these those once after before while until in at by for from with no any all both your its their but or and so as be can must should will is are was were do does did may might have has had not there here').split(' '));

function glueSplit(text) {
  const out = [];
  const re = /(?:^|[.]\s+)([A-Z][\w'’]*(?:\s+[A-Z][\w'’]*){0,4})\.\s+/g;
  let last = 0, m;
  const marks = [];
  while ((m = re.exec(text)) !== null) {
    const words = m[1].split(/\s+/);
    const single = words.length === 1 && COMMON_STARTERS.has(words[0].toLowerCase());
    if (!single) marks.push({ idx: m.index + m[0].indexOf(m[1]), name: m[1], after: re.lastIndex });
  }
  if (marks.length === 0) return null;
  // El primer fragmento (antes del primer candidato) se conserva pegado a la entrada previa
  for (let i = 0; i < marks.length; i++) {
    const start = i === 0 ? 0 : marks[i - 1].after;
    const seg = clean(text.slice(marks[i].idx, i + 1 < marks.length ? marks[i + 1].idx : text.length));
    if (seg) out.push({ name: marks[i].name, desc: clean(seg.replace(new RegExp('^' + escapeRe(marks[i].name) + '\\.\\s*'), '')) || seg });
  }
  const head = clean(text.slice(0, marks[0].idx));
  return { head, entries: out };
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function parseB1(file) {
  const raw = stripCr(fs.readFileSync(path.join(SRC1, file), 'utf8'));
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const fm = fmMatch ? fmMatch[1] : '';
  const body = fmMatch ? fmMatch[2] : raw;
  const title = (fm.match(/^title:\s*"?(.+?)"?\s*$/m) || [, ''])[1];
  const tags = ((fm.match(/^tags:\s*\[(.*?)\]/m) || [, ''])[1] || '').split(',').map((t) => t.trim()).filter(Boolean);

  const mon = {
    name: clean(title), size: null, type: null, subtype: null, alignment: null,
    armor_class: { value: null, note: null }, hit_points: null, hit_dice: null, speed: null,
    abilities: null, saves: {}, skills: {},
    damage_vulnerabilities: [], damage_resistances: [], damage_immunities: [], condition_immunities: [],
    senses: null, languages: null, challenge_rating: null, experience_points: null,
    traits: [], actions: [], reactions: [], legendary: { description: null, actions: [] },
  };

  let section = 'header';
  let current = null; // entrada en curso (multilínea)
  const pushCurrent = () => { current = null; };

  // pre-proceso: repara etiquetas partidas por salto de línea en la fuente B1
  //   "**Damage** Resistances fire" / "**Immunities** bludgeoning..." / "**Damage**\n**Resistances** x"
  const rawLines = body.split('\n');
  const lines = [];
  for (let i = 0; i < rawLines.length; i++) {
    let l = stripCr(rawLines[i]).replace(/\s+$/, '');
    const splitLabel = l.match(/^\*\*Damage\*\*\s*(Resistances|Immunities|Vulnerabilities)\b\s*(.*)$/);
    if (splitLabel) { lines.push(`**Damage ${splitLabel[1]}** ${splitLabel[2]}`); continue; }
    const bareLabel = l.match(/^\*\*(Resistances|Immunities|Vulnerabilities)\*\*\s*(.*)$/);
    if (bareLabel) { lines.push(`**Damage ${bareLabel[1]}** ${bareLabel[2]}`); continue; }
    if (/^\*\*Damage\*\*\s*$/.test(l)) {
      const m2 = (rawLines[i + 1] ?? '').replace(/\s+$/, '').match(/^\*\*(Resistances|Immunities|Vulnerabilities)\*\*\s*(.*)$/);
      if (m2) { lines.push(`**Damage ${m2[1]}** ${m2[2]}`); i++; continue; }
    }
    lines.push(l);
  }
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li].replace(/\s+$/, '');
    const t = line.trim();
    if (!t || t === '---') continue;

    // --- línea de criatura: **Large aberration, lawful evil**
    const creature = t.match(/^\*\*((?:Tiny|Small|Medium|Large|Huge|Gargantuan)\b[^*]*)\*\*$/i);
    if (creature) {
      let rest = creature[1].trim();
      const size = (rest.match(/^(Tiny|Small|Medium|Large|Huge|Gargantuan)/i) || [])[0];
      mon.size = size ? size[0].toUpperCase() + size.slice(1).toLowerCase() : null;
      rest = clean(rest.slice(size.length));
      const alignMatch = rest.match(/,\s*([^,]+)$/);
      let typePart = rest;
      if (alignMatch && !/^[\w\s'-]+\(.*\)$/.test(rest)) {
        // última coma separa alineación (salvo que la coma pertenezca a un subtipo entre paréntesis)
        const lastComma = rest.lastIndexOf(',');
        const after = clean(rest.slice(lastComma + 1));
        if (/^(lawful|neutral|chaotic|any|unaligned)/i.test(after)) {
          mon.alignment = after;
          typePart = clean(rest.slice(0, lastComma));
        }
      }
      if (!mon.alignment) mon.alignment = rest.includes('unaligned') ? 'unaligned' : null;
      const sub = typePart.match(/^(.*?)\s*\((.*?)\)/);
      if (sub) { mon.type = clean(sub[1]); mon.subtype = clean(sub[2]); }
      else if (/^swarm of/i.test(typePart)) {
        mon.type = 'swarm';
        mon.subtype = clean(typePart.replace(/^swarm of\s*/i, ''));
      } else mon.type = typePart;
      section = 'header';
      continue;
    }

    // --- cabecera de sección: **Actions** / **Reactions** / **Legendary Actions**
    const sec = t.match(/^\*\*((?:Legendary )?Actions(?: for Type \d+)?|Reactions|Legendary Actions)\*\*\s*(.*)$/);
    if (sec) {
      pushCurrent();
      section = sec[1].startsWith('Actions') ? 'actions' : sec[1] === 'Reactions' ? 'reactions' : 'legendary';
      const rest = clean(sec[2]);
      if (rest && section === 'legendary') mon.legendary.description = rest;
      else if (rest) {
        // texto pegado tras la cabecera de sección (ficheros con salto de línea perdido)
        const p = rest.match(/^([A-Z][\w'’()\/ -]{1,40}?)\.\s+([A-Z].*)$/);
        if (p && !COMMON_STARTERS.has(p[1].toLowerCase())) {
          const entry = { name: clean(p[1]), desc: clean(p[2]) };
          targetList(section, mon).push(entry);
          current = { entry, section };
        } else targetList(section, mon).push({ name: '(sin nombre)', desc: rest });
        REPORT.recovered.push(`${file}: entrada inicial recuperada tras cabecera ${sec[1]}`);
      }
      continue;
    }

    // --- fila de tabla de atributos
    if (/^\|/.test(t)) {
      if (/STR/i.test(t) || /^ \|[:\- ]/ .test(t) || /^\|[:\- |]+$/.test(t)) continue;
      const cells = t.split('|').map((c) => c.trim()).filter((c) => c !== '');
      if (cells.length === 6 && cells.every((c) => /^-?\d+\s*\(/.test(c) || /^-?\d+$/.test(c))) {
        const keys = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        mon.abilities = {};
        cells.forEach((c, i) => { mon.abilities[keys[i]] = parseInt(c.match(/^-?\d+/)[0], 10); });
      }
      continue;
    }

    // --- marcador triple ***Nombre.***  o doble **Nombre.**
    const tri = t.match(/^\*\*\*(.+?)\.\*\*\*\s*(.*)$/);
    const dbl = !tri ? t.match(/^\*\*([A-Z][^*]+?)\.\*\*\s*(.*)$/) : null;
    const marker = tri || dbl;
    if (marker) {
      pushCurrent();
      const entry = { name: clean(marker[1]), desc: '' };
      const rest = clean(marker[2]);
      if (rest) entry.desc = rest;
      targetList(section, mon).push(entry);
      current = { entry, section };
      continue;
    }

    // --- línea meta **Label** valor (solo en cabecera)
    const meta = t.match(/^\*\*([A-Za-z][A-Za-z ]+)\*\*\s*(.*)$/);
    if (meta && META_LABELS.has(meta[1])) {
      const label = meta[1]; const val = clean(meta[2]);
      switch (label) {
        case 'Armor Class': {
          const m2 = val.match(/^(\d+)\s*(?:\(([^)]+)\))?/);
          if (m2) { mon.armor_class.value = parseInt(m2[1], 10); mon.armor_class.note = m2[2] ? clean(m2[2]) : null; }
          break;
        }
        case 'Hit Points': {
          const m2 = val.match(/^(\d+)\s*\(([^)]+)\)/);
          if (m2) { mon.hit_points = parseInt(m2[1], 10); mon.hit_dice = clean(m2[2]).replace(/\u2212/g, '-'); }
          else mon.hit_points = parseInt(val, 10) || null;
          break;
        }
        case 'Speed': mon.speed = val; break;
        case 'Saving Throws':
          for (const part of val.split(',')) {
            const m2 = part.trim().match(/^(\w{3})\s*\+?\s*([-+\u2212]?\d+)/i);
            const key = m2 && SAVE_ABBR[m2[1].toLowerCase()];
            if (key) mon.saves[key] = parseInt(m2[2].replace(/\u2212/g, '-'), 10);
          }
          break;
        case 'Skills':
          for (const part of val.split(',')) {
            const m2 = part.trim().match(/^([A-Za-z ]+?)\s*\+?\s*([-+\u2212]?\d+)/);
            if (m2) mon.skills[clean(m2[1]).toLowerCase()] = parseInt(m2[2].replace(/\u2212/g, '-'), 10);
          }
          break;
        case 'Senses': mon.senses = val; break;
        case 'Languages': mon.languages = val; break;
        case 'Challenge': {
          const m2 = val.match(/^([\d/]+)\s*\(([\d,]+)\s*XP\)([\s\S]*)$/);
          if (m2) {
            mon.challenge_rating = m2[1];
            mon.experience_points = parseInt(m2[2].replace(/,/g, ''), 10);
            const leftover = clean(m2[3]);
            if (leftover) recoverGlued(leftover, 'traits', mon, file);
          } else {
            mon.challenge_rating = val.split(' ')[0] || null;
            REPORT.warnings.push(`${file}: Challenge no parseable: "${val.slice(0, 50)}"`);
          }
          break;
        }
        case 'Damage Vulnerabilities': mon.damage_vulnerabilities = splitList(val); break;
        case 'Damage Resistances': mon.damage_resistances = splitList(val); break;
        case 'Damage Immunities': mon.damage_immunities = splitList(val); break;
        case 'Condition Immunities':
        case 'Condition Resistances': mon.condition_immunities = splitList(val); break;
      }
      continue;
    }

    if (meta) { REPORT.unknownLabels.push(`${file}: etiqueta desconocida **${meta[1]}**`); continue; }

    // --- texto libre (cabecera → posible gluer; secciones → entrada/continuación)
    if (section === 'header') {
      // ruido residual: se ignora salvo que parezca entrada pegada
      continue;
    }
    // ¿nueva entrada sin marcador?  "Sting. Melee Weapon Attack..." / "Flyby. The owl..."
    const plain = t.match(/^([A-Z][\w'’()\/ -]{1,40}?)\.\s+([A-Z].*)$/);
    if (plain && !COMMON_STARTERS.has(plain[1].toLowerCase())) {
      pushCurrent();
      const entry = { name: clean(plain[1]), desc: clean(plain[2]) };
      targetList(section, mon).push(entry);
      current = { entry, section };
      continue;
    }
    if (current) current.entry.desc = clean(current.entry.desc + ' ' + t);
    else {
      // párrafo inicial sin entrada (p. ej. descripción de Legendary Actions)
      if (section === 'legendary' && !mon.legendary.description) mon.legendary.description = clean(t);
      else targetList(section, mon).push({ name: '(sin nombre)', desc: clean(t) });
    }
  }

  // fallback desde tags del front matter
  if (!mon.size) {
    const sz = tags.find((x) => /^(tiny|small|medium|large|huge|gargantuan)$/.test(x));
    if (sz) mon.size = sz[0].toUpperCase() + sz.slice(1).toLowerCase();
  }
  if (!mon.type) {
    const ty = tags.find((x) => !/^(tiny|small|medium|large|huge|gargantuan|cr)/.test(x));
    if (ty) mon.type = ty;
  }
  if (!mon.challenge_rating) {
    const cr = tags.find((x) => x.startsWith('cr'));
    if (cr) mon.challenge_rating = cr.slice(2);
  }
  if (mon.challenge_rating && mon.experience_points == null) mon.experience_points = xpForCr(mon.challenge_rating);

  mon._file = file;
  return mon;
}

function targetList(section, mon) {
  if (section === 'actions') return mon.actions;
  if (section === 'reactions') return mon.reactions;
  if (section === 'legendary') return mon.legendary.actions;
  return mon.traits;
}

// Recupera entradas de líneas pegadas (Challenge con texto continuo u otras gluer)
function recoverGlued(text, section, mon, file) {
  const res = glueSplit(text);
  if (!res) {
    if (text.replace(/[^A-Za-z]/g, '').length > 0) REPORT.recovered.push(`${file}: resto no recuperable "${text.slice(0, 40)}"`);
    return;
  }
  const list = targetList(section, mon);
  if (res.head) {
    if (list.length) list[list.length - 1].desc = clean(list[list.length - 1].desc + ' ' + res.head);
    else list.push({ name: '(sin nombre)', desc: res.head });
  }
  for (const e of res.entries) list.push(e);
  REPORT.recovered.push(`${file}: ${res.entries.length} entrada(s) recuperada(s) de línea pegada`);
}

// ------------------------------------------------------ B2: parser JSON SRD
const SKILL_KEYS = ['athletics', 'acrobatics', 'sleight_of_hand', 'stealth', 'arcana', 'investigation',
  'nature', 'religion', 'history', 'medicine', 'insight', 'perception', 'performance',
  'persuasion', 'intimidation', 'deception', 'survival'];
const SAVE_KEYS = { strength_save: 'strength', dexterity_save: 'dexterity', constitution_save: 'constitution',
  intelligence_save: 'intelligence', wisdom_save: 'wisdom', charisma_save: 'charisma' };

function parseB2(item) {
  const mon = {
    name: clean(item.name),
    size: item.size ? item.size[0].toUpperCase() + item.size.slice(1).toLowerCase() : null,
    type: item.type || null,
    subtype: item.subtype ? clean(item.subtype) : null,
    alignment: item.alignment || null,
    armor_class: { value: typeof item.armor_class === 'object' ? item.armor_class.value ?? null : item.armor_class ?? null, note: typeof item.armor_class === 'object' ? item.armor_class.note ?? null : null },
    hit_points: item.hit_points ?? null,
    hit_dice: item.hit_dice || null,
    speed: item.speed || null,
    abilities: { str: item.strength, dex: item.dexterity, con: item.constitution, int: item.intelligence, wis: item.wisdom, cha: item.charisma },
    saves: {}, skills: {},
    damage_vulnerabilities: splitList(item.damage_vulnerabilities),
    damage_resistances: splitList(item.damage_resistances),
    damage_immunities: splitList(item.damage_immunities),
    condition_immunities: splitList(item.condition_immunities),
    senses: item.senses || null,
    languages: item.languages || null,
    challenge_rating: item.challenge_rating != null ? crToString(item.challenge_rating) : null,
    experience_points: null,
    traits: (item.special_abilities || []).map((a) => ({ name: clean(a.name), desc: clean(a.desc) })),
    actions: (item.actions || []).map((a) => ({ name: clean(a.name), desc: clean(a.desc) })),
    reactions: (item.reactions || []).map((a) => ({ name: clean(a.name), desc: clean(a.desc) })),
    legendary: { description: null, actions: (item.legendary_actions || []).map((a) => ({ name: clean(a.name), desc: clean(a.desc) })) },
  };
  for (const [k, v] of Object.entries(item)) {
    if (SAVE_KEYS[k] && v != null) mon.saves[SAVE_KEYS[k]] = v;
    if (SKILL_KEYS.includes(k) && v != null) mon.skills[k] = v;
  }
  if (mon.challenge_rating) mon.experience_points = xpForCr(mon.challenge_rating);
  return mon;
}

// ------------------------------------------------------------------ fusión
function mergeMonsters(b1List, b2List) {
  const byKey = new Map();
  const dupesB1 = [];

  for (const m of b1List) {
    const k = normKey(m.name);
    if (!k) { REPORT.warnings.push(`B1 sin nombre: ${m._file}`); continue; }
    if (byKey.has(k)) { dupesB1.push(`${m.name} (${m._file} vs ${byKey.get(k)._file})`); Object.assign(byKey.get(k), mergeInto(byKey.get(k), m, 'b1-dup')); continue; }
    byKey.set(k, m);
    m.sources = ['beaurancourt/bestiary'];
  }
  if (dupesB1.length) REPORT.conflicts.push(`Duplicados internos en B1: ${dupesB1.join('; ')}`);

  let mergedCount = 0, b2Only = 0;
  const tokenSet = (n) => new Set(clean(n).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/).filter(Boolean));
  const isSubset = (a, b) => { for (const t of a) if (!b.has(t)) return false; return true; };

  for (const m of b2List) {
    const k = normKey(m.name);
    const existing = byKey.get(k);
    if (existing) {
      mergeInto(existing, m, 'b2');
      if (!existing.sources.includes('Libco/bestiary5thedition')) existing.sources.push('Libco/bestiary5thedition');
      mergedCount++;
      continue;
    }
    // coincidencia difusa: alias de nombre (p. ej. "Sphinxes Androsphinx" vs "Androsphinx",
    // "Gnome, Deep (Svirfneblin)" vs "Deep Gnome (Svirfneblin)").
    // Regla: los tokens de B2 deben estar contenidos en los de B1 (o ser iguales), nunca al revés.
    const bt = tokenSet(m.name);
    let cands = [...byKey.values()].filter((e) => {
      if (e.sources?.includes('Libco/bestiary5thedition')) return false;
      return isSubset(bt, tokenSet(e.name));
    });
    // desambiguación: si varios candidatos, elegir el que coincide en CA + PV + CR con B2
    if (cands.length > 1) {
      const scored = cands.filter((e) =>
        e.armor_class?.value === m.armor_class.value &&
        e.hit_points === m.hit_points &&
        String(e.challenge_rating) === String(m.challenge_rating));
      if (scored.length >= 1) cands = [scored[0]];
    }
    if (cands.length === 1) {
      const tgt = cands[0];
      const oldName = tgt.name;
      mergeInto(tgt, m, 'b2');
      tgt.sources.push('Libco/bestiary5thedition');
      if (normKey(oldName) !== normKey(m.name)) {
        tgt.name = m.name; // nombre canónico SRD de B2
        tgt.aliases = [...(tgt.aliases || []), oldName];
      }
      mergedCount++;
      REPORT.recovered.push(`alias: "${oldName}" (B1) fusionado con "${m.name}" (B2)`);
    } else if (cands.length > 1) {
      REPORT.conflicts.push(`B2 "${m.name}" no fusionado: candidatos ambiguos en B1 -> ${cands.map((c) => c.name).join(', ')} (revisar duplicado manualmente)`);
      m.sources = ['Libco/bestiary5thedition'];
      byKey.set(k, m);
      b2Only++;
    } else {
      m.sources = ['Libco/bestiary5thedition'];
      byKey.set(k, m);
      b2Only++;
    }
  }

  // conflictos de valores entre fuentes en monstruos compartidos
  for (const m of byKey.values()) {
    if (m._b2cmp) {
      const c = m._b2cmp;
      for (const f of ['hit_points', 'speed']) {
        if (c[f] != null && m[f] != null && String(c[f]) !== String(m[f])) {
          REPORT.conflicts.push(`${m.name}: ${f} B1="${m[f]}" vs B2="${c[f]}"`);
        }
      }
      if (c.armor_class != null && m.armor_class.value != null && c.armor_class !== m.armor_class.value) {
        REPORT.conflicts.push(`${m.name}: ac B1=${m.armor_class.value} vs B2=${c.armor_class}`);
      }
      delete m._b2cmp;
    }
  }

  return { list: [...byKey.values()], mergedCount, b2Only };
}

// Completa `target` con datos de `src` (B2) sin perder textos propios de B1
function mergeInto(target, src, kind) {
  if (kind === 'b2') target._b2cmp = {
    hit_points: src.hit_points, speed: src.speed, armor_class: src.armor_class.value,
  };
  // challenge_rating: ante conflicto se adopta B2 (JSON de SRD canónico, sin errores de copia)
  if (src.challenge_rating != null) {
    if (target.challenge_rating == null) target.challenge_rating = src.challenge_rating;
    else if (String(target.challenge_rating) !== String(src.challenge_rating)) {
      const via = kind === 'b2' ? 'B2' : 'B1-dup';
      REPORT.conflicts.push(`${target.name}: challenge_rating ${target.challenge_rating} -> adoptado ${via}=${src.challenge_rating}`);
      target.challenge_rating = src.challenge_rating;
      target.experience_points = xpForCr(src.challenge_rating) ?? target.experience_points;
    }
  }
  // campos escalares: rellena vacíos
  for (const f of ['size', 'type', 'subtype', 'alignment', 'hit_dice', 'speed', 'senses', 'languages',
    'experience_points', 'hit_points']) {
    if (target[f] == null || target[f] === '') target[f] = src[f];
  }
  if (target.armor_class.value == null && src.armor_class.value != null) {
    target.armor_class = { ...src.armor_class };
  }
  if (!target.abilities) target.abilities = src.abilities;
  else if (src.abilities) for (const k of Object.keys(src.abilities)) if (target.abilities[k] == null) target.abilities[k] = src.abilities[k];
  // saves/skills: unión; si difieren, gana B1 (más completo en SRD publicado) y se registra
  for (const bag of ['saves', 'skills']) {
    for (const [k, v] of Object.entries(src[bag] || {})) {
      if (target[bag][k] == null) target[bag][k] = v;
      else if (target[bag][k] !== v) REPORT.conflicts.push(`${target.name}: ${bag}.${k} B1=${target[bag][k]} vs B2=${v}`);
    }
  }
  for (const f of ['damage_vulnerabilities', 'damage_resistances', 'damage_immunities', 'condition_immunities']) {
    if ((!target[f] || target[f].length === 0) && src[f]?.length) target[f] = src[f];
  }
  // traits/actions/legendary: fuente estructurada B2 primaria, agrega solo lo de B1
  for (const f of ['traits', 'actions']) {
    target[f] = mergeEntries(src[f], target[f]);
  }
  if (src.legendary.actions.length) {
    target.legendary.actions = mergeEntries(src.legendary.actions, target.legendary.actions);
  }
  if (src.reactions?.length) target.reactions = mergeEntries(src.reactions, target.reactions || []);
  return target;
}

// primaria = lista 1 (B2, nombres limpios); secundaria = lista 2 (B1).
// Une por nombre; elimina duplicados exactos (mismo nombre Y misma descripción)
// — B2 trae algunas acciones repetidas idénticas — pero conserva variantes
// legítimas con el mismo nombre y distinta descripción (p. ej. Yuan-ti Malison).
function mergeEntries(primary, secondary) {
  const out = [];
  const have = new Set();
  for (const e of [...primary, ...secondary]) {
    const k = normKey(e.name) + '|' + normKey(e.desc);
    if (have.has(k)) continue;
    have.add(k);
    out.push(e);
  }
  return out;
}

// ------------------------------------------------- app: mapa a src/types Monster
const SIZE_ES = { Tiny: 'Diminuto', Small: 'Pequeño', Medium: 'Mediano', Large: 'Grande', Huge: 'Enorme', Gargantuan: 'Gigante' };
const TYPE_ES = { aberration: 'Aberración', beast: 'Bestia', celestial: 'Celestial', construct: 'Constructo', dragon: 'Dragón',
  elemental: 'Elemental', fey: 'Fey', fiend: 'Diablura', giant: 'Gigante', humanoid: 'Humanoide', monstrosity: 'Monstruosidad',
  ooze: 'Ooze', plant: 'Planta', undead: 'No-muerto', swarm: 'Enjambre', shapechanger: 'Cambiaformas' };
const ALIGN_ES = { 'lawful good': 'Legal Bueno', 'neutral good': 'Neutral Bueno', 'chaotic good': 'Caótico Bueno',
  'lawful neutral': 'Legal Neutral', neutral: 'Neutral', 'chaotic neutral': 'Caótico Neutral',
  'lawful evil': 'Legal Malvado', 'neutral evil': 'Neutral Malvado', 'chaotic evil': 'Caótico Malvado',
  unaligned: 'Unaligned', 'any alignment': 'Neutral', 'any': 'Neutral' };

function toAppMonster(m) {
  return {
    id: slugify(m.name),
    name: m.name,
    size: SIZE_ES[m.size] || m.size || 'Mediano',
    type: TYPE_ES[(m.type || '').toLowerCase()] || m.type || 'Desconocido',
    alignment: ALIGN_ES[(m.alignment || '').toLowerCase()] || m.alignment || 'Neutral',
    ac: m.armor_class.value ?? 10,
    hp_max: m.hit_points ?? 0,
    speed: m.speed || '30 ft.',
    stats: m.abilities || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    cr: m.challenge_rating ?? '0',
    actions: m.actions.map((a) => ({ name: a.name, desc: a.desc })),
    traits: m.traits.map((a) => ({ name: a.name, desc: a.desc })),
  };
}

// ------------------------------------------------------------ B3: hechizos SRD
const SPELL_SCHOOL_ES = { abjuration: 'Abjuración', conjuration: 'Conjuración', divination: 'Adivinación',
  enchantment: 'Encantamiento', evocation: 'Evocación', illusion: 'Ilusión', necromancy: 'Nigromancia',
  transmutation: 'Transmutación' };
const SPELL_CLASS_ES = { bard: 'Bardo', cleric: 'Clérigo', druid: 'Druida', paladin: 'Paladín',
  ranger: 'Explorador', sorcerer: 'Hechicero', warlock: 'Brujo', wizard: 'Mago' };

// Normaliza valores de tiempo/alcance/duración del SRD inglés a la etiqueta en español
// que espera la UI (coherente con los datos de ejemplo del proyecto).
function esTiming(v) {
  let s = clean(v);
  s = s.replace(/^Instantaneous$/i, 'Instantáneo')
    .replace(/^Until dispelled$/i, 'Hasta disiparse')
    .replace(/^Concentration, up to\s+/i, 'Concentración, hasta ')
    .replace(/^Concentration$/i, 'Concentración')
    .replace(/^1 bonus action$/i, '1 Acción adicional')
    .replace(/^1 action$/i, '1 Acción')
    .replace(/^1 reaction$/i, '1 Reacción')
    .replace(/^1 minute$/i, '1 minuto').replace(/^(\d+) minutes$/i, '$1 minutos')
    .replace(/^1 hour$/i, '1 hora').replace(/^(\d+) hours$/i, '$1 horas')
    .replace(/^1 day$/i, '1 día').replace(/^(\d+) days$/i, '$1 días')
    .replace(/^1 round$/i, '1 asalto');
  return s;
}
function esRange(v) {
  let s = clean(v);
  s = s.replace(/^Self$/i, 'Personal').replace(/^Touch$/i, 'Toque').replace(/^Sight$/i, 'Vista')
    .replace(/^Unlimited$/i, 'Ilimitado').replace(/^Special$/i, 'Especial')
    .replace(/(\d+)\s+feet/i, '$1 ft.').replace(/(\d+)\s+foot/i, '$1 ft.')
    .replace(/(\d+)\s+miles/i, '$1 millas').replace(/1\s+mile/i, '1 milla');
  return s;
}

function parseB3(raw) {
  const list = [];
  const seen = new Set();
  for (const s of raw) {
    if (!s?.name) { REPORT.warnings.push(`B3: hechizo sin nombre ignorado`); continue; }
    const key = normKey(s.name);
    if (seen.has(key)) { REPORT.warnings.push(`B3: duplicado "${s.name}" ignorado`); continue; }
    seen.add(key);
    const level = s.level === 'cantrip' ? 0 : parseInt(s.level, 10);
    if (!Number.isFinite(level)) { REPORT.warnings.push(`B3: nivel no parseable en "${s.name}"`); continue; }
    const components = typeof s.components === 'object'
      ? clean(s.components.raw)
      : clean(s.components);
    list.push({
      name: clean(s.name),
      level,
      school: clean(s.school).toLowerCase(),
      casting_time: clean(s.casting_time),
      range: clean(s.range),
      components,
      duration: clean(s.duration),
      ritual: Boolean(s.ritual),
      description: clean(s.description),
      classes: (Array.isArray(s.classes) ? s.classes : []).map((c) => clean(c).toLowerCase()).filter(Boolean),
    });
  }
  list.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'en'));
  return list;
}

// Mapea al tipo `Spell` de src/types (escuela/clases/tiempos en español).
function toAppSpell(s, usedIds) {
  let id = slugify(s.name) || 'spell';
  while (usedIds.has(id)) id += '-x';
  usedIds.add(id);
  const ritualTag = s.ritual ? ' (ritual)' : '';
  return {
    id,
    name: s.name,
    level: s.level,
    school: SPELL_SCHOOL_ES[s.school] || s.school,
    casting_time: esTiming(s.casting_time) + ritualTag,
    range: esRange(s.range),
    components: s.components,
    duration: esTiming(s.duration),
    description: s.description,
    classes: s.classes.map((c) => SPELL_CLASS_ES[c] || c),
  };
}

// --------------------------------------------------------------- ejecución
function main() {
  if (!fs.existsSync(SRC1)) { console.error(`No existe ${SRC1}. Clona beaurancourt/bestiary en .sources/bestiary1`); process.exit(1); }
  if (!fs.existsSync(SRC2)) { console.error(`No existe ${SRC2}. Clona Libco/bestiary5thedition en .sources/bestiary2`); process.exit(1); }
  if (!fs.existsSync(SRC3)) { console.error(`No existe ${SRC3}. Clona vorpalhex/srd_spells en .sources/spells1`); process.exit(1); }

  const files = fs.readdirSync(SRC1).filter((f) => f.endsWith('.markdown'));
  const b1List = files.map(parseB1);
  const b2raw = JSON.parse(fs.readFileSync(SRC2, 'utf8'));
  const b2Items = Array.isArray(b2raw) ? b2raw : Object.values(b2raw);
  const b2List = b2Items.filter((x) => x && x.name).map(parseB2);
  const b3raw = JSON.parse(fs.readFileSync(SRC3, 'utf8'));
  const spellList = parseB3(Array.isArray(b3raw) ? b3raw : Object.values(b3raw));

  const { list, mergedCount, b2Only } = mergeMonsters(b1List, b2List);
  list.sort((a, b) => a.name.localeCompare(b.name, 'en'));

  // saneo final
  for (const m of list) {
    delete m._file;
    // elimina entradas exactamente duplicadas dentro de cada lista
    for (const bag of ['traits', 'actions', 'reactions']) {
      if (!m[bag]) continue;
      const seen = new Set();
      m[bag] = m[bag].filter((e) => {
        const k = normKey(e.name) + '|' + normKey(e.desc);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
    if (m.legendary?.actions) {
      const seen = new Set();
      m.legendary.actions = m.legendary.actions.filter((e) => {
        const k = normKey(e.name) + '|' + normKey(e.desc);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
    for (const bag of ['saves', 'skills']) {
      for (const k of Object.keys(m[bag])) if (m[bag][k] == null) delete m[bag][k];
    }
    if (!m.legendary.actions.length && !m.legendary.description) delete m.legendary;
    else if (!m.legendary.actions.length) delete m.legendary.actions;
    if (!m.reactions.length) delete m.reactions;
    if (!m.armor_class.note) delete m.armor_class.note;
    if (!m.aliases?.length) delete m.aliases;
  }

  fs.mkdirSync(OUT, { recursive: true });
  const generatedAt = new Date().toISOString();

  const rich = {
    meta: {
      generated_at: generatedAt,
      system: 'D&D 5e (SRD)',
      monsters_count: list.length,
      sources: [
        { id: 'beaurancourt/bestiary', url: 'https://github.com/beaurancourt/bestiary',
          format: 'markdown+jekyll', monsters: b1List.length, role: 'texto rico: XP, notas de CA, dados de golpe, reacciones, leyendas' },
        { id: 'Libco/bestiary5thedition', url: 'https://github.com/Libco/bestiary5thedition',
          format: 'json (srd_5e.json)', monsters: b2List.length, role: 'estructura: salvaguardas/habilidades numéricas, listas de inmunidades, traits limpios' },
      ],
      spells: `${spellList.length} hechizos SRD desde vorpalhex/srd_spells (ver spells.json / spells.app.json)`,
      dedupe: `por nombre normalizado: ${b1List.length} (B1) + ${b2List.length} (B2) -> ${list.length} únicos (${mergedCount} fusionados, ${b2Only} solo en B2)`,
    },
    monsters: list,
  };
  fs.writeFileSync(path.join(OUT, 'monsters.json'), JSON.stringify(rich, null, 2) + '\n');

  fs.writeFileSync(path.join(OUT, 'monsters.app.json'),
    JSON.stringify(list.map(toAppMonster), null, 2) + '\n');

  const spells = {
    meta: {
      generated_at: generatedAt,
      system: 'D&D 5e (SRD)',
      spells_count: spellList.length,
      sources: [
        { id: 'vorpalhex/srd_spells', url: 'https://github.com/vorpalhex/srd_spells',
          format: 'json (spells.json)', spells: b3raw.length,
          role: 'grimorio SRD: nivel, escuela, componentes, ritual, clases' },
      ],
      note: 'Escuela y clases en inglés SRD en este fichero; la app usa spells.app.json (traducido a español).',
    },
    schema: { name: 'string', level: 'int (0 = truco)', school: 'string', casting_time: 'string',
      range: 'string', components: 'string (V/S/M)', duration: 'string', ritual: 'bool',
      description: 'string', classes: 'string[]' },
    spells: spellList,
  };
  fs.writeFileSync(path.join(OUT, 'spells.json'), JSON.stringify(spells, null, 2) + '\n');

  const usedSpellIds = new Set();
  fs.writeFileSync(path.join(OUT, 'spells.app.json'),
    JSON.stringify(spellList.map((s) => toAppSpell(s, usedSpellIds)), null, 2) + '\n');

  // informe Markdown
  const missing = (f) => list.filter((m) => m[f] == null || m[f] === '' || (Array.isArray(m[f]) && !m[f].length)).length;
  const bothCount = list.filter((m) => m.sources.length === 2).length;
  const md = [
    '# Compendio unificado D&D 5e — informe de generación', '',
    `- Generado: ${generatedAt}`,
    `- Monstruos totales: **${list.length}** (B1: ${b1List.length}, B2: ${b2List.length}; en ambos: ${bothCount}; solo B2: ${b2Only})`,
    `- Hechizos: **${spellList.length}** — SRD completo desde vorpalhex/srd_spells (0 trucos, ${spellList.filter((s) => s.level > 0).length} de nivel 1-9; ${spellList.filter((s) => s.ritual).length} rituales).`,
    '', '## Fuentes y formatos', '',
    '| Repo | Formato | Contenido |',
    '|---|---|---|',
    '| beaurancourt/bestiary | Markdown (Jekyll front matter) en `_posts/` | 383 fichas de monstruo |',
    '| Libco/bestiary5thedition | JSON (`assets/srd_5e.json`, 325 monstruos; `files/5e-SRD-Monsters.json` = duplicado + bloque de licencia) | SRD estructurado |',
    `| vorpalhex/srd_spells | JSON (\`spells.json\`, ${b3raw.length} hechizos) | Grimorio SRD (OGL 1.0a) |`,
    '', '## Calidad de datos (campos vacíos)', '',
    '| Campo | Vacíos |', '|---|---|',
    `| armor_class.value | ${list.filter((m) => m.armor_class?.value == null).length} |`,
    `| hit_points | ${missing('hit_points')} |`,
    `| challenge_rating | ${missing('challenge_rating')} |`,
    `| abilities | ${missing('abilities')} |`,
    `| alignment | ${missing('alignment')} |`,
    `| actions | ${missing('actions')} |`,
    '', '## Conflictos detectados entre fuentes', '',
    REPORT.conflicts.length ? REPORT.conflicts.map((c) => `- ${c}`).join('\n') : '- ninguno',
    '', '## Recuperaciones de líneas pegadas (B1)', '',
    REPORT.recovered.length ? REPORT.recovered.map((c) => `- ${c}`).join('\n') : '- ninguna',
    '', '## Etiquetas desconocidas en B1', '',
    REPORT.unknownLabels.length ? [...new Set(REPORT.unknownLabels)].map((c) => `- ${c}`).join('\n') : '- ninguna',
    '', '## Avisos', '',
    REPORT.warnings.length ? REPORT.warnings.map((c) => `- ${c}`).join('\n') : '- ninguno',
    '', '## Tabla resumen', '',
    '| Nombre | Tamaño | Tipo | Alineamiento | CA | PV | CR | Fuentes |',
    '|---|---|---|---|---|---|---|---|',
    ...list.map((m) => `| ${m.name} | ${m.size ?? '?'} | ${m.type ?? '?'}${m.subtype ? ` (${m.subtype})` : ''} | ${m.alignment ?? '?'} | ${m.armor_class.value ?? '?'} | ${m.hit_points ?? '?'} | ${m.challenge_rating ?? '?'} | ${m.sources.length === 2 ? 'B1+B2' : m.sources[0].includes('beaurancourt') ? 'B1' : 'B2'} |`),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'monsters.md'), md);

  console.log(`✔ ${list.length} monstruos unificados -> data/compendium/`);
  console.log(`✔ ${spellList.length} hechizos -> spells.json + spells.app.json`);
  console.log(`  B1=${b1List.length}  B2=${b2List.length}  fusionados=${mergedCount}  soloB2=${b2Only}`);
  console.log(`  conflictos=${REPORT.conflicts.length}  recuperaciones=${REPORT.recovered.length}  avisos=${REPORT.warnings.length}`);
}

main();
