/**
 * POST /api/auth/signup
 *
 * Creación de cuentas de Dungeon Master:
 *  - Mismas defensas que /api/auth/login: JSON, mismo origen, honeypot +
 *    tiempo mínimo de rellenado y rate limit por IP (middleware) y por email.
 *  - La contraseña nunca llega al cliente en claro ni se almacena: el hash lo
 *    gestiona Supabase Auth.
 *  - Si el proyecto tiene la confirmación por correo activada, Supabase no
 *    devuelve sesión y respondemos `needsConfirmation: true` para que la UI
 *    pida revisar el correo.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient, serverSupabaseConfigured } from '@/lib/supabase/server';
import { consume, loginPolicy, reset } from '@/lib/security/rateLimit';
import { invalid, isEmail, isPlainObject, isText } from '@/lib/security/validate';
import { sanitizeText } from '@/lib/security/sanitize';

export const runtime = 'nodejs';

/** Respuesta genérica: no distingue entre error interno y credencial inválida. */
function genericFailure(status: number, message = 'No se pudo crear la cuenta.') {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  if (!serverSupabaseConfigured()) {
    return NextResponse.json({ error: 'Registro no configurado en el servidor.' }, { status: 503 });
  }

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Tipo de contenido no soportado.' }, { status: 415 });
  }

  // Mismo origen: evita que un formulario externo dispare registros masivos.
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

  // ---- Protección anti-bots (misma barra que en el login) -----------------
  const honeypot = typeof body.website === 'string' ? body.website : '';
  const formTime = typeof body.formTime === 'number' ? body.formTime : 0;
  if (honeypot.trim() !== '' || formTime < 2000) {
    return genericFailure(200);
  }

  // ---- Validación ---------------------------------------------------------
  const email = typeof body.email === 'string' ? sanitizeText(body.email, 254).toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  const errors: string[] = [];
  if (!isEmail(email)) errors.push('Email inválido.');
  if (!isText(password, { min: 8, max: 200 })) errors.push('La contraseña debe tener al menos 8 caracteres.');
  if (errors.length) {
    return NextResponse.json(invalid(errors), { status: 400 });
  }

  // ---- Rate limit por email (además del por IP del middleware) ------------
  const policy = loginPolicy();
  const emailLimit = consume(`signup-email:${email}`, policy);
  if (!emailLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Inténtalo más tarde.' },
      { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfter) } }
    );
  }

  // ---- Alta de la cuenta en Supabase Auth ---------------------------------
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { app: 'dm-companion' } },
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes('already registered') || message.includes('already been registered')) {
      return NextResponse.json(
        { error: 'Ese email ya está registrado. Inicia sesión o usa otra dirección.' },
        { status: 409 }
      );
    }
    if (message.includes('password')) {
      return NextResponse.json(
        { error: 'La contraseña no cumple los requisitos del proyecto (mínimo 8 caracteres).' },
        { status: 400 }
      );
    }
    return genericFailure(502);
  }

  const user = data.user ?? null;
  const session = data.session ?? null;
  if (!user) return genericFailure(502);

  // Cuenta creada. Si el proyecto no pide confirmación por correo, Supabase
  // devuelve sesión y el usuario entra directamente; si la pide, avisamos.
  const res = NextResponse.json({
    ok: true,
    needsConfirmation: !session,
    user: { id: user.id, email: user.email },
  });

  if (session) {
    reset(`signup-email:${email}`);
    res.cookies.set('dm-companion-refresh', String(Date.now()), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Pragma', 'no-cache');
  return res;
}
