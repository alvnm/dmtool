/**
 * Middleware global de seguridad:
 *  1. Fuerza HTTPS (HSTS ya lo añade next.config.js en producción).
 *  2. Añade cabeceras de seguridad a toda respuesta (defensa en profundidad).
 *  3. Refresca la sesión Supabase y bloquea el acceso sin sesión.
 *  4. Limita los intentos de login por IP en /api/auth/login.
 *  5. Rechaza cuerpos multipart salvo en rutas permitidas y limita su tamaño.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { consume, loginPolicy } from '@/lib/security/rateLimit';

const isProd = process.env.NODE_ENV === 'production';

// Rutas accesibles sin sesión.
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/sw.js',
  '/robots.txt',
  '/sitemap.xml',
  // Vista de combate en vivo para jugadores: sin sesión (llegan por un
  // enlace compartido con token de canal Realtime en la query string).
  '/combat',
];
const PUBLIC_API = ['/api/auth/login', '/api/health'];
// Única ruta que admite subida de archivos (con lista blanca en /api/uploads).
const UPLOAD_ROUTES = ['/api/uploads'];

const REFRESHABLE = 60 * 1000; // evita refrescar la sesión en cada petición

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function isPublic(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/') ||
    // Imágenes de vista previa (Open Graph / Twitter) y PWA: sin sesión,
    // las piden Discord, WhatsApp o el instalador de la app.
    pathname.startsWith('/opengraph-image') ||
    pathname.startsWith('/twitter-image') ||
    PUBLIC_API.includes(pathname)
  );
}

function securityHeaders(res: NextResponse) {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  if (isProd) {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'
  );
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- 1. Fuerza HTTPS ---------------------------------------------------
  // Solo cuando un proxy termina TLS e informa x-forwarded-proto (Vercel,
  // NGINX, ALB). Una conexión directa (next start en local) no se redirige
  // para evitar bucles.
  const forwardedProto = req.headers.get('x-forwarded-proto');
  if (isProd && forwardedProto === 'http') {
    const url = req.nextUrl.clone();
    url.protocol = 'https:';
    return securityHeaders(NextResponse.redirect(url, 308));
  }

  // --- 5. Cuerpos de solicitud -------------------------------------------
  const contentType = req.headers.get('content-type') ?? '';
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const isMultipart = contentType.startsWith('multipart/form-data');
    if (isMultipart && !UPLOAD_ROUTES.some((r) => pathname.startsWith(r))) {
      return securityHeaders(
        NextResponse.json({ error: 'Cargas de archivo no permitidas en esta ruta.' }, { status: 415 })
      );
    }
    const declared = Number(req.headers.get('content-length') ?? '0');
    const maxBody = isMultipart ? 1_000_000 : 100_000;
    if (Number.isFinite(declared) && declared > maxBody) {
      return securityHeaders(
        NextResponse.json({ error: 'Cuerpo de la solicitud demasiado grande.' }, { status: 413 })
      );
    }
  }

  // --- 4. Rate limit de login --------------------------------------------
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const policy = loginPolicy();
    const ip = clientIp(req);
    const result = consume(`login:${ip}`, policy);
    if (!result.allowed) {
      return securityHeaders(
        NextResponse.json(
          { error: 'Demasiados intentos. Inténtalo más tarde.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(result.retryAfter),
              'X-RateLimit-Limit': String(policy.limit),
              'X-RateLimit-Remaining': '0',
            },
          }
        )
      );
    }
  }

  // --- 2/3. Sesión y acceso -----------------------------------------------
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const configured = Boolean(
    supabaseUrl &&
      supabaseKey &&
      supabaseUrl !== 'https://placeholder-project.supabase.co' &&
      supabaseKey !== 'placeholder-anon-key'
  );

  if (!configured || isPublic(pathname)) {
    return securityHeaders(NextResponse.next());
  }

  let response = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        // Propaga las cookies renovadas a la petición y a la respuesta,
        // endureciendo siempre sus atributos (httpOnly/secure/sameSite).
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: req.headers } });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            path: '/',
          });
        });
      },
    },
  });

  // Refresco del token de acceso caducado (solo toca cookies en ese caso).
  const cookieRefreshAt = req.cookies.get('dm-companion-refresh')?.value;
  const shouldRefresh = !cookieRefreshAt || Date.now() - Number(cookieRefreshAt) > REFRESHABLE;
  if (shouldRefresh) {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      response.cookies.set('dm-companion-refresh', String(Date.now()), {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (pathname.startsWith('/api')) {
      return securityHeaders(NextResponse.json({ error: 'No autenticado.' }, { status: 401 }));
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    const redirect = NextResponse.redirect(url);
    // Reutiliza las cookies renovadas del intento de sesión.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return securityHeaders(redirect);
  }

  // Cabecera con el usuario verificado (para las rutas de API).
  response.headers.set('x-authenticated-user', user.id);
  return securityHeaders(response);
}

export const config = {
  // Excluye estáticos y fuentes del middleware.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
