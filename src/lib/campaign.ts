/**
 * Exportar / importar la campaña completa en JSON.
 *
 * Sirve para respaldar la sesión o para moverla de un navegador a otro (o de
 * la tablet del DM al portátil) sin depender de Supabase. El archivo sólo
 * contiene datos de la campaña: nunca credenciales ni tokens.
 */
import { Combatant, DMNote, InventoryItem, NPC } from '@/types';

export const CAMPAIGN_FORMAT = 'dm-companion-campaign';
export const CAMPAIGN_VERSION = 1;

/** Claves de localStorage gestionadas por la app (sin prefijo). */
export const STORAGE_KEYS = {
  combatants: 'combatants',
  items: 'items',
  npcs: 'npcs',
  notes: 'notes',
  party: 'party',
  activeTab: 'active-tab',
  turnIndex: 'turn-index',
  round: 'round',
} as const;

export interface CampaignData {
  combatants: Combatant[];
  items: InventoryItem[];
  npcs: NPC[];
  notes: DMNote[];
  /** Miembros del grupo (gestor de jugadores); puede no existir en archivos viejos. */
  party?: unknown[];
  activeTab?: string;
  turnIndex?: number;
  round?: number;
}

export interface CampaignExport {
  format: typeof CAMPAIGN_FORMAT;
  version: number;
  exportedAt: string;
  app: 'DM Companion';
  data: CampaignData;
}

export function buildCampaign(data: CampaignData): CampaignExport {
  return {
    format: CAMPAIGN_FORMAT,
    version: CAMPAIGN_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'DM Companion',
    data,
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/**
 * Valida un JSON importado y devuelve los datos de campaña.
 * Lanza un Error con mensaje apto para el DM si el archivo no es válido.
 */
export function parseCampaign(raw: string): CampaignData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  if (!isRecord(parsed)) throw new Error('El archivo no tiene la estructura de una campaña.');
  if (parsed.format !== CAMPAIGN_FORMAT) {
    throw new Error('Este archivo no es una exportación de DM Companion.');
  }
  const data = parsed.data;
  if (!isRecord(data)) throw new Error('El archivo no contiene datos de campaña.');

  // Debe traer al menos inventario, iniciativa o NPCs con sentido.
  const combatants = asArray<Combatant>(data.combatants);
  const items = asArray<InventoryItem>(data.items);
  const npcs = asArray<NPC>(data.npcs);
  const notes = asArray<DMNote>(data.notes);
  if (!combatants.length && !items.length && !npcs.length && !notes.length) {
    throw new Error('La campaña importada está vacía.');
  }

  return {
    combatants,
    items,
    npcs,
    notes,
    party: asArray(data.party),
    activeTab: typeof data.activeTab === 'string' ? data.activeTab : undefined,
    turnIndex: typeof data.turnIndex === 'number' ? data.turnIndex : undefined,
    round: typeof data.round === 'number' ? data.round : undefined,
  };
}

/** Descarga la campaña como archivo .json en el dispositivo del DM. */
export function downloadCampaign(campaign: CampaignExport): void {
  const stamp = campaign.exportedAt.slice(0, 10);
  const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `campana-dm-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Safari/Chrome: liberar el object URL tras el clic.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
