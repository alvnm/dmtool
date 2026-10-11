import { createClient } from '@supabase/supabase-js';
import { assertClientSafeKey } from './keys';

const PLACEHOLDER_URL = 'https://placeholder-project.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-anon-key';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isPlaceholderUrl = !rawUrl || rawUrl === PLACEHOLDER_URL;
const isPlaceholderKey = !rawKey || rawKey === PLACEHOLDER_KEY;

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

function buildClient() {
  const url = isPlaceholderUrl ? PLACEHOLDER_URL : rawUrl;
  const key = isPlaceholderKey ? PLACEHOLDER_KEY : assertClientSafeKey(rawKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // evita fijar tokens en la URL (referrer leakage)
      storageKey: 'dm-companion-auth',
    },
    global: {
      headers: { 'x-application-name': 'dm-companion' },
    },
  });
}

export const supabase = buildClient();
