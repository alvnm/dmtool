/**
 * Lanzador de dados: interpreta notación tipo "2d6+3" o "d20".
 * Devuelve cada tirada individual para poder mostrar el desglose al DM.
 */
export interface DiceRoll {
  notation: string;
  count: number;
  sides: number;
  modifier: number;
  rolls: number[];
  total: number;
}

const MAX_DICE = 100;
const MAX_SIDES = 1000;

export const DICE_NOTATION = /^(\d{0,3})d(\d{1,4})([+-]\d{1,4})?$/i;

export function parseNotation(notation: string): { count: number; sides: number; modifier: number } {
  const cleaned = notation.replace(/\s+/g, '').toLowerCase();
  const match = DICE_NOTATION.exec(cleaned);
  if (!match) {
    throw new Error('Usa una notación como 1d20, 2d6+3 o 4d8-1');
  }
  const count = Math.max(1, Math.min(Number(match[1] || '1'), MAX_DICE));
  const sides = Number(match[2]);
  const modifier = match[3] ? Number(match[3]) : 0;
  if (!Number.isFinite(sides) || sides < 2 || sides > MAX_SIDES) {
    throw new Error(`Los dados deben tener entre 2 y ${MAX_SIDES} caras`);
  }
  return { count, sides, modifier };
}

export function roll(notation: string): DiceRoll {
  const { count, sides, modifier } = parseNotation(notation);
  const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
  const total = rolls.reduce((sum, value) => sum + value, 0) + modifier;
  const normalized = `${count}d${sides}${modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`;
  return { notation: normalized, count, sides, modifier, rolls, total };
}

/** 1d20 + modificador, usado también por la iniciativa rápida del combate. */
export function rollD20(modifier = 0): number {
  return 1 + Math.floor(Math.random() * 20) + modifier;
}

export type RollMode = 'normal' | 'ventaja' | 'desventaja';

export interface AdvantageRoll {
  mode: RollMode;
  /** Notación mostrada al DM, p. ej. "1d20+5 (ventaja)". */
  notation: string;
  /** Las dos tiradas crudas de d20 (vacía en modo normal). */
  rolls: [number, number] | null;
  /** Tirada elegida (la mayor en ventaja, la menor en desventaja). */
  kept: number;
  modifier: number;
  total: number;
}

/**
 * Tira 1d20 con ventaja/desventaja (2d20 y nos quedamos con uno) + modificador.
 * Es el dado del 90% de las tiradas de un monstruo en combate, así que vive
 * aquí para poder reutilizarse desde la caja de dados y desde cualquier widget.
 */
export function rollD20WithMode(modifier = 0, mode: RollMode = 'normal'): AdvantageRoll {
  const first = 1 + Math.floor(Math.random() * 20);
  if (mode === 'normal') {
    return { mode, notation: notate(1, 20, modifier), rolls: null, kept: first, modifier, total: first + modifier };
  }
  const second = 1 + Math.floor(Math.random() * 20);
  const kept = mode === 'ventaja' ? Math.max(first, second) : Math.min(first, second);
  return {
    mode,
    notation: `${notate(1, 20, modifier)} (${mode})`,
    rolls: [first, second],
    kept,
    modifier,
    total: kept + modifier,
  };
}

function notate(count: number, sides: number, modifier: number): string {
  return `${count}d${sides}${modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`;
}
