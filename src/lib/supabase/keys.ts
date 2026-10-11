/**
 * Guardas de claves: ninguna clave secreta de Supabase puede salir en el bundle
 * del navegador ni usarse fuera del servidor.
 *
 * Reglas:
 *  - En el cliente SOLO se permite la clave pública `anon` (JWT con role="anon"
 *    o clave "publishable" con prefijo sb_publishable_).
 *  - Las claves `service_role` / `sb_secret_` NUNCA se exponen al cliente.
 */

const SECRET_KEY_PREFIXES = ['sb_secret_'];
const PUBLISHABLE_KEY_PREFIX = 'sb_publishable_';

export class SecretKeyExposureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecretKeyExposureError';
  }
}

type JwtLike = { role?: unknown; iss?: unknown };

function decodeJwtPayload(token: string): JwtLike | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeBase64Utf8(base64);
    if (json === null) return null;
    return JSON.parse(json) as JwtLike;
  } catch {
    return null;
  }
}

/** Decodificación isomórfica de Base64 -> UTF-8 (navegador y Node). */
function decodeBase64Utf8(base64: string): string | null {
  if (typeof atob === 'function' && typeof TextDecoder === 'function') {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  const nodeBuffer = (globalThis as {
    Buffer?: { from(d: string, e: string): { toString(enc: string): string } };
  }).Buffer;
  return nodeBuffer ? nodeBuffer.from(base64, 'base64').toString('utf8') : null;
}

/** Devuelve true si la clave es exclusivamente segura para el navegador. */
export function isPublicKey(key: string): boolean {
  const value = key.trim();
  if (!value) return false;
  if (SECRET_KEY_PREFIXES.some((p) => value.startsWith(p))) return false;
  if (value.startsWith(PUBLISHABLE_KEY_PREFIX)) return true;
  const payload = decodeJwtPayload(value);
  if (!payload) return false;
  return payload.role === 'anon';
}

/**
 * Lanza si `key` no es una clave pública. Se ejecuta en el cliente para
 * impedir que una clave service_role se filtre accidentalmente al navegador.
 */
export function assertClientSafeKey(key: string, label = 'clave'): string {
  if (!isPublicKey(key)) {
    throw new SecretKeyExposureError(
      `[seguridad] La ${label} configurada no es una clave pública (anon/publishable). ` +
        'Usa NEXT_PUBLIC_SUPABASE_ANON_KEY para el navegador y guarda la service_role ' +
        'solo en variables SIN prefijo NEXT_PUBLIC y solo en el servidor.'
    );
  }
  return key;
}
