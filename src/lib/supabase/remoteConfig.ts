/**
 * Credenciales de Supabase configurables desde la propia interfaz.
 *
 * Motivo: la app decide "modo local vs nube" con variables de entorno del
 * servidor, lo que obliga a tocar `.env.local` (o el panel de Vercel) para
 * probar la nube. Este módulo permite al DM pegar URL + clave pública en un
 * modal y sincronizar desde el navegador sin tocar ningún archivo.
 *
 * Reglas de seguridad:
 *  - SOLO se admite la clave pública (anon/publishable); `assertClientSafeKey`
 *    rechaza cualquier `service_role`/`sb_secret_` antes de guardarla.
 *  - La URL debe ser https (salvo localhost, para desarrollo).
 *  - Las credenciales viven en localStorage: son credenciales públicas por
 *    diseño de Supabase; la RLS del proyecto sigue siendo la que protege datos.
 */
import { readStorage, writeStorage, removeStorage } from '@/lib/usePersistentState';
import { isPublicKey } from './keys';

const STORAGE_KEY = 'supabase-config';

export interface RemoteSupabaseConfig {
  url: string;
  anonKey: string;
  /** Momento (ms) en que el DM guardó la configuración. */
  savedAt: number;
}

/** Lee la configuración guardada en el navegador (null si no hay). */
export function getRemoteConfig(): RemoteSupabaseConfig | null {
  if (typeof window === 'undefined') return null;
  const raw = readStorage<RemoteSupabaseConfig | null>(STORAGE_KEY, null);
  if (!raw || typeof raw.url !== 'string' || typeof raw.anonKey !== 'string') return null;
  if (!raw.url.trim() || !raw.anonKey.trim()) return null;
  return { url: raw.url.trim().replace(/\/+$/, ''), anonKey: raw.anonKey.trim(), savedAt: raw.savedAt ?? 0 };
}

export function hasRemoteConfig(): boolean {
  return getRemoteConfig() !== null;
}

export function saveRemoteConfig(url: string, anonKey: string): void {
  writeStorage(STORAGE_KEY, {
    url: url.trim().replace(/\/+$/, ''),
    anonKey: anonKey.trim(),
    savedAt: Date.now(),
  } satisfies RemoteSupabaseConfig);
}

export function clearRemoteConfig(): void {
  removeStorage(STORAGE_KEY);
}

/** Resultado de la comprobación de credenciales antes de guardarlas. */
export interface ConfigCheck {
  ok: boolean;
  error?: string;
}

function isPlausibleUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'https:') return true;
    // http sólo en local, para desarrollo con `supabase start`.
    return parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Valida la configuración sin guardarla: forma de la URL, clave pública y
 * que el proyecto responda (endpoint público de health del API).
 */
export async function checkRemoteConfig(url: string, anonKey: string): Promise<ConfigCheck> {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanKey = anonKey.trim();

  if (!isPlausibleUrl(cleanUrl)) {
    return { ok: false, error: 'La URL debe empezar por https:// (p. ej. https://TU-PROYECTO.supabase.co).' };
  }
  if (!isPublicKey(cleanKey)) {
    return {
      ok: false,
      error: 'Esa no es una clave pública. Usa la clave anon/publishable; NUNCA la service_role.',
    };
  }

  try {
    const res = await fetch(`${cleanUrl}/auth/v1/health`, {
      method: 'GET',
      headers: { apikey: cleanKey },
    });
    if (!res.ok) return { ok: false, error: `El proyecto respondió con HTTP ${res.status}. Revisa la URL y la clave.` };
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo contactar con el proyecto (red o URL incorrecta).' };
  }
}
