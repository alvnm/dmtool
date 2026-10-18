/**
 * POST /api/auth/login
 *
 * Inicio de sesión del lado del servidor:
 *  - Validación estricta del cuerpo (JSON, campos permitidos).
 *  - Protección anti-bots: honeypot + tiempo mínimo de rellenado + Origin.
 *  - Rate limit por IP (middleware) y por email (aquí).
 *  - Contraseñas: nunca se reciben ni se almacenan en claro; el hash lo
 *    gestiona Supabase Auth (bcrypt/scrypt en el servidor de Supabase).
 *  - Errores genéricos: no revelan si la cuenta existe.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient, serverSupabaseConfigured } from '@/lib/supabase/server';
import { consume, loginPolicy, reset } from '@/lib/security/rateLimit';
import { invalid, isEmail, isPlainObject, isText } from '@/lib/security/validate';
import { sanitizeText } from '@/lib/security/sanitize';

export const runtime = 'nodejs';

/** Respuesta idéntica para bots y credenciales inválidas: no filtra información. */
function genericFailure(status: number, message = 'No se pudieron verificar las credenciales.') {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  if (!serverSupabaseConfigured()) {
    return NextResponse.json({ error: 'Autenticación no configurada en el servidor.' }, { status: 503 });
  }

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Tipo de contenido no soportado.' }, { status: 415 });
  }

  // Mismo origen: evita que un formulario externo dispare inicios de sesión.
  const origin = req.headers.get('origin');
  if (origin) {
    const host = req.headers.get('host');
    if (host && new URL(origin).host !== host) {
      return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return genericFailure(400, 'Cuerpo JSON inválido.');
  }

  if (!isPlainObject(body)) {
    return genericFailure(400, 'Cuerpo inválido.');
  }

  // ---- Protección anti-bots ---------------------------------------------
  const honeypot = typeof body.website === 'string' ? body.website : '';
  const formTime = typeof body.formTime === 'number' ? body.formTime : 0;
  if (honeypot.trim() !== '' || formTime < 2000) {
    // Un humano no rellena el campo oculto ni envía en menos de 2 segundos.
    return genericFailure(200);
  }

  // ---- Validación --------------------------------------------------------
  const email = typeof body.email === 'string' ? sanitizeText(body.email, 254).toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  const errors: string[] = [];
  if (!isEmail(email)) errors.push('Email inválido.');
  if (!isText(password, { min: 8, max: 200 })) errors.push('Contraseña inválida.');
  if (errors.length) {
    return NextResponse.json(invalid(errors), { status: 400 });
  }

  // ---- Rate limit por email (además del por IP del middleware) ----------
  const policy = loginPolicy();
  const emailLimit = consume(`login-email:${email}`, policy);
  if (!emailLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Inténtalo más tarde.' },
      { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfter) } }
    );
  }

  // ---- Autenticación (hash verificado por Supabase Auth) ----------------
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return genericFailure(401);
  }

  // Un login válido limpia el contador de intentos de ese email.
  reset(`login-email:${email}`);

  const res = NextResponse.json({
    ok: true,
    user: { id: data.user.id, email: data.user.email },
  });

  // Cookies de sesión endurecidas (httpOnly, secure en prod, sameSite=lax).
  // El cliente SSR de @supabase/ssr ya persiste access/refresh token en cookies
  // httpOnly; aquí solo reforzamos el marcador de refresco.
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  res.cookies.set('dm-companion-refresh', String(Date.now()), {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  });

  // Evita cachear respuestas de autenticación.
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Pragma', 'no-cache');

  return res;
}
