/**
 * Tablas de tesoros y recompensas (basadas en las tablas de botín del DMG,
 * simplificadas para generar una recompensa creíble de un clic durante la sesión).
 */
export type TreasureTier = 1 | 2 | 3 | 4;

export interface TreasureLine {
  label: string;
  /** Valor aproximado en piezas de oro (0 para objetos mágicos). */
  gp: number;
  rarity?: 'Común' | 'Poco Común' | 'Raro' | 'Muy Raro' | 'Legendario';
}

export interface TreasureResult {
  tier: TreasureTier;
  title: string;
  lines: TreasureLine[];
  totalGp: number;
}

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

/** Moneda suelta por nivel de aventura. */
const COINS: Record<TreasureTier, { label: string; gp: number }[]> = {
  1: [
    { label: '5d6 x 10 piezas de cobre', gp: 3 },
    { label: '4d6 x 10 piezas de plata', gp: 20 },
    { label: '6d6 x 10 piezas de electrún', gp: 30 },
  ],
  2: [
    { label: '4d6 x 10 piezas de plata', gp: 20 },
    { label: '6d6 x 10 piezas de electrún', gp: 30 },
    { label: '5d6 x 10 piezas de oro', gp: 250 },
  ],
  3: [
    { label: '6d6 x 10 piezas de oro', gp: 300 },
    { label: '5d6 x 10 piezas de platino', gp: 750 },
    { label: '4d6 x 10 piezas de oro + 2d6 x 10 de platino', gp: 500 },
  ],
  4: [
    { label: '6d6 x 10 piezas de oro', gp: 300 },
    { label: '5d6 x 10 piezas de platino', gp: 750 },
    { label: '8d6 x 10 piezas de oro + 1d6 x 10 de platino', gp: 550 },
  ],
};

const GEMS: Record<TreasureTier, Array<{ name: string; gp: number }>> = {
  1: [
    { name: 'Aguamarina (50 PO)', gp: 50 },
    { name: 'Zafierno negro (50 PO)', gp: 50 },
    { name: 'Jaspe negro (50 PO)', gp: 50 },
    { name: 'Cornalina (50 PO)', gp: 50 },
    { name: 'Perla (100 PO)', gp: 100 },
    { name: 'Citrino (100 PO)', gp: 100 },
  ],
  2: [
    { name: 'Esmeralda (500 PO)', gp: 500 },
    { name: 'Zafierno azul (500 PO)', gp: 500 },
    { name: 'Rubí (500 PO)', gp: 500 },
    { name: 'Diamante blanco (500 PO)', gp: 500 },
    { name: 'Ojo de tigre (250 PO)', gp: 250 },
    { name: 'Safiro amarillo (250 PO)', gp: 250 },
  ],
  3: [
    { name: 'Diamante (1.000 PO)', gp: 1000 },
    { name: 'Esmeralda (1.000 PO)', gp: 1000 },
    { name: 'Rubí espinela (1.000 PO)', gp: 1000 },
    { name: 'Zafierno estrella (1.000 PO)', gp: 1000 },
    { name: 'Jade negro (1.000 PO)', gp: 1000 },
  ],
  4: [
    { name: 'Diamante (5.000 PO)', gp: 5000 },
    { name: 'Esmeralda (5.000 PO)', gp: 5000 },
    { name: 'Rubí (5.000 PO)', gp: 5000 },
    { name: 'Zafierno azul estrella (5.000 PO)', gp: 5000 },
    { name: 'Aguamarina imbuida (1.000 PO)', gp: 1000 },
  ],
};

const ART_OBJECTS: Record<TreasureTier, Array<{ name: string; gp: number }>> = {
  1: [
    { name: 'Perlas de plata (joyería menor)', gp: 25 },
    { name: 'Pequeña estatua de bronce de un héroe', gp: 35 },
    { name: 'Incensario de latón con grabados', gp: 40 },
    { name: 'Juego de dados de hueso tallado', gp: 30 },
  ],
  2: [
    { name: 'Anillo de oro con gema tallada', gp: 250 },
    { name: 'Cadena de plata con medalla votiva', gp: 300 },
    { name: 'Botella de cristal de Murano con licor raro', gp: 200 },
    { name: 'Cáliz de plata dorada con filigranas', gp: 350 },
  ],
  3: [
    { name: 'Pectoral de oro con esmeraldas', gp: 750 },
    { name: 'Estátera antigua de una ciudad hundida', gp: 900 },
    { name: 'Tapiz que narra una batalla olvidada', gp: 800 },
    { name: 'Sello de jade del linaje real', gp: 1000 },
  ],
  4: [
    { name: 'Corona de oro de un rey de la isla', gp: 5000 },
    { name: 'Trono tallado de marfil y ébano', gp: 6000 },
    { name: 'Máscara funeraria de un faraón oscuro', gp: 5500 },
    { name: 'Relicario de platino con una pluma de fénix', gp: 7500 },
  ],
};

/** Objeto mágico aleatorio por rareza (rango de rareza según nivel). */
const MAGIC_ITEMS: Record<TreasureTier, Array<{ name: string; rarity: TreasureLine['rarity'] }>> = {
  1: [
    { name: 'Poción de curación', rarity: 'Común' },
    { name: 'Poción de fuerza de oso', rarity: 'Poco Común' },
    { name: 'Daga +1', rarity: 'Poco Común' },
    { name: 'Armadura de cuero +1', rarity: 'Poco Común' },
    { name: 'Bolsa de devoradora', rarity: 'Poco Común' },
    { name: 'Amuleto de protección contra el mal', rarity: 'Poco Común' },
  ],
  2: [
    { name: 'Espada larga +1', rarity: 'Poco Común' },
    { name: 'Botas élficas', rarity: 'Poco Común' },
    { name: 'Capa del resguardado', rarity: 'Poco Común' },
    { name: 'Pociión de curación superior (x2)', rarity: 'Común' },
    { name: 'Anillo de protección +1', rarity: 'Raro' },
    { name: 'Báculo de adhesión', rarity: 'Raro' },
  ],
  3: [
    { name: 'Espada ancha +2', rarity: 'Raro' },
    { name: 'Armadura de cota de malla +1', rarity: 'Raro' },
    { name: 'Anillo de carga racial de fuerza', rarity: 'Raro' },
    { name: 'Alas de vuelo', rarity: 'Raro' },
    { name: 'Gafas de visión nocturna', rarity: 'Raro' },
    { name: 'Amuleto de los dados de la suerte', rarity: 'Raro' },
  ],
  4: [
    { name: 'Espada larga +3', rarity: 'Muy Raro' },
    { name: 'Armadura de placas +2', rarity: 'Muy Raro' },
    { name: 'Bastón de los archimagos', rarity: 'Legendario' },
    { name: 'Anillo de invulnerabilidad', rarity: 'Legendario' },
    { name: 'Pociión de longevidad', rarity: 'Raro' },
    { name: 'Tomo de comprensión de idiomas', rarity: 'Raro' },
  ],
};

const TIER_TITLES: Record<TreasureTier, string> = {
  1: 'Bote de aventureros nivel 1-4',
  2: 'Bote de aventureros nivel 5-10',
  3: 'Bote de aventureros nivel 11-16',
  4: 'Bote de aventureros nivel 17+',
};

/**
 * Genera una recompensa coherente con el nivel: monedas + 1-2 maravillas
 * (gemas/arte) + posibilidad de objeto mágico. `lucky` sube la suerte del botín.
 */
export function generateTreasure(tier: TreasureTier, lucky = false): TreasureResult {
  const lines: TreasureLine[] = [];

  // Monedas: 1-2 tiradas de la tabla del nivel.
  const coinRolls = lucky ? 2 : randInt(1, 2);
  for (let i = 0; i < coinRolls; i++) {
    const coin = pick(COINS[tier]);
    lines.push({ label: coin.label, gp: coin.gp });
  }

  // Maravillas: gemas u objetos de arte.
  const wonders = lucky ? 3 : randInt(1, 3);
  for (let i = 0; i < wonders; i++) {
    const useGem = Math.random() < 0.6;
    const item = useGem ? pick(GEMS[tier]) : pick(ART_OBJECTS[tier]);
    lines.push({ label: item.name, gp: item.gp });
  }

  // Objeto mágico: poco frecuente, salvo con suerte.
  const magicChance = lucky ? 0.9 : 0.35 + tier * 0.05;
  if (Math.random() < magicChance) {
    const item = pick(MAGIC_ITEMS[tier]);
    lines.push({ label: `✨ ${item.name}`, gp: 0, rarity: item.rarity ?? 'Común' });
  }

  return {
    tier,
    title: TIER_TITLES[tier],
    lines,
    totalGp: lines.reduce((sum, l) => sum + l.gp, 0),
  };
}
