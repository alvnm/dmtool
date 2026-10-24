/**
 * Exportar / importar la campaña completa en JSON.
 *
 * Sirve para respaldar la sesión o para moverla de un navegador a otro (o de
 * la tablet del DM al portátil) sin depender de Supabase. El archivo sólo
 * contiene datos de la campaña: nunca credenciales ni tokens.
 */
import {
  AuditLogEntry,
  Combatant,
  DMNote,
  InventoryItem,
  Monster,
  NPC,
  NoteCategory,
  NpcDisposition,
  PartyMember,
  Spell,
} from '@/types';

export const CAMPAIGN_FORMAT = 'dm-companion-campaign';
export const CAMPAIGN_VERSION = 1;

/** Claves de localStorage gestionadas por la app (sin prefijo). */
export const STORAGE_KEYS = {
  combatants: 'combatants',
  items: 'items',
  monsters: 'monsters',
  npcs: 'npcs',
  spells: 'spells',
  notes: 'notes',
  party: 'party',
  auditLog: 'audit-log',
  activeTab: 'active-tab',
  turnIndex: 'turn-index',
  round: 'round',
} as const;

export interface CampaignData {
  combatants: Combatant[];
  items: InventoryItem[];
  /** Bestiario completo (SRD + criaturas del DM); opcional en archivos viejos. */
  monsters?: Monster[];
  npcs: NPC[];
  /** Grimorio completo (SRD + hechizos del DM); opcional en archivos viejos. */
  spells?: Spell[];
  notes: DMNote[];
  /** Miembros del grupo (gestor de jugadores); puede no existir en archivos viejos. */
  party?: PartyMember[];
  auditLog?: AuditLogEntry[];
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

const ITEM_TYPES: InventoryItem['type'][] = ['Arma', 'Armadura', 'Poción', 'Pergamino', 'Anillo', 'Tesoro', 'General'];
const ITEM_RARITIES: InventoryItem['rarity'][] = ['Común', 'Poco Común', 'Raro', 'Muy Raro', 'Legendario', 'Artefacto'];
const NPC_DISP: NpcDisposition[] = ['Aliado', 'Amigable', 'Neutral', 'Hostil', 'Enemigo'];
const NOTE_CATS: NoteCategory[] = ['General', 'Lore', 'Misión', 'Sesión', 'Combate', 'NPCs'];

const sanitizeItem = (item: unknown): InventoryItem | null => {
  if (!isRecord(item) || typeof item.name !== 'string' || !item.name.trim()) return null;
  const itemType = (typeof item.type === 'string' && ITEM_TYPES.includes(item.type as InventoryItem['type']))
    ? (item.type as InventoryItem['type'])
    : 'General';
  const rarity = (typeof item.rarity === 'string' && ITEM_RARITIES.includes(item.rarity as InventoryItem['rarity']))
    ? (item.rarity as InventoryItem['rarity'])
    : 'Común';
  const valGp = typeof item.value_gp === 'number' && Number.isFinite(item.value_gp)
    ? item.value_gp
    : (typeof (item as Record<string, unknown>).valueGp === 'number' && Number.isFinite((item as Record<string, unknown>).valueGp)
        ? (item as Record<string, unknown>).valueGp as number
        : 0);

  return {
    id: typeof item.id === 'string' && item.id.trim() ? item.id : String(Date.now() + Math.random()),
    name: String(item.name).slice(0, 200),
    type: itemType,
    rarity,
    weight: typeof item.weight === 'number' && Number.isFinite(item.weight) ? item.weight : 0,
    value_gp: valGp,
    assigned_to: typeof item.assigned_to === 'string' ? item.assigned_to : 'Bolsa General',
    description: typeof item.description === 'string' ? item.description.slice(0, 5000) : '',
    quantity: typeof item.quantity === 'number' && Number.isFinite(item.quantity) ? Math.max(1, item.quantity) : 1,
    equipped: Boolean(item.equipped),
    attuned: Boolean(item.attuned),
    last_modified_by: typeof item.last_modified_by === 'string' ? item.last_modified_by.slice(0, 100) : undefined,
  };
};

const sanitizeCombatant = (c: unknown): Combatant | null => {
  if (!isRecord(c) || typeof c.name !== 'string' || !c.name.trim()) return null;
  const hpCurrent = typeof c.hp_current === 'number' && Number.isFinite(c.hp_current)
    ? c.hp_current
    : (typeof (c as Record<string, unknown>).hpCurrent === 'number' && Number.isFinite((c as Record<string, unknown>).hpCurrent)
        ? (c as Record<string, unknown>).hpCurrent as number
        : 10);
  const hpMax = typeof c.hp_max === 'number' && Number.isFinite(c.hp_max)
    ? Math.max(1, c.hp_max)
    : (typeof (c as Record<string, unknown>).hpMax === 'number' && Number.isFinite((c as Record<string, unknown>).hpMax)
        ? Math.max(1, (c as Record<string, unknown>).hpMax as number)
        : 10);
  const isPlayer = typeof c.is_player === 'boolean'
    ? c.is_player
    : Boolean((c as Record<string, unknown>).isPlayer);

  return {
    id: typeof c.id === 'string' && c.id.trim() ? c.id : String(Date.now() + Math.random()),
    name: String(c.name).slice(0, 200),
    initiative: typeof c.initiative === 'number' && Number.isFinite(c.initiative) ? c.initiative : 0,
    hp_current: hpCurrent,
    hp_max: hpMax,
    ac: typeof c.ac === 'number' && Number.isFinite(c.ac) ? c.ac : 10,
    is_player: isPlayer,
    conditions: Array.isArray(c.conditions) ? c.conditions.filter((cond): cond is string => typeof cond === 'string') : [],
    dex_mod: typeof c.dex_mod === 'number' && Number.isFinite(c.dex_mod) ? c.dex_mod : undefined,
  };
};

const sanitizeNPC = (npc: unknown): NPC | null => {
  if (!isRecord(npc) || typeof npc.name !== 'string' || !npc.name.trim()) return null;
  const disp = (typeof npc.disposition === 'string' && NPC_DISP.includes(npc.disposition as NpcDisposition))
    ? (npc.disposition as NpcDisposition)
    : 'Neutral';
  const secNotes = typeof npc.secret_notes === 'string'
    ? npc.secret_notes.slice(0, 5000)
    : (typeof (npc as Record<string, unknown>).secretNotes === 'string'
        ? String((npc as Record<string, unknown>).secretNotes).slice(0, 5000)
        : '');

  return {
    id: typeof npc.id === 'string' && npc.id.trim() ? npc.id : String(Date.now() + Math.random()),
    name: String(npc.name).slice(0, 200),
    race: typeof npc.race === 'string' ? npc.race : 'Desconocida',
    alignment: typeof npc.alignment === 'string' ? npc.alignment : 'Neutral',
    background: typeof npc.background === 'string' ? npc.background : '',
    personality: typeof npc.personality === 'string' ? npc.personality : '',
    disposition: disp,
    location: typeof npc.location === 'string' ? npc.location : '',
    secret_notes: secNotes,
  };
};

const sanitizeNote = (note: unknown): DMNote | null => {
  if (!isRecord(note) || typeof note.title !== 'string' || !note.title.trim()) return null;
  const cat = (typeof note.category === 'string' && NOTE_CATS.includes(note.category as NoteCategory))
    ? (note.category as NoteCategory)
    : 'General';
  const updated = typeof note.updated_at === 'string'
    ? note.updated_at
    : (typeof (note as Record<string, unknown>).updatedAt === 'string'
        ? String((note as Record<string, unknown>).updatedAt)
        : new Date().toISOString());

  return {
    id: typeof note.id === 'string' && note.id.trim() ? note.id : String(Date.now() + Math.random()),
    title: String(note.title).slice(0, 250),
    content: typeof note.content === 'string' ? note.content.slice(0, 20000) : '',
    category: cat,
    pinned: Boolean(note.pinned),
    updated_at: updated,
  };
};

/**
 * Valida un JSON importado y devuelve los datos de campaña sanitizados.
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

  const combatants = Array.isArray(data.combatants)
    ? data.combatants.map(sanitizeCombatant).filter((c): c is Combatant => c !== null)
    : [];
  const items = Array.isArray(data.items)
    ? data.items.map(sanitizeItem).filter((i): i is InventoryItem => i !== null)
    : [];
  const npcs = Array.isArray(data.npcs)
    ? data.npcs.map(sanitizeNPC).filter((n): n is NPC => n !== null)
    : [];
  const notes = Array.isArray(data.notes)
    ? data.notes.map(sanitizeNote).filter((n): n is DMNote => n !== null)
    : [];

  if (!combatants.length && !items.length && !npcs.length && !notes.length) {
    throw new Error('La campaña importada no contiene registros válidos.');
  }

  const auditLog = Array.isArray(data.auditLog)
    ? (data.auditLog.filter(isRecord).map(a => ({
        id: typeof a.id === 'string' ? a.id : String(Date.now() + Math.random()),
        timestamp: typeof a.timestamp === 'string' ? a.timestamp : new Date().toISOString(),
        author: typeof a.author === 'string' ? a.author.slice(0, 50) : 'DM',
        entityType: (typeof a.entityType === 'string' && ['item', 'combatant', 'party', 'note'].includes(a.entityType)) ? (a.entityType as AuditLogEntry['entityType']) : 'item',
        action: (typeof a.action === 'string' && ['create', 'update', 'delete', 'transfer'].includes(a.action)) ? (a.action as AuditLogEntry['action']) : 'update',
        summary: typeof a.summary === 'string' ? a.summary.slice(0, 500) : '',
      })) as AuditLogEntry[])
    : [];

  return {
    combatants,
    items,
    monsters: Array.isArray(data.monsters) ? (data.monsters as Monster[]) : [],
    npcs,
    spells: Array.isArray(data.spells) ? (data.spells as Spell[]) : [],
    notes,
    party: Array.isArray(data.party) ? (data.party as PartyMember[]) : [],
    auditLog,
    activeTab: typeof data.activeTab === 'string' ? data.activeTab : undefined,
    turnIndex: typeof data.turnIndex === 'number' && Number.isFinite(data.turnIndex) ? data.turnIndex : undefined,
    round: typeof data.round === 'number' && Number.isFinite(data.round) ? data.round : undefined,
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
