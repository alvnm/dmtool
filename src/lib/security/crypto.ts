/**
 * Cifrado de campos sensibles en reposo (AES-256-GCM).
 *
 * Campos como `dm_notes.content` o `npcs.secret_notes` se guardan cifrados:
 * en la base de datos se ven como `enc:v1:...` (texto ilegible), y solo el
 * servidor con FIELD_ENCRYPTION_KEY puede descifrarlos.
 *
 * La clave vive SOLO en el servidor (sin prefijo NEXT_PUBLIC).
 */
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

const VERSION = 'v1';
const PREFIX = `enc:${VERSION}:`;
const IV_BYTES = 12; // GCM estándar
const TAG_BYTES = 16;
const DEV_SECRET = 'dm-companion-dev-only-insecure-key';

function toB64(buf: Buffer): string {
  return buf.toString('base64url');
}
function fromB64(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}

function loadMasterKey(): Buffer {
  const explicit = process.env.FIELD_ENCRYPTION_KEY?.trim();
  if (explicit) {
    const decoded = fromB64(explicit);
    // Aceptamos 32 bytes en base64url o una passphrase que derivamos con HKDF.
    return decoded.length === 32 ? decoded : Buffer.from(hkdfSync('sha256', explicit, 'dm-companion-field-encryption', '', 32));
  }
  const signing = process.env.SESSION_SIGNING_SECRET?.trim();
  if (signing) {
    return Buffer.from(hkdfSync('sha256', signing, 'dm-companion-field-encryption', '', 32));
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[seguridad] FIELD_ENCRYPTION_KEY (o SESSION_SIGNING_SECRET) es obligatoria en producción para cifrar campos sensibles.'
    );
  }
  // Solo desarrollo: clave derivada conocida para que la app arranque sin secretos.
  return Buffer.from(hkdfSync('sha256', DEV_SECRET, 'dm-companion-field-encryption', '', 32));
}

let cachedKey: Buffer | null = null;
function key(): Buffer {
  if (!cachedKey) cachedKey = loadMasterKey();
  return cachedKey;
}

/** Cifra texto plano. Devuelve `enc:v1:<iv>:<tag>:<datos>` (ilegible en BD). */
export function encryptField(plaintext: string): string {
  if (plaintext === null || plaintext === undefined) return plaintext;
  if (isEncrypted(plaintext)) return plaintext; // idempotente
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${toB64(iv)}:${toB64(tag)}:${toB64(data)}`;
}

/** Descifra un valor producido por encryptField. Lanza si está manipulado. */
export function decryptField(value: string): string {
  if (value === null || value === undefined) return value;
  if (!isEncrypted(value)) return value; // texto plano heredado
  const parts = value.slice(PREFIX.length).split(':');
  if (parts.length !== 3) throw new Error('[seguridad] Valor cifrado mal formado.');
  const [iv, tag, data] = parts.map(fromB64);
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
    throw new Error('[seguridad] Valor cifrado mal formado (IV/tag inválidos).');
  }
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

/** Cifra un valor JSON y lo serializa en el formato `enc:v1:...`. */
export function encryptJSON(value: unknown): string {
  return encryptField(JSON.stringify(value ?? null));
}

export function decryptJSON<T>(value: string): T | null {
  if (!value) return null;
  try {
    return JSON.parse(decryptField(value)) as T;
  } catch {
    return null;
  }
}
