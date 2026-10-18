/**
 * Utilidades de combate compartidas por el panel del DM y el rastreador de
 * iniciativa.
 *
 * Esta lógica vivía duplicada (con pequeñas diferencias) en MainApp e
 * InitiativeTracker: centralizarla garantiza que "llevar un monstruo al
 * combate" haga exactamente lo mismo venga del bestiario o del modal de
 * importación.
 */
import { Combatant, Monster, NPC } from '@/types';
import { rollD20 } from '@/lib/dice';

/** Modificador de habilidad de D&D 5e a partir de la puntuación. */
export const abilityMod = (score: number): number => Math.floor((score - 10) / 2);

/** Modificador con signo para mostrarlo: "+3", "-1". */
export const formatMod = (score: number): string => {
  const mod = abilityMod(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

/**
 * Id local único de la sesión. No es un UUID: las filas que llegan de la
 * nube conservan el UUID que generó Supabase.
 */
export const newLocalId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

/** Orden de la ronda: mayor iniciativa primero. */
export const sortCombatants = (list: Combatant[]): Combatant[] =>
  [...list].sort((a, b) => b.initiative - a.initiative);

/** Ficha del bestiario -> combatiente con iniciativa tirada (1d20 + mod. DEST). */
export function monsterToCombatant(monster: Monster): Combatant {
  const dex = abilityMod(monster.stats.dex);
  return {
    id: newLocalId('comb'),
    name: monster.name,
    initiative: rollD20(dex),
    hp_current: monster.hp_max,
    hp_max: monster.hp_max,
    ac: monster.ac,
    is_player: false,
    conditions: [],
    condition_rounds: {},
    dex_mod: dex,
  };
}

/** NPC -> combatiente (PV y CA por defecto razonables; el DM los ajusta). */
export function npcToCombatant(npc: NPC): Combatant {
  return {
    id: newLocalId('comb'),
    name: npc.name,
    initiative: rollD20(0),
    hp_current: 12,
    hp_max: 12,
    ac: 12,
    is_player: false,
    conditions: [],
    condition_rounds: {},
    dex_mod: 0,
  };
}
