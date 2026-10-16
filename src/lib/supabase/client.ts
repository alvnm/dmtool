import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { assertClientSafeKey } from './keys';
import { getRemoteConfig, hasRemoteConfig } from './remoteConfig';

const PLACEHOLDER_URL = 'https://placeholder-project.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-anon-key';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isPlaceholderUrl = !rawUrl || rawUrl === PLACEHOLDER_URL;
const isPlaceholderKey = !rawKey || rawKey === PLACEHOLDER_KEY;

/** ¿Las credenciales llegan por variables de entorno del servidor (.env.local)? */
export const isSupabaseConfigured = (): boolean => {
  if (isPlaceholderUrl || isPlaceholderKey) return false;
  // No configurar el cliente si alguien dejó una clave secreta en una
  // variable pública: mejor fallar en seco que filtrarla al navegador.
  try {
    assertClientSafeKey(rawKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return true;
  } catch {
    return false;
  }
};

/**
 * ¿Hay nube disponible por cualquier vía? (.env del servidor O credenciales
 * pegadas por el DM en el modal de ajustes de la interfaz).
 */
export const isCloudConfigured = (): boolean =>
  isSupabaseConfigured() || hasRemoteConfig();

function buildClient(url: string, key: string, storageKey: string): SupabaseClient {
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // evita fijar tokens en la URL (referrer leakage)
      storageKey,
    },
    global: {
      headers: { 'x-application-name': 'dm-companion' },
    },
  });
}

/** Cliente respaldado por variables de entorno (modo normal de despliegue). */
export const supabase: SupabaseClient = isSupabaseConfigured()
  ? buildClient(rawUrl, assertClientSafeKey(rawKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'), 'dm-companion-auth')
  : buildClient(PLACEHOLDER_URL, PLACEHOLDER_KEY, 'dm-companion-auth');

// Cliente creado con las credenciales guardadas desde el modal de ajustes.
let remoteClient: SupabaseClient | null = null;
let remoteClientKey = '';

/**
 * Cliente Supabase activo. Prioriza las variables de entorno del servidor y,
 * si no existen, las credenciales que el DM introdujo en la interfaz.
 */
export function getSupabase(): SupabaseClient {
  if (isSupabaseConfigured()) return supabase;

  const config = getRemoteConfig();
  if (!config) return supabase;

  const signature = `${config.url}|${config.anonKey}`;
  if (!remoteClient || remoteClientKey !== signature) {
    remoteClient = buildClient(config.url, config.anonKey, 'dm-companion-auth-remote');
    remoteClientKey = signature;
  }
  return remoteClient;
}
