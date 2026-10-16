/**
 * Condiciones de combate de D&D 5e compartidas por el rastreador del DM y la
 * vista de jugadores: el mismo icono y el mismo nombre en ambas pantallas.
 */
export const AVAILABLE_CONDITIONS = [
  'Cegado', 'Encantado', 'Ensordecido', 'Asustado',
  'Agarrado', 'Incapacitado', 'Invisible', 'Paralizado',
  'Petrificado', 'Envenenado', 'Derribado', 'Apresado',
  'Aturdido', 'Inconsciente', 'Concentración', 'Agotado',
];

/** Icono rápido por condición para leer el estado de un vistazo. */
export const CONDITION_ICONS: Record<string, string> = {
  Envenenado: '☠️',
  Cegado: '🙈',
  Ciego: '🙈',
  Paralizado: '⛓️',
  Concentración: '🎯',
  Agotado: '😩',
  Invisible: '👻',
  Aturdido: '💫',
  Inconsciente: '💤',
  Asustado: '😨',
  Agarrado: '🪢',
  Incapacitado: '🚫',
  Encantado: '💘',
  Ensordecido: '🙉',
  Petrificado: '🗿',
  Derribado: '🩸',
  Apresado: '🔒',
};
