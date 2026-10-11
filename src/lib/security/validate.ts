/**
 * Validación de entradas en el servidor (sin dependencias).
 * Todas las rutas de API validan antes de tocar la base de datos.
 */

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value);
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

/** Texto seguro: sin caracteres de control, longitud limitada. */
export function isText(value: unknown, { min = 0, max = 2000 }: { min?: number; max?: number } = {}): value is string {
  if (typeof value !== 'string') return false;
  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.length >= min && cleaned.length <= max;
}

export function isIntInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

export function isBool(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

/** Clasifica JSON como objeto plano (no array, no null). */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Elimina campos no permitidos. Es la defensa contra manipulación de campos:
 * el cliente no puede enviar id, campaign_id, dm_user_id, created_by, etc.
 */
export function pick<T extends Record<string, unknown>>(
  input: Record<string, unknown>,
  allowedKeys: readonly (keyof T)[]
): T {
  const out: Record<string, unknown> = {};
  for (const k of allowedKeys) {
    const key = String(k);
    if (Object.prototype.hasOwnProperty.call(input, key)) out[key] = input[key];
  }
  return out as T;
}

/** Resultado helper para responder 400 con la lista de errores. */
export function invalid(errors: string[]): ValidationResult<never> {
  return { ok: false, errors };
}
