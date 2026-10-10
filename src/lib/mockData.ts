import { Combatant, InventoryItem, Monster, NPC, Spell, DMNote } from '@/types';

export const INITIAL_COMBATANTS: Combatant[] = [
  {
    id: 'comb-1',
    name: 'Valerius (Guerrero)',
    initiative: 18,
    hp_current: 32,
    hp_max: 38,
    ac: 17,
    is_player: true,
    conditions: [],
    turn_order: 1,
  },
  {
    id: 'comb-2',
    name: 'Goblin Líder',
    initiative: 15,
    hp_current: 12,
    hp_max: 12,
    ac: 15,
    is_player: false,
    conditions: ['Envenenado'],
    turn_order: 2,
  },
  {
    id: 'comb-3',
    name: 'Lyra (Maga)',
    initiative: 12,
    hp_current: 20,
    hp_max: 20,
    ac: 13,
    is_player: true,
    conditions: [],
    turn_order: 3,
  },
  {
    id: 'comb-4',
    name: 'Goblin Arquero 1',
    initiative: 8,
    hp_current: 7,
    hp_max: 7,
    ac: 13,
    is_player: false,
    conditions: [],
    turn_order: 4,
  },
];

export const INITIAL_MONSTERS: Monster[] = [
  {
    id: 'mon-1',
    name: 'Goblin Escondido',
    size: 'Pequeño',
    type: 'Humanoide',
    alignment: 'Neutral Malvado',
    ac: 15,
    hp_max: 7,
    speed: '30 ft.',
    stats: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    cr: '1/4',
    traits: [
      { name: 'Escape Escurridizo', desc: 'Puede Destrabar o Esconderse como acción adicional.' }
    ],
    actions: [
      { name: 'Cimitarra', desc: '+4 al ataque, alcance 5 ft. Daño: 5 (1d6 + 2) cortante.' },
      { name: 'Arco Corto', desc: '+4 al ataque, alcance 80/320 ft. Daño: 5 (1d6 + 2) perforante.' }
    ]
  },
  {
    id: 'mon-2',
    name: 'Dragón Rojo Joven',
    size: 'Grande',
    type: 'Dragón',
    alignment: 'Caótico Malvado',
    ac: 18,
    hp_max: 178,
    speed: '40 ft., volar 80 ft.',
    stats: { str: 23, dex: 10, con: 21, int: 14, wis: 11, cha: 19 },
    cr: '10',
    traits: [
      { name: 'Vista Ciega', desc: 'Percepción a ciegas 30 ft. y visión en oscuridad 120 ft.' }
    ],
    actions: [
      { name: 'Multiataque', desc: 'Realiza 3 ataques: 1 mordedura y 2 garras.' },
      { name: 'Aliento de Fuego (Recarga 5-6)', desc: 'Cono de 30 ft. Salvación Des DC 17 o 56 (16d6) daño de fuego.' }
    ]
  },
  {
    id: 'mon-3',
    name: 'Ogro Terrible',
    size: 'Grande',
    type: 'Gigante',
    alignment: 'Caótico Malvado',
    ac: 11,
    hp_max: 59,
    speed: '40 ft.',
    stats: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7 },
    cr: '2',
    traits: [],
    actions: [
      { name: 'Garrote Grande', desc: '+6 al ataque, alcance 5 ft. Daño: 13 (2d8 + 4) contundente.' }
    ]
  }
];

export const INITIAL_SPELLS: Spell[] = [
  {
    id: 'sp-1',
    name: 'Bola de Fuego (Fireball)',
    level: 3,
    school: 'Evocación',
    casting_time: '1 Acción',
    range: '150 ft.',
    components: 'V, S, M (una bola de guano y azufre)',
    duration: 'Instantáneo',
    description: 'Una brillante centella brota de tu dedo. Explota en una esfera de fuego de 20 pies de radio. Cada criatura sufre 8d6 de daño de fuego (salvación de Destreza a la mitad).',
    classes: ['Mago', 'Hechicero']
  },
  {
    id: 'sp-2',
    name: 'Curar Heridas (Cure Wounds)',
    level: 1,
    school: 'Evocación',
    casting_time: '1 Acción',
    range: 'Toque',
    components: 'V, S',
    duration: 'Instantáneo',
    description: 'Una criatura que toques recupera 1d8 + modificador de habilidad de conjuros.',
    classes: ['Clérigo', 'Bardo', 'Paladín', 'Explorador', 'Druida']
  },
  {
    id: 'sp-3',
    name: 'Escudo Mágico (Shield)',
    level: 1,
    school: 'Abjuración',
    casting_time: '1 Reacción',
    range: 'Personal',
    components: 'V, S',
    duration: '1 Asalto',
    description: 'Obtienes un bonificador de +5 a la AC hasta el comienzo de tu siguiente turno, incluyendo contra el ataque provocador.',
    classes: ['Mago', 'Hechicero']
  }
];

export const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: 'item-1',
    name: 'Poción de Curación',
    type: 'Poción',
    rarity: 'Común',
    weight: 0.5,
    value_gp: 50,
    assigned_to: 'Bolsa General',
    description: 'Un líquido rojo brillante con olor a canela. Restaura 2d4+2 HP.'
  },
  {
    id: 'item-2',
    name: 'Espada Larga +1',
    type: 'Arma',
    rarity: 'Poco Común',
    weight: 3,
    value_gp: 500,
    assigned_to: 'Valerius',
    description: 'Una hoja de acero mithril forjada por enanos con runas grabadas. +1 al ataque y daño.'
  },
  {
    id: 'item-3',
    name: 'Anillo de Protección',
    type: 'Anillo',
    rarity: 'Raro',
    weight: 0.1,
    value_gp: 1500,
    assigned_to: 'Lyra',
    description: 'Otorga +1 a la AC y a todas las tiradas de salvación mientras se lleve equipado.'
  }
];

export const INITIAL_NPCS: NPC[] = [
  {
    id: 'npc-1',
    name: 'Eladrin Vaelen',
    race: 'Alto Elfo',
    alignment: 'Neutral Bueno',
    background: 'Erudito Real',
    personality: 'Habla pausado, fascinado por las ruinas arcanas.',
    disposition: 'Aliado',
    location: 'Biblioteca de Neverwinter',
    secret_notes: 'Escondió la llave de la cripta en el tomo de historia antigua. Ayudará si entregan la gema dorada.'
  },
  {
    id: 'npc-2',
    name: 'Grommash Diente roto',
    race: 'Medio Orco',
    alignment: 'Caótico Neutral',
    background: 'Mercenario',
    personality: 'Bruto pero directo con sus compromisos.',
    disposition: 'Neutral',
    location: 'Taverna del Jabalí Tuerto',
    secret_notes: 'Guarda rencor al alcalde de la ciudad por un contrato impago.'
  }
];

export const INITIAL_NOTES: DMNote[] = [
  {
    id: 'note-1',
    title: 'Resumen Sesión Anterior',
    content: 'La party atravesó el bosque sombrío y derrotó a la emboscada goblin. Descubrieron una carta sellada que menciona al Dragón Rojo Joven en el pico del volcán.',
    category: 'Sesión',
    pinned: true
  },
  {
    id: 'note-2',
    title: 'Rumores del Mercado',
    content: '1. El mercader de pociones busca raíz de mandrágora.\n2. Se avistaron esqueletos cerca de las criptas del sur.',
    category: 'Lore',
    pinned: false
  }
];
