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
  created_at?: string;
}

export interface NPC {
  id: string;
  name: string;
  race: string;
  alignment: string;
  background?: string;
  personality?: string;
  disposition: 'Aliado' | 'Amigable' | 'Neutral' | 'Hostil' | 'Enemigo';
  location?: string;
  secret_notes?: string;
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

export interface DMNote {
  id: string;
  title: string;
  content: string;
  category: 'General' | 'Lore' | 'Misión' | 'Sesión';
  pinned: boolean;
  updated_at?: string;
}
