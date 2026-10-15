/**
 * Generador de nombres aleatorios para improvisar NPCs, tiendas y localizaciones
 * cuando los jugadores se cruzan con alguien que el DM no tenía previsto.
 */
export type NameCategory =
  | 'Humano'
  | 'Elfo'
  | 'Enano'
  | 'Medio Orco'
  | 'Halfling'
  | 'Gnomo'
  | 'Tiefling'
  | 'Dragontón'
  | 'Taberna'
  | 'Comercio'
  | 'Pueblo';

export interface NamePool {
  category: NameCategory;
  label: string;
  hint: string;
  first: string[];
  last: string[];
  /** Si es true sólo se muestra un elemento (tabernas, pueblos...). */
  single: boolean;
}

export const NAME_POOLS: NamePool[] = [
  {
    category: 'Humano',
    label: 'Humano',
    hint: 'Guardias, mercaderes, nobles de ciudad',
    first: ['Aldric', 'Berta', 'Casmin', 'Dorotea', 'Edmundo', 'Fara', 'Godofredo', 'Helena', 'Ivo', 'Jorja', 'Lamberto', 'Marta', 'Nicasio', 'Olivia', 'Perpetua', 'Radu', 'Sabela', 'Tarquin', 'Urraca', 'Vito'],
    last: ['del Águila', 'Brazalete', 'Corredor de Pozos', 'Flor de Sal', 'Molino Alto', 'Pardo', 'Saeta', 'Vidal', 'de la Vega', 'Hierro', 'Salobre', 'Torre Baja'],
    single: false,
  },
  {
    category: 'Elfo',
    label: 'Elfo',
    hint: 'Errantes arcanos, guardianes del bosque',
    first: ['Aelar', 'Berwyn', 'Caelynn', 'Dior', 'Erevan', 'Faelar', 'Glyndwr', 'Holimion', 'Iliriel', 'Kaelis', 'Lirael', 'Mialee', 'Naivara', 'Quessir', 'Sylvariel', 'Thaumin', 'Vaella', 'Xiloscent'],
    last: ['Cantosombrío', 'de la Espina', 'Hoja Verdosa', 'Aliento Estelar', 'Mirada Clara', 'de Eranas', 'Vagamareas', 'Silvaluna', 'Ríoquiebre', 'Pétalo de Escarcha'],
    single: false,
  },
  {
    category: 'Enano',
    label: 'Enano',
    hint: 'Herreros, mineros, juramentados',
    first: ['Adrik', 'Beldra', 'Dagna', 'Eberk', 'Fendra', 'Gloin', 'Hjalmar', 'Issar', 'Kildra', 'Lif', 'Morgra', 'Nurbar', 'Orsik', 'Rurik', 'Sigrun', 'Thorfin', 'Vola', 'Yurgir'],
    last: ['Barbaforja', 'Mano Rígida', 'Piedragris', 'Yelmo Profundo', 'Cerveza Negra', 'Grieta', 'Martillo Rúnico', 'de la Montaña Hueso', 'Escudo Roto', 'Metalgruñido'],
    single: false,
  },
  {
    category: 'Medio Orco',
    label: 'Medio orco',
    hint: 'Mercenarios, gladiadores, saqueadores',
    first: ['Grommash', 'Grishnak', 'Yevelda', 'Mhurren', 'Ogrush', 'Bolgura', 'Sharga', 'Urzul', 'Krellok', 'Drezna', 'Mauk', 'Thokk'],
    last: ['Diente Roto', 'Sangre Fácil', 'Hacha Mansa', 'de las Ciénagas', 'Cuerno Negro', 'Mano de Piedra', 'El Grande', 'Piel de Rata'],
    single: false,
  },
  {
    category: 'Halfling',
    label: 'Halfling',
    hint: 'Posaderos, ladrones, mensajeros',
    first: ['Antal', 'Bree', 'Corrin', 'Dela', 'Eldon', 'Fenra', 'Garret', 'Halina', 'Ivo', 'Jenna', 'Kell', 'Lila', 'Milo', 'Nel', 'Ossian', 'Perrin'],
    last: ['Bolsosonrisas', 'Pie Ligero', 'de la Colina', 'Taza Llena', 'Camino Serena', 'Ojo de Lince', 'Mantequilla', 'Sombra Chiquita'],
    single: false,
  },
  {
    category: 'Gnomo',
    label: 'Gnomo',
    hint: 'Inventores, alquimistas, eruditos',
    first: ['Bimpnottin', 'Darrwyn', 'Ellovy', 'Fizwick', 'Glim', 'Habbakuk', 'Jenny', 'Nissa', 'Pog', 'Renwick', 'Sheevara', 'Tink', 'Zannifen'],
    last: ['Chispa', 'Engranaje', 'de la Bruma', 'Pergaminillo', 'Píldora', 'Tornillo Alegre', 'Sabihondo', 'Vaporcillo'],
    single: false,
  },
  {
    category: 'Tiefling',
    label: 'Tiefling',
    hint: 'Brujos, pactistas, exiliados urbanos',
    first: ['Akmenos', 'Buer', 'Damakos', 'Ekalleon', 'Fierana', 'Glosstria', 'Iapher', 'Kael', 'Lerosis', 'Morthos', 'Orianna', 'Rhys', 'Therai', 'Vesper'],
    last: ['de la Llama Serena', 'Ojo Ámbar', 'Susurro', 'del Octavo Sello', 'Alma en Pena', 'Colmillo de Azufre', 'Silente', 'Vena Oscura'],
    single: false,
  },
  {
    category: 'Dragontón',
    label: 'Dragontón',
    hint: 'Guerreros marciales, heraldos',
    first: ['Arjhan', 'Balaq', 'Clethtinthiallor', 'Daar', 'Evasterios', 'Fennumar', 'Ghaan', 'Harann', 'Issher', 'Kriv', 'Medrash', 'Nadarr', 'Porrax', 'Rhevandar', 'Sora', 'Tal'],
    last: ['Batchega', 'Draveshi', 'Hezacinn', 'Kepeshkmol', 'Myastan', 'Nasreldrom', 'Ophinshtalajiir', 'Rhogar', 'Soraevith', 'Yarjerit'],
    single: false,
  },
  {
    category: 'Taberna',
    label: 'Taberna',
    hint: 'Nombre del local para una parada improvisada',
    first: [],
    last: [
      'El Jabalí Tuerto', 'La Sirena Ebria', 'El Dragón Bostezón', 'La Llama Pérfida',
      'El Óculo Ciego', 'La Cuchara Rota', 'El Gato Negro', 'La Hidra Beoda',
      'El Cañaveral Dorado', 'La Aguja del Succubus', 'El Enano Mojado', 'La Última Antorcha',
      'El Cordero Desollado', 'La Soga Larga',
    ],
    single: true,
  },
  {
    category: 'Comercio',
    label: 'Comercio',
    hint: 'Tienda o gremio que aparece de golpe',
    first: [],
    last: [
      'Pociones de la Abuela Ossa', 'Herrería Martillogruñido', 'Reliquias Vagaluz',
      'El Gato que Ríe (usados)', 'Tintas y Pergaminos Solsticio', 'Armazón del Cuervo',
      'Frutas del Süden', 'El Yelmo Amarillento', 'Alquimia Menor', 'Ropas de Seda Pálida',
      'Mano Legal (préstamos)', 'Cofre y Cadena',
    ],
    single: true,
  },
  {
    category: 'Pueblo',
    label: 'Pueblo / Ciudad',
    hint: 'Asentamiento que los jugadores aún no conocen',
    first: [],
    last: [
      'Vado de Amur', 'Roca del Susurro', 'Aldea Pinargenta', 'Cruce de Yedras',
      'Torre de Sal', 'Puentelargo', 'El Pozo Sin Fondo', 'Valle Ceniza',
      'Ciudadela de Bronce', 'Molina de Nieve', 'Faro Roto', 'Sembrada de Hierro',
      'Ruina de Khem', 'Fuente Clara',
    ],
    single: true,
  },
];

/** Devuelve un nombre aleatorio coherente para la categoría pedida. */
export function randomName(category: NameCategory): string {
  const pool = NAME_POOLS.find(p => p.category === category) ?? NAME_POOLS[0];
  const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];
  if (pool.single || pool.first.length === 0) return pick(pool.last);
  const first = pick(pool.first);
  const last = pick(pool.last);
  return Math.random() < 0.4 ? first : `${first} ${last}`;
}
