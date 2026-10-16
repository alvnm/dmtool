/**
 * Generador instantáneo de NPCs para improvisar en plena sesión.
 *
 * Los jugadores hablan con alguien que el DM no tenía previsto: un clic da
 * nombre (coherente con la raza), actitud, oficio y un secreto que el DM puede
 * soltar más adelante para dar profundidad al encuentro.
 */
import { NPC } from '@/types';
import { randomName, type NameCategory } from '@/lib/names';

interface RaceOption {
  /** Categoría del pool de nombres que corresponde a la raza. */
  pool: Exclude<NameCategory, 'Taberna' | 'Comercio' | 'Pueblo'>;
  label: string;
}

const RACES: RaceOption[] = [
  { pool: 'Humano', label: 'Humano' },
  { pool: 'Elfo', label: 'Elfo' },
  { pool: 'Enano', label: 'Enano' },
  { pool: 'Medio Orco', label: 'Medio orco' },
  { pool: 'Halfling', label: 'Halfling' },
  { pool: 'Gnomo', label: 'Gnomo' },
  { pool: 'Tiefling', label: 'Tiefling' },
  { pool: 'Dragontón', label: 'Dragontón' },
];

const OCCUPATIONS = [
  'Posadero', 'Guardia de la ciudad', 'Mercader ambulante', 'Sanadora del pueblo',
  'Sacerdote del templo', 'Cartero', 'Herrera', 'Informador de la callejuela',
  'Veterano de guerra', 'Cazadora de recompensas', 'Copero de la nobleza', 'Minador',
  'Agricultor', 'Carromato de feria', 'Pícaro de taberna', 'Bibliotecario',
  'Guardabosques', 'Cocinera de campo', 'Mendigo educado', 'Artesano vidriero',
];

const PERSONALITIES = [
  'Habla demasiado y hace preguntas incómodas',
  'Susurra siempre como si tuviera un secreto (lo tiene)',
  'Nervioso: no deja de limpiarse las manos',
  'Optimista infatigable, nada le asusta',
  'Sospecha de todos los forasteros',
  'Cortés hasta la exasperación',
  'Cuenta chistes malos en los momentos peores',
  'De pocas palabras y mirada fija',
  'Tacaño con el dinero, generoso con los suyos',
  'Cree firmemente en las profecías y las cita a menudo',
];

const DISPOSITIONS: NPC['disposition'][] = ['Aliado', 'Amigable', 'Neutral', 'Hostil', 'Enemigo'];

const SECRETS = [
  'Debe 500 PO al gremio y se esconde de sus cobradores',
  'Vendió información del grupo a la facción rival la semana pasada',
  'Guarda una reliquia robada en el fondo de su tienda',
  'Trabaja para el villano de la campaña, sin saberlo del todo',
  'Es hermano/a de un NPC que los PJ ya conocen',
  'Tiene una deuda de juego con el gremio de ladrones',
  'Sabe dónde está la cueva, pero exige un pago (o un favor)',
  'Fingió su propia muerte para escapar de su pasado',
  'Contrabandeaba con la ciudad enemiga hasta hace un mes',
  'Descubrió un pasadizo bajo la ciudad y lo mantiene en secreto',
  'Cambia de lealtad según quién gane: neutralidad oportunista',
  'Posee un objeto mágico que ni siquiera sabe usar',
  'Es un espía de la corte disfrazado de campesino',
  'Prometió su primera ganancia al templo y aún no ha pagado',
];

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

export interface QuickNpc extends NPC {
  /** Oficio/rol, para que el DM se presente sin dudar. */
  job: string;
  /** Rasgo de personalidad (lo que hace memorable al NPC). */
  trait: string;
}

/** Genera un NPC completo y listo para improvisar (o para guardar en la lista). */
export function generateQuickNpc(): QuickNpc {
  const race = pick(RACES);
  const name = randomName(race.pool);
  return {
    id: `npc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    race: race.label,
    alignment: pick(['Neutral', 'Neutral Bueno', 'Caótico Neutral', 'Legal Neutral', 'Neutral Malvado']),
    background: pick(OCCUPATIONS),
    personality: pick(PERSONALITIES),
    disposition: pick(DISPOSITIONS),
    location: randomName('Taberna'),
    secret_notes: pick(SECRETS),
    job: pick(OCCUPATIONS),
    trait: pick(PERSONALITIES),
  };
}

/** Lista de razas disponibles (parafiltros o UI). */
export const NPC_RACES = RACES.map(r => r.label);
