'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, LogIn, UserPlus } from 'lucide-react';

type Mode = 'signin' | 'signup';

/**
 * Formulario de acceso y creación de cuentas.
 * - honeypot `website` oculto para bots.
 * - `formTime`: instante de montaje; el servidor exige >= 2 s de rellenado.
 * - El registro pide la contraseña dos veces para evitar erratas.
 */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const formTime = useRef<number>(0);

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    formTime.current = Date.now();
  }, []);

  const switchMode = (next: Mode) => {
    if (loading || next === mode) return;
    setMode(next);
    setError(null);
    setInfo(null);
    setShowPassword(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (mode === 'signup') {
      const allowedDomains = [
        'gmail.com',
        'googlemail.com',
        'yahoo.com',
        'yahoo.es',
        'hotmail.com',
        'hotmail.es',
        'outlook.com',
        'outlook.es',
        'live.com',
        'icloud.com',
        'proton.me',
        'protonmail.com',
      ];
      const domain = email.trim().toLowerCase().split('@')[1];
      if (!domain || !allowedDomains.includes(domain)) {
        setError('El correo debe pertenecer a un proveedor reconocido (ej: gmail.com, yahoo.com, outlook.com, hotmail.com).');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch(mode === 'signup' ? '/api/auth/signup' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: email.trim(),
          password,
          website: '', // honeypot: debe permanecer vacío
          formTime: Date.now() - formTime.current,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json?.error ?? json?.errors?.[0] ?? 'No se pudo completar la operación.');
        return;
      }

      if (mode === 'signup' && json?.needsConfirmation) {
        // El proyecto pide confirmar el correo antes de entrar.
        setInfo('Cuenta creada. Revisa tu correo y confirma la cuenta para poder entrar.');
        setLoading(false);
        return;
      }

      const next = params.get('next');
      // Solo rutas internas: evita redirigir a un dominio externo (open redirect).
      const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
      router.replace(target);
      router.refresh();
    } catch {
      setError('Error de red. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const busyLabel = mode === 'signup' ? 'Creando cuenta…' : 'Verificando…';

  return (
    <div className="space-y-4">
      {/* Conmutador entre acceso y registro */}
      <div className="grid grid-cols-2 gap-1 bg-dungeon-950 border border-dungeon-800 rounded-lg p-1">
        <button
          type="button"
          onClick={() => switchMode('signin')}
          aria-pressed={mode === 'signin'}
          className={`flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-md transition ${
            mode === 'signin'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" /> Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => switchMode('signup')}
          aria-pressed={mode === 'signup'}
          className={`flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-md transition ${
            mode === 'signup'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" /> Crear cuenta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Honeypot: oculto con CSS, los bots suelen rellenarlo. */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
          <label htmlFor="website">No rellenar</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value=""
            onChange={(e) => e.target.value}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-dungeon-950 border border-dungeon-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-1">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={8}
              maxLength={200}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-dungeon-950 border border-dungeon-700 px-3 py-2 pr-10 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="btn absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {mode === 'signup' && (
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              Repite la contraseña
            </label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={200}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg bg-dungeon-950 border border-dungeon-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-xs text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {info && (
          <p
            role="status"
            className="text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-900 rounded-lg px-3 py-2"
          >
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full disabled:opacity-60 py-2.5 text-sm flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading
            ? busyLabel
            : mode === 'signup'
              ? 'Crear cuenta de Dungeon Master'
              : 'Entrar'}
        </button>

        <p className="text-micro text-slate-500 leading-relaxed">
          Las contraseñas se almacenan con hash (Supabase Auth) y nunca en claro. Cada DM ve solo
          sus propias campañas. Tras 5 intentos fallidos la IP queda bloqueada temporalmente.
        </p>
      </form>
    </div>
  );
}
