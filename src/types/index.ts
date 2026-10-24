export type Alignment = 
  | 'Legal Bueno' | 'Neutral Bueno' | 'Caótico Bueno'
  | 'Legal Neutral' | 'Neutral' | 'Caótico Neutral'
  | 'Legal Malvado' | 'Neutral Malvado' | 'Caótico Malvado'
  | 'Unaligned';

export interface MonsterStats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface MonsterTraitAction {
  name: string;
  desc: string;
}

/**
 * Bloque de estadísticas 5e reutilizado por el creador de monstruos y por el
 * NPC con bloque de combate opcional (mismos campos, misma UI, misma ficha).
 */
export interface StatBlock {
  stats: MonsterStats;
  ac: number;
  hp_max: number;
  speed: string;
  cr: string;
  traits: MonsterTraitAction[];
  actions: MonsterTraitAction[];
  legendary: MonsterTraitAction[];
}

export interface Monster {
  id: string;
  name: string;
  size: string;
  type: string;
  alignment: string;
  ac: number;
  hp_max: number;
  speed: string;
  stats: MonsterStats;
  cr: string;
  actions: MonsterTraitAction[];
  traits: MonsterTraitAction[];
  /** Acciones legendarias (opcional: solo criaturas con acceso legendary). */
  legendary?: MonsterTraitAction[];
  isCustom?: boolean;
  created_at?: string;
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  classes: string[];
  isCustom?: boolean;
  created_at?: string;
}

export type NpcDisposition = 'Aliado' | 'Amigable' | 'Neutral' | 'Hostil' | 'Enemigo';

/** Valores válidos de disposición, en el orden en que se muestran en la UI. */
export const NPC_DISPOSITIONS = ['Aliado', 'Amigable', 'Neutral', 'Hostil', 'Enemigo'] as const;

export interface NPC {
  id: string;
  name: string;
  race: string;
  alignment: string;
  background?: string;
  personality?: string;
  disposition: NpcDisposition;
  location?: string;
  secret_notes?: string;
  /** Bloque de combate opcional: presente solo si el DM lo configura. */
  statblock?: StatBlock;
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'Arma' | 'Armadura' | 'Poción' | 'Pergamino' | 'Anillo' | 'Tesoro' | 'General';
  rarity: 'Común' | 'Poco Común' | 'Raro' | 'Muy Raro' | 'Legendario' | 'Artefacto';
  weight: number;
  value_gp: number;
  assigned_to: string;
  description: string;
  created_at?: string;
}

export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  hp_current: number;
  hp_max: number;
  /** Puntos de golpe temporales según las reglas de D&D 5e */
  hp_temp?: number;
  ac: number;
  is_player: boolean;
  conditions: string[];
  /**
   * Rondas restantes de cada condición. `null` = hasta que se salve;
   * la clave puede no existir (se trata como temporal indefinido).
   */
  condition_rounds?: Record<string, number | null>;
  /** Modificador de DEST usado por el botón "Lanzar Iniciativa". */
  dex_mod?: number;
  turn_order?: number;
  created_at?: string;
}

export type NoteCategory = 'General' | 'Lore' | 'Misión' | 'Sesión' | 'Combate' | 'NPCs';

/** Ficha resumen de un personaje jugador (gestor de grupo). */
export interface PartyMember {
  id: string;
  name: string;
  className: string;
  level: number;
  ac: number;
  maxHp: number;
  /** Modificador de Sabiduría usado para la percepción pasiva. */
  wisMod: number;
  /** Percepción pasiva a mano; si no, se calcula como 10 + mod. Sabiduría. */
  passivePerception?: number | null;
  /** Iniciativa reportada por el jugador. */
  initiative: number;
  notes?: string;
}

export interface DMNote {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  pinned: boolean;
  campaign_id?: string;
  updated_at?: string;
}
