'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Database, Cloud, HardDrive, Download, Upload, KeyRound,
  Keyboard, CheckCircle2, AlertTriangle, Loader2,
} from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  checkRemoteConfig, clearRemoteConfig, getRemoteConfig, saveRemoteConfig,
} from '@/lib/supabase/remoteConfig';
import {
  downloadCampaign, parseCampaign, type CampaignData, type CampaignExport,
} from '@/lib/campaign';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  /** Datos actuales de la campaña para el respaldo JSON. */
  getCampaign: () => CampaignExport;
  /** Aplica una campaña importada por el DM. */
  onImportCampaign: (data: CampaignData) => void;
  /** La conexión cambió (guardada o borrada): la app debe resincronizar. */
  onConnectionChanged: () => void;
}

const SHORTCUTS: Array<{ keys: string; desc: string }> = [
  { keys: 'Espacio / Enter', desc: 'Avanzar al siguiente turno (en Iniciativa)' },
  { keys: 'Ctrl + K', desc: 'Buscador rápido: saltar a notas, monstruos, NPCs o pestañas' },
  { keys: 'Esc', desc: 'Cerrar ventanas, paleta y herramientas' },
  { keys: 'Ctrl + S', desc: 'Descargar la campaña en JSON (respaldo)' },
];

/**
 * Ajustes del DM en un solo sitio:
 *  1. Conexión con Supabase (variables del servidor o credenciales pegadas aquí).
 *  2. Respaldo de la campaña en JSON (exportar / importar).
 *  3. Atajos de teclado.
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  getCampaign,
  onImportCampaign,
  onConnectionChanged,
}) => {
  const envConfigured = isSupabaseConfigured();
  const remote = getRemoteConfig();

  const [url, setUrl] = useState(remote?.url ?? '');
  const [key, setKey] = useState(remote?.anonKey ?? '');
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  // Inicio de sesión en la nube cuando las credenciales vienen del modal.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Importación de campaña
  const [importFeedback, setImportFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const cfg = getRemoteConfig();
    setUrl(cfg?.url ?? '');
    setKey(cfg?.anonKey ?? '');
    setFeedback(null);
    setAuthError(null);
    setImportFeedback(null);
  }, [open]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setFeedback(null);
    const result = await checkRemoteConfig(url, key);
    setChecking(false);
    if (!result.ok) {
      setFeedback({ kind: 'error', text: result.error ?? 'No se pudo validar la configuración.' });
      return;
    }
    saveRemoteConfig(url, key);
    setFeedback({ kind: 'ok', text: 'Credenciales guardadas en este navegador. Ya puedes sincronizar en la nube.' });
    onConnectionChanged();
  };

  const handleClearConfig = () => {
    clearRemoteConfig();
    setUrl('');
    setKey('');
    setFeedback({ kind: 'ok', text: 'Credenciales borradas. La app vuelve al modo local.' });
    onConnectionChanged();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setAuthError(null);
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    setSigningIn(false);
    if (error) {
      setAuthError('No se pudo iniciar sesión. Revisa el email y la contraseña.');
      return;
    }
    setFeedback({ kind: 'ok', text: 'Sesión iniciada en la nube: la campaña se sincroniza con tu proyecto.' });
    onConnectionChanged();
  };

  const handleExport = () => {
    try {
      downloadCampaign(getCampaign());
      setImportFeedback({ kind: 'ok', text: 'Campaña exportada como archivo .json.' });
    } catch {
      setImportFeedback({ kind: 'error', text: 'No se pudo generar el archivo de respaldo.' });
    }
  };

  const handleImportFile = async (file: File) => {
    setImportFeedback(null);
    try {
      const text = await file.text();
      const data = parseCampaign(text);
      onImportCampaign(data);
      setImportFeedback({ kind: 'ok', text: 'Campaña importada correctamente. Se recarga para aplicarla.' });
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      setImportFeedback({
        kind: 'error',
        text: err instanceof Error ? err.message : 'No se pudo importar el archivo.',
      });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Ajustes de la campaña"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
            className="bg-dungeon-900 border border-dungeon-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto"
          >
            {/* Cabecera */}
            <div className="sticky top-0 bg-dungeon-900 border-b border-dungeon-800 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" /> Ajustes
              </h2>
              <button
                onClick={onClose}
                aria-label="Cerrar ajustes"
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-dungeon-800 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* 1. CONEXIÓN SUPABASE */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Sincronización en la nube
                  </h3>
                </div>

                <div className="flex items-start gap-2 text-xs rounded-lg border px-3 py-2.5">
                  {envConfigured ? (
                    <>
                      <Cloud className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-emerald-300">
                        Conectado por <span className="font-semibold">variables de entorno</span> del servidor
                        (.env.local / Vercel). Así se gestiona el login y la sesión en todas las pantallas.
                      </p>
                    </>
                  ) : remote ? (
                    <>
                      <Cloud className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-amber-300">
                        Credenciales guardadas <span className="font-semibold">en este navegador</span>: la
                        sincronización funciona sin tocar .env.local. En otros dispositivos tendrás que pegarlas
                        de nuevo (o exportar/importar la campaña en JSON).
                      </p>
                    </>
                  ) : (
                    <>
                      <HardDrive className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-slate-400">
                        Modo local: la campaña se guarda en este navegador (localStorage). Pega aquí tus
                        credenciales de Supabase para sincronizar en la nube.
                      </p>
                    </>
                  )}
                </div>

                {!envConfigured && (
                  <form onSubmit={handleSaveConfig} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        URL del proyecto Supabase
                      </label>
                      <input
                        type="url"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="https://TU-PROYECTO.supabase.co"
                        className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none min-h-[42px] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Clave pública (anon / publishable)
                      </label>
                      <input
                        type="password"
                        value={key}
                        onChange={e => setKey(e.target.value)}
                        placeholder="eyJhbGciOi... (role anon)"
                        autoComplete="off"
                        className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none min-h-[42px] font-mono"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Sólo se acepta la clave pública. La <span className="text-red-400">service_role</span> se
                        rechaza: nunca debe salir del servidor.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="submit"
                        disabled={checking || !url.trim() || !key.trim()}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-450 text-slate-950 text-sm font-bold px-4 py-2.5 rounded-lg transition disabled:opacity-50 min-h-[44px]"
                      >
                        {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Comprobar y guardar
                      </button>
                      {remote && (
                        <button
                          type="button"
                          onClick={handleClearConfig}
                          className="text-xs text-slate-400 hover:text-red-400 px-3 py-2.5 rounded-lg border border-dungeon-700 transition min-h-[44px]"
                        >
                          Borrar credenciales
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {feedback && (
                  <p
                    className={`text-xs rounded-lg border px-3 py-2 flex items-start gap-2 ${
                      feedback.kind === 'ok'
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-red-950/60 border-red-800 text-red-300'
                    }`}
                    role="status"
                  >
                    {feedback.kind === 'ok' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    {feedback.text}
                  </p>
                )}

                {/* Login en la nube cuando la conexión viene del modal */}
                {!envConfigured && remote && (
                  <form onSubmit={handleSignIn} className="border-t border-dungeon-800 pt-3 space-y-3">
                    <p className="text-xs text-slate-400">
                      Inicia sesión en tu proyecto para leer la campaña en cualquier dispositivo:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="bg-dungeon-950 border border-dungeon-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none min-h-[42px]"
                      />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Contraseña"
                        className="bg-dungeon-950 border border-dungeon-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none min-h-[42px]"
                      />
                    </div>
                    {authError && <p className="text-xs text-red-400">{authError}</p>}
                    <button
                      type="submit"
                      disabled={signingIn}
                      className="flex items-center gap-2 bg-dungeon-800 hover:bg-dungeon-700 text-slate-200 text-sm font-semibold px-4 py-2.5 rounded-lg transition disabled:opacity-50 min-h-[44px]"
                    >
                      {signingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                      Conectar con Supabase
                    </button>
                  </form>
                )}
              </section>

              {/* 2. RESPALDO JSON */}
              <section className="space-y-3 border-t border-dungeon-800 pt-5">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Respaldo de la campaña
                  </h3>
                </div>

                <p className="text-xs text-slate-400">
                  Descarga notes, iniciativa, inventario, NPCs, bestiario propio y grupo en un archivo .json,
                  o tráelo desde otro navegador. No incluye credenciales.
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-sm font-semibold px-4 py-2.5 rounded-lg transition min-h-[44px]"
                  >
                    <Download className="w-4 h-4" /> Exportar JSON
                  </button>

                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 bg-dungeon-800 hover:bg-dungeon-700 text-slate-200 border border-dungeon-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition min-h-[44px]"
                  >
                    <Upload className="w-4 h-4" /> Importar JSON
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleImportFile(file);
                      e.target.value = '';
                    }}
                  />
                </div>

                {importFeedback && (
                  <p
                    className={`text-xs rounded-lg border px-3 py-2 flex items-start gap-2 ${
                      importFeedback.kind === 'ok'
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-red-950/60 border-red-800 text-red-300'
                    }`}
                    role="status"
                  >
                    {importFeedback.kind === 'ok' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    {importFeedback.text}
                  </p>
                )}
              </section>

              {/* 3. ATAJOS */}
              <section className="space-y-3 border-t border-dungeon-800 pt-5">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Atajos de teclado
                  </h3>
                </div>
                <ul className="space-y-1.5">
                  {SHORTCUTS.map(s => (
                    <li key={s.keys} className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-400">{s.desc}</span>
                      <kbd className="bg-dungeon-950 border border-dungeon-700 rounded px-2 py-1 font-mono text-[11px] text-amber-300 shrink-0">
                        {s.keys}
                      </kbd>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
