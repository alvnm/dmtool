import type { Metadata, Viewport } from 'next';
import './globals.css';

// URL canónica absoluta: en Vercel se usa la del despliegue (VERCEL_URL) si no
// hay dominio configurado, para que og:image sea una URL absoluta válida.
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

const TITLE = 'DM Companion | Asistente de Dungeon Master para D&D 5e';
const DESCRIPTION =
  'Rastreador de iniciativa con temporizadores de condiciones, inventario y oro, compendio de monstruos SRD, NPCs, grimorio, notas rápidas, lanzador de dados y generador de nombres. Funciona offline en tu tablet o portátil.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: TITLE, template: '%s | DM Companion' },
  description: DESCRIPTION,
  applicationName: 'DM Companion',
  keywords: [
    'D&D', 'Dungeons and Dragons', 'Dungeon Master', 'DM', '5e', 'iniciativa',
    'combat tracker', 'compendio de monstruos', 'herramienta DM', 'lanzador de dados',
  ],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'DM Companion',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: '/',
    siteName: 'DM Companion',
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'DM Companion — Asistente de Dungeon Master para D&D 5e',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/opengraph-image.png'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b0c10' },
    { media: '(prefers-color-scheme: light)', color: '#ece0c6' },
  ],
  width: 'device-width',
  initialScale: 1,
};

// Restaura el tema elegido por el DM antes del primer pintado (sin parpadeo).
// Respeta preferencia del sistema (prefers-color-scheme) si no hay valor explícito en localStorage.
const themeInitScript = `
try {
  var t = window.localStorage.getItem('dm-theme');
  if (t === 'parchment' || t === 'dungeon') {
    document.documentElement.dataset.theme = t;
  } else {
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = prefersDark ? 'dungeon' : 'parchment';
  }
} catch (e) {
  document.documentElement.dataset.theme = 'dungeon';
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" data-theme="dungeon" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-dungeon-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
