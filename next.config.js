/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

// HTTPS forzado solo con FORCE_HTTPS=1: mismo criterio que el middleware.
// Next inyecta x-forwarded-proto=http en conexiones directas, así que sin un
// flag explícito `next start` local en producción debe seguir sirviendo por http
// (Vercel/NGINX redirigen HTTP→HTTPS en su propio plano).
const forceHttps = process.env.FORCE_HTTPS === '1';

// CSP: 'self' + Supabase. En desarrollo se permite eval (HMR) e imágenes de data:.
const csp = [
  "default-src 'self'",
  // Next.js inyecta scripts inline; sin nonce se requiere 'unsafe-inline'.
  isProd ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd && forceHttps ? ["upgrade-insecure-requests"] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // elimina el banner X-Powered-By: Next.js
  compress: true, // compresión Gzip / Brotli

  // Acciones de servidor: solo desde el propio origen.
  // optimizePackageImports es una opción experimental: debe vivir dentro de
  // `experimental` (fuera de ahí Next la ignora y avisa en cada build).
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    serverActions: {
      allowedOrigins: ['localhost:3000'],
      bodySizeLimit: '100kb',
    },
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

// En producción se puede fijar el origen de allowedOrigins con NEXT_PUBLIC_APP_URL.
// Nota: allowedOrigins espera HOST[puerto] sin el esquema (https://).
if (process.env.NEXT_PUBLIC_APP_URL) {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_APP_URL).host;
    nextConfig.experimental.serverActions.allowedOrigins = [host];
  } catch {
    // URL inválida: mantenemos el origen por defecto.
  }
}

module.exports = nextConfig;
