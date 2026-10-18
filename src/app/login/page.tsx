import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Acceso | DM Companion',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-dungeon-950 px-4">
      <div className="w-full max-w-md bg-dungeon-900 border border-dungeon-800 rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-serif font-bold text-slate-100 tracking-wide">
          DM <span className="text-amber-400">Companion</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          Acceso de Dungeon Masters: inicia sesión o crea tu cuenta. Sesión protegida con cookies
          httpOnly y caducidad corta.
        </p>
        <Suspense fallback={<p className="text-sm text-slate-400">Cargando…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
