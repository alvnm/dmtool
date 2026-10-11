/**
 * Carga del compendio SRD (bestiario + grimorio) servido por /api/compendium.
 * El compendio es la base de datos local del modo demo: si la API no está
 * disponible (ficheros no generados, error de red), la app sigue con los
 * datos de ejemplo de mockData.
 */
import { Monster, Spell } from '@/types';

interface CompendiumResponse<T> {
  kind: string;
  count: number;
  data: T[];
}

async function fetchKind<T>(kind: 'monsters' | 'spells'): Promise<T[]> {
  const res = await fetch(`/api/compendium?kind=${kind}`, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`compendium ${kind}: HTTP ${res.status}`);
  const body = (await res.json()) as CompendiumResponse<T>;
  if (!Array.isArray(body.data)) throw new Error(`compendium ${kind}: respuesta inválida`);
  return body.data;
}

export function loadBestiary(): Promise<Monster[]> {
  return fetchKind<Monster>('monsters');
}

export function loadGrimoire(): Promise<Spell[]> {
  return fetchKind<Spell>('spells');
}

const normKey = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');

/**
 * Fusiona filas propias (Supabase) sobre una lista base (compendio) sin
 * duplicar: compara por id y, en segundo lugar, por nombre normalizado.
 * La base manda; lo que aporta la otra lista se añade al final.
 */
export function mergeById<T extends { id: string; name: string }>(base: T[], extra: T[]): T[] {
  const out = [...base];
  const ids = new Set(base.map((x) => x.id));
  const names = new Set(base.map((x) => normKey(x.name)));
  for (const row of extra) {
    const key = normKey(row.name);
    if (ids.has(row.id) || (key && names.has(key))) continue;
    ids.add(row.id);
    if (key) names.add(key);
    out.push(row);
  }
  return out;
}
