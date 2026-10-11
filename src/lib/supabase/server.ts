/**
 * Cliente Supabase para el servidor (Route Handlers / Server Components /
 * Middleware) con cookies de sesión endurecidas:
 *   httpOnly + secure + sameSite=lax + path=/
 * El almacenamiento de la sesión vive SOLO en cookies httpOnly firmadas por
 * el navegador; nunca en localStorage.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { assertClientSafeKey } from './keys';

const PLACEHOLDER_URL = 'https://placeholder-project.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-anon-key';

export function serverSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url === PLACEHOLDER_URL || key === PLACEHOLDER_KEY) return false;
  try {
    assertClientSafeKey(key, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return true;
  } catch {
    return false;
  }
}

/** Crea un cliente Supabase atado a la sesión del usuario de la petición. */
export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_KEY;
  const cookieStore = cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
          );
        } catch {
          // Llamado desde un Server Component: el middleware se encarga de refrescar.
        }
      },
    },
    auth: {
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: false,
    },
  });
}
