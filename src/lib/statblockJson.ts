/**
 * Export / import de fichas individuales en JSON (monstruos y NPCs).
 *
 * Formato propio y estable para compartir criaturas entre campañas:
 *   { "kind": "dm-companion/monster" | "dm-companion/npc", "version": 1, "data": {...} }
 * El importador también acepta el objeto suelto o un array de objetos, para
 * que funcione con ficheros escritos a mano.
 */
import { NPC, NPC_DISPOSITIONS, Monster, StatBlock } from '@/types';
import { isStatBlock, normalizeStatBlock } from '@/components/statblock/StatBlockFields';

export type CreatureKind = 'monster' | 'npc';

const KIND_PREFIX = 'dm-companion';

const slug = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'ficha';

/** Descarga un fichero JSON con nombre legible (navegador). */
export function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Retraso mínimo: Safari revoca antes de que empiece la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportMonster(monster: Monster): void {
  downloadJson(`${slug(monster.name)}-monstruo`, {
    kind: `${KIND_PREFIX}/monster`,
    version: 1,
    data: monster,
  });
}

export function exportNpc(npc: NPC): void {
  downloadJson(`${slug(npc.name)}-npc`, {
    kind: `${KIND_PREFIX}/npc`,
    version: 1,
    data: npc,
  });
}

export type ParsedCreature<T> = { ok: true; items: T[] } | { ok: false; error: string };

const asArray = (input: unknown): unknown[] =>
  Array.isArray(input) ? input : [input];

const unwrap = (entry: unknown): unknown => {
  if (entry && typeof entry === 'object' && 'data' in (entry as Record<string, unknown>)) {
    return (entry as Record<string, unknown>).data;
  }
  return entry;
};

const isMonsterShape = (v: Record<string, unknown>): boolean =>
  typeof v.name === 'string' && v.name.trim().length > 0 && isStatBlock(v);

const isNpcShape = (v: Record<string, unknown>): boolean =>
  typeof v.name === 'string' &&
  v.name.trim().length > 0 &&
  typeof v.race === 'string' &&
  (v.statblock === undefined || v.statblock === null || isStatBlock(v.statblock));

const toMonster = (raw: Record<string, unknown>): Monster => {
  const sb: StatBlock = normalizeStatBlock(raw);
  return {
    id: `mon-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: String(raw.name).trim(),
    size: typeof raw.size === 'string' ? raw.size : 'Mediano',
    type: typeof raw.type === 'string' ? raw.type : 'Humanoide',
    alignment: typeof raw.alignment === 'string' ? raw.alignment : 'Neutral',
    ac: sb.ac,
    hp_max: sb.hp_max,
    speed: sb.speed,
    stats: sb.stats,
    cr: sb.cr,
    traits: sb.traits,
    actions: sb.actions,
    legendary: sb.legendary,
    isCustom: true,
  };
};

const toNpc = (raw: Record<string, unknown>): NPC => ({
  id: `npc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: String(raw.name).trim(),
  race: typeof raw.race === 'string' ? raw.race : 'Humano',
  alignment: typeof raw.alignment === 'string' ? raw.alignment : 'Neutral',
  background: typeof raw.background === 'string' ? raw.background : '',
  personality: typeof raw.personality === 'string' ? raw.personality : '',
  disposition: NPC_DISPOSITIONS.includes(raw.disposition as NPC['disposition'])
    ? (raw.disposition as NPC['disposition'])
    : 'Neutral',
  location: typeof raw.location === 'string' ? raw.location : '',
  secret_notes: typeof raw.secret_notes === 'string' ? raw.secret_notes : '',
  statblock: raw.statblock ? normalizeStatBlock(raw.statblock) : undefined,
});

/** Parsea un fichero JSON con una o varias fichas del tipo indicado. */
export function parseCreatures<T extends CreatureKind>(
  text: string,
  kind: T
): ParsedCreature<T extends 'monster' ? Monster : NPC> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El archivo no es JSON válido.' };
  }

  const entries = asArray(parsed).map(unwrap).filter(Boolean);
  if (entries.length === 0) return { ok: false, error: 'El archivo no contiene fichas.' };

  const invalid = entries.find(entry => {
    const v = entry as Record<string, unknown>;
    if (typeof v !== 'object') return true;
    return kind === 'monster' ? !isMonsterShape(v) : !isNpcShape(v);
  });
  if (invalid !== undefined) {
    return {
      ok: false,
      error:
        kind === 'monster'
          ? 'Falta el nombre o los atributos (stats/CA/PV) de alguna criatura.'
          : 'Falta el nombre o la raza de algún NPC.',
    };
  }

  const items = entries.map(entry =>
    (kind === 'monster' ? toMonster : toNpc)(entry as Record<string, unknown>)
  );
  return { ok: true, items } as ParsedCreature<T extends 'monster' ? Monster : NPC>;
}

/** Lee un File del input[type=file] y devuelve su texto. */
export const readFileText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsText(file);
  });
