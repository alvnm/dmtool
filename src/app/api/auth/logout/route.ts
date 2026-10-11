/** POST /api/auth/logout: revoca la sesión en Supabase y limpia las cookies. */
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST() {
  const supabase = createSupabaseServerClient();
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch {
    // Aunque falle la revocación remota, limpiamos las cookies locales.
  }

  const res = NextResponse.json({ ok: true });
  for (const name of ['dm-companion-session', 'dm-companion-refresh', 'dm-companion-auth']) {
    res.cookies.set(name, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  }
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
