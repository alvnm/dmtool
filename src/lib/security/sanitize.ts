/**
 * Escape de contenido proporcionado por el usuario.
 *
 * React ya escapa en JSX; estas utilidades cubren los huecos donde el dato
 * viaja fuera de React (atributos, HTML generado, CLI/logs, exportaciones).
 */

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

/** Escapa para insertar texto en HTML de forma segura. */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"'`]/g, (c) => HTML_ESCAPES[c] ?? c);
}

/** Escapa para un atributo HTML con comillas dobles. */
export function escapeAttribute(value: unknown): string {
  return escapeHtml(value).replace(/[\n\r]/g, ' ');
}

/** Escapa para contexto JavaScript dentro de HTML (p. ej. data-*.json). */
export function escapeForJsString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/** Normaliza texto de usuario: quita controles, colapsa espacios, limita longitud. */
export function sanitizeText(value: unknown, max = 5000): string {
  if (typeof value !== 'string') return '';
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\s{3,}/g, '  ')
    .trim()
    .slice(0, max);
}
