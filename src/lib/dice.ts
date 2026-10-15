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
