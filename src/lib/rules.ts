/**
 * Referencia rápida de reglas 5e para la pestaña "Reglas" del Toolbox.
 * Resúmenes propios (paráfrasis) de las reglas básicas: el DM consulta al
 * vuelo condiciones, acciones de combate, hechizos y descubrimientos.
 */

export type RuleCategory = 'Condiciones' | 'Combate' | 'Hechizos' | 'Descubrimientos';

export interface RuleEntry {
  id: string;
  category: RuleCategory;
  title: string;
  text: string;
}

export const RULE_CATEGORIES: RuleCategory[] = [
  'Condiciones',
  'Combate',
  'Hechizos',
  'Descubrimientos',
];

export const RULES: RuleEntry[] = [
  // ---- Condiciones ------------------------------------------------------
  { id: 'c-cegado', category: 'Condiciones', title: 'Cegado', text: 'No ve nada y falla las tiradas de Sabiduría (Percepción). Los atacantes tienen ventaja contra ti y tú desventaja contra ellos.' },
  { id: 'c-encantado', category: 'Condiciones', title: 'Encantado', text: 'No puedes atacar ni lanzar hechizos al encantador. El encantador tiene ventaja en las tiradas de Carisma (Engañar) contra ti.' },
  { id: 'c-ensordecido', category: 'Condiciones', title: 'Ensordecido', text: 'No oye y falla las tiradas de Sabiduría (Percepción) que dependan del oído.' },
  { id: 'c-asustado', category: 'Condiciones', title: 'Asustado', text: 'Desventaja en tiradas y ataques mientras vea a la fuente del miedo. No puede acercarse voluntariamente a ella; si queda sin línea de vista, debe intentar huir.' },
  { id: 'c-agarrado', category: 'Condiciones', title: 'Agarrado', text: 'Velocidad 0 y no se beneficia de bonificadores a la velocidad. El agarrador tiene ventaja en sus tiradas de ataque; desventaja en ataques a criaturas distintas del agarrador.' },
  { id: 'c-incapacitado', category: 'Condiciones', title: 'Incapacitado', text: 'No puede tomar acciones ni reacciones.' },
  { id: 'c-invisible', category: 'Condiciones', title: 'Invisible', text: 'Imposible de ver sin magia o sentidos especiales. Los ataques contra ti tienen ventaja; tus ataques, desventaja. Se localiza si hace ruido o deja rastros.' },
  { id: 'c-paralizado', category: 'Condiciones', title: 'Paralizado', text: 'Incapacitado y no puede moverse. Los atacantes tienen ventaja; los ataques cuerpo a cuerpo contra él aciertan automáticamente.' },
  { id: 'c-petrificado', category: 'Condiciones', title: 'Petrificado', text: 'Peso ×10, no puede moverse ni hablar, y los ataques contra él tienen ventaja. Se considera objeto inanimado.' },
  { id: 'c-envenenado', category: 'Condiciones', title: 'Envenenado', text: 'Desventaja en tiradas de ataque y de atributo.' },
  { id: 'c-derribado', category: 'Condiciones', title: 'Derribado', text: 'Sin velocidad, solo puede gatear. Los ataques cuerpo a cuerpo contra él tienen ventaja. Levantarse cuesta la mitad de la velocidad.' },
  { id: 'c-apresado', category: 'Condiciones', title: 'Apresado', text: 'Como Agarrado, además no puede nadar si el agarrador es más grande. Si el agarrador se mueve, quedas arrastrado a su espacio.' },
  { id: 'c-aturdido', category: 'Condiciones', title: 'Aturdido', text: 'Incapacitado, no puede moverse y sus tiradas de salvación de Fuerza fallan automáticamente.' },
  { id: 'c-inconsciente', category: 'Condiciones', title: 'Inconsciente', text: 'Incapacitado, sin movimiento ni habla. Tiradas de salvación de Fuerza fallidas automáticamente. Atacantes con ventaja; los golpes cuerpo a cuerpo aciertan automáticamente.' },
  { id: 'c-concentracion', category: 'Condiciones', title: 'Concentración', text: 'Mantiene un hechizo activo. Si recibe daño, tira Constitución (CD 10 o la mitad del daño, lo mayor). Solo puede concentrarse en un hechizo; al fallar, el hechizo termina.' },
  { id: 'c-agotado', category: 'Condiciones', title: 'Agotamiento', text: '6 niveles: desventaja creciente en tiradas de ataque (1-5) y velocidad reducida a la mitad por nivel (2-5). El nivel 6 es la muerte.' },

  // ---- Combate ----------------------------------------------------------
  { id: 'b-acciones', category: 'Combate', title: 'Acciones en tu turno', text: 'Cada turno puedes moverte y hacer una acción. Opciones de acción: Ataque, Castigar (ataque de oportunidad), Buscar, Usar objeto, Lanzar hechizo, Desplazarse a pelea, Ayudar o Esconderse.' },
  { id: 'b-movimiento', category: 'Combate', title: 'Movimiento', text: 'Puedes moverte antes, después o entre acciones. No necesitas terminar el turno junto a un enemigo: puedes acercarte, golpear y retirarte.' },
  { id: 'b-adicional', category: 'Combate', title: 'Acción adicional', text: 'Algunas habilidades (como Duelo o dos armas) otorgan una acción adicional: solo se usa para Atacar o Lanzar un hechizo de 1 acción como acción adicional (los hechizos dicen si pueden).' },
  { id: 'b-oportunidad', category: 'Combate', title: 'Ataque de oportunidad', text: 'Cuando un enemigo sale voluntariamente de tu alcance, puedes gastar tu reacción para un ataque cuerpo a cuerpo.' },
  { id: 'b-ayudar', category: 'Combate', title: 'Ayudar', text: 'Concedes ventaja a un aliado que esté a 5 pies de ti y que vaya a atacar al mismo objetivo antes de tu próximo turno.' },
  { id: 'b-buscar', category: 'Combate', title: 'Buscar', text: 'Dedicas tu acción a una percepción (ver/escuchar) o investigación (deducir) de dificultad normal.' },
  { id: 'b-esconderse', category: 'Combate', title: 'Esconderse', text: 'Sigilo (Destreza) contra Percepción pasiva de los observadores. Si tienes éxito, estás oculto; atacar o lanzar hechizo te revela.' },
  { id: 'b-usar-objeto', category: 'Combate', title: 'Usar objeto', text: 'Interactuar con un objeto (puerta, ballesta) es gratis una vez por turno; la segunda acción de objeto (cargar la ballesta) requiere esta acción.' },
  { id: 'b-iniciativa', category: 'Combate', title: 'Iniciativa', text: 'Al empezar el combate cada criatura tira una tirada de Destreza (Destreza en total, con Sigilo si está oculto). El orden de turnos va de mayor a menor; en un empate se decide a mano.' },
  { id: 'b-critico', category: 'Combate', title: 'Golpe crítico', text: 'Tirada de ataque natural 20 (o 19-20 con amenaza): dobla los dados de daño de la tirada (no el modificador).' },

  // ---- Hechizos ---------------------------------------------------------
  { id: 'h-concentracion', category: 'Hechizos', title: 'Concentración', text: 'Hechizos como Druida del Círculo o Hologramma exigen mantener la concentración: una sola a la vez, requiere acción si el lanzamiento es más largo, y se rompe con daño (salvación de Constitución) o incapacitación.' },
  { id: 'h-componentes', category: 'Hechizos', title: 'Componentes (V, S, M)', text: 'V = voz, S = gesto (mano libre), M = material (foco de hechizos cubre los materiales sin coste). Un hechizo con "M (coste)" consume ese objeto.' },
  { id: 'h-salvacion', category: 'Hechizos', title: 'Tirada de salvación', text: 'CD = 8 + competencia + atributo del lanzador (p. ej. Sabiduría para un clérigo). Éxito = mitad del efecto en la mayoría de los hechizos dañinos.' },
  { id: 'h-ritual', category: 'Hechizos', title: 'Hechizos rituales', text: 'Se lanzan sin gastar slot añadiendo 10 minutos, solo si el hechizo lo indica y lo tienes preparado (o en tu lista de pacto/arcano).' },
  { id: 'h-objetivo', category: 'Hechizos', title: 'Objetivos y líneas', text: 'Un efecto no atraviesa paredes opacas ni afecta a criaturas a las que no ves (salvo el texto diga lo contrario). No puedes lanzar sobre ti mismo si estás acostado o incónico.' },
  { id: 'h-nivel', category: 'Hechizos', title: 'Nivel de hechizo', text: 'Lanzar a nivel superior repite el efecto o aumenta números si el hechizo lo indica (p. ej. Bola de fuego +1d6 por nivel). Los cantrips escalan con nivel de personaje.' },

  // ---- Descubrimientos --------------------------------------------------
  { id: 'd-cobertura', category: 'Descubrimientos', title: 'Cobertura', text: 'Media: +2 a la CA y ventaja en Destreza (Salvar). Tres cuartos: +5 a la CA y ventaja. Total: no puedes atacarlo directamente.' },
  { id: 'd-percepcion', category: 'Descubrimientos', title: 'Percepción pasiva', text: '10 + modificador de Percepción. Se usa para notar algo sin buscar (detección de emboscadas, criaturas ocultas).' },
  { id: 'd-sigilo', category: 'Descubrimientos', title: 'Sigilo vs. percepción', text: 'Tira Destreza (Sigilo) contra la Percepción pasiva de cada espectador; con dos o más espectadores, usa la percepción más alta.' },
  { id: 'd-muerte', category: 'Descubrimientos', title: 'Tiradas de muerte', text: 'A 0 PV lanzas 1d20 sin modificador: 10+ = 1 estabilizado, 13+ = 1 PV, natural 20 = 1 PV y te levantas. 10 o menos = 2 fallos; 3 fallos = muerte, 3 éxitos = estable.' },
  { id: 'd-dano-masivo', category: 'Descubrimientos', title: 'Daño masivo', text: 'Si el daño en un solo golpe reduce a 0 PV y supera los PV máximos restantes, tira Constitución CD 15: en fallo mueres instantáneamente.' },
  { id: 'd-caida', category: 'Descubrimientos', title: 'Caída', text: '1d6 de daño contundente por cada 3 metros caídos, hasta 20d6; mitad con éxito en Destreza (Salvar) contra el impacto.' },
  { id: 'd-agotamiento-ambiente', category: 'Descubrimientos', title: 'Frío y calor extremos', text: 'Frío sin protección: 2d6 cada hora o constitución DC 5 (con éxitos acumulados). Calor sin agua: 2d6 cada hora con Constitución CD 5 acumulativos.' },
  { id: 'd-ocio', category: 'Descubrimientos', title: 'Descansos', text: 'Descanso corto (1 h): gasta dados de golpe para recuperar PV. Descanso largo (8 h): recupera todos los PV y la mitad de los dados de golpe, y renueva espacios de hechizo.' },
];

const norm = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Búsqueda sin acentos ni mayúsculas sobre título, texto y categoría. */
export function searchRules(query: string, category: RuleCategory | 'Todas'): RuleEntry[] {
  const q = norm(query.trim());
  return RULES.filter(rule => {
    const matchesCategory = category === 'Todas' || rule.category === category;
    if (!matchesCategory) return false;
    if (!q) return true;
    return norm(`${rule.title} ${rule.text} ${rule.category}`).includes(q);
  });
}
