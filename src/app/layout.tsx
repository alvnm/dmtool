import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DM Assistant Tool | Dungeon Master Companion',
  description: 'Aplicación modular para Dungeon Masters: Rastreador de Iniciativa, Inventario, Compendio de Monstruos, NPCs y Hechizos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="bg-dungeon-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
