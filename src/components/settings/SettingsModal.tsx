'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Database, Cloud, HardDrive, Download, Upload, KeyRound,
  Keyboard, CheckCircle2, AlertTriangle, Loader2, Copy, Trash2, RotateCcw, ClipboardPaste
} from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  checkRemoteConfig, clearRemoteConfig, getRemoteConfig, saveRemoteConfig,
} from '@/lib/supabase/remoteConfig';
import {
  downloadCampaign, parseCampaign, type CampaignData, type CampaignExport,
} from '@/lib/campaign';
import { useToast } from '@/components/Toast';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  getCampaign: () => CampaignExport;
  onImportCampaign: (data: CampaignData) => void;
  onConnectionChanged: () => void;
}

const SHORTCUTS: Array<{ keys: string; desc: string }> = [
  { keys: 'Espacio / Enter', desc: 'Avanzar al siguiente turno (en Iniciativa)' },
  { keys: 'Ctrl + K', desc: 'Buscador rápido: saltar a notas, monstruos, NPCs o pestañas' },
  { keys: 'Esc', desc: 'Cerrar ventanas, paleta y herramientas' },
  { keys: 'Ctrl + S', desc: 'Descargar la campaña en JSON (respaldo rápido)' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  getCampaign,
  onImportCampaign,
  onConnectionChanged,
}) => {
  const toast = useToast();
  const envConfigured = isSupabaseConfigured();
  const remote = getRemoteConfig();

  const [url, setUrl] = useState(remote?.url ?? '');
  const [key, setKey] = useState(remote?.anonKey ?? '');
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Importación / Exportación JSON con soporte de portapapeles y comparativa
  const [importFeedback, setImportFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [rawJsonText, setRawJsonText] = useState('');
  const [showJsonInspector, setShowJsonInspector] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
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
    setShowJsonInspector(false);
    setRawJsonText('');
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
    if (!window.confirm('¿Borrar las credenciales de Supabase guardadas en este navegador?')) return;
    clearRemoteConfig();
    setUrl('');
    setKey('');
    setFeedback({ kind: 'ok', text: 'Credenciales eliminadas. La app vuelve al modo local.' });
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
      const camp = getCampaign();
      downloadCampaign(camp);
      setImportFeedback({ kind: 'ok', text: 'Campaña exportada como archivo .json.' });
      toast.success('Archivo .json generado y descargado.');
    } catch {
      setImportFeedback({ kind: 'error', text: 'No se pudo generar el archivo de respaldo.' });
      toast.error('Error al generar el respaldo.');
    }
  };

  const handleCopyJsonToClipboard = () => {
    try {
      const camp = getCampaign();
      const str = JSON.stringify(camp, null, 2);
      navigator.clipboard.writeText(str);
      setCopiedJson(true);
      toast.success('JSON copiado al portapapeles.');
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      toast.error('No se pudo copiar el JSON.');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast.error('El portapapeles está vacío.');
        return;
      }
      setRawJsonText(text);
      setShowJsonInspector(true);
      toast.info('Texto pegado desde el portapapeles. Pulsa «Aplicar Campaña».');
    } catch {
      toast.error('Permiso denegado para leer el portapapeles.');
    }
  };

  const handleApplyRawJson = () => {
    if (!rawJsonText.trim()) return;
    try {
      const data = parseCampaign(rawJsonText);
      onImportCampaign(data);
      setImportFeedback({ kind: 'ok', text: 'Campaña cargada y validada correctamente.' });
      toast.success('¡Campaña restaurada con éxito!');
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      setImportFeedback({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Error en la estructura del JSON.',
      });
      toast.error('El formato del JSON no es válido.');
    }
  };

  const handleResetEntireCampaign = () => {
    if (!window.confirm('⚠️ ¿Estás completamente seguro de restablecer la campaña a los datos iniciales? Se perderán las modificaciones locales si no tienes un respaldo JSON.')) {
      return;
    }
    localStorage.clear();
    toast.info('Restableciendo datos de ejemplo...');
    setTimeout(() => window.location.reload(), 500);
  };

  const handleImportFile = async (file: File) => {
    setImportFeedback(null);
    try {
      const text = await file.text();
      const data = parseCampaign(text);
      onImportCampaign(data);
      setImportFeedback({ kind: 'ok', text: 'Campaña importada correctamente. Se recarga para aplicarla.' });
      toast.success('¡Campaña importada con éxito!');
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      setImportFeedback({
        kind: 'error',
        text: err instanceof Error ? err.message : 'No se pudo importar el archivo.',
      });
      toast.error('Archivo no válido.');
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
                <KeyRound className="w-5 h-5 text-amber-400" /> Ajustes & Datos
              </h2>
              <button
                onClick={onClose}
                aria-label="Cerrar ajustes"
                className="btn p-2 text-slate-400 hover:text-slate-100 hover:bg-dungeon-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
                    Base de datos (Supabase)
                  </h3>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-dungeon-800 bg-dungeon-950 text-xs">
                  {envConfigured ? (
                    <>
                      <Cloud className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-emerald-300">Conectado por variables de entorno</p>
                        <p className="text-slate-400 mt-0.5">
                          El servidor web ya tiene configurado el proyecto. Las peticiones se autentican por cookie.
                        </p>
                      </div>
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
                      <label className="label">URL del proyecto Supabase</label>
                      <input
                        type="url"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="https://TU-PROYECTO.supabase.co"
                        className="input p-2.5 min-h-[42px] font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="label">Clave pública (anon / publishable)</label>
                      <input
                        type="password"
                        value={key}
                        onChange={e => setKey(e.target.value)}
                        placeholder="eyJhbGciOi... (role anon)"
                        autoComplete="off"
                        className="input p-2.5 min-h-[42px] font-mono text-xs"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="submit"
                        disabled={checking || !url.trim() || !key.trim()}
                        className="btn btn-primary flex items-center gap-2 text-xs py-2 disabled:opacity-50"
                      >
                        {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Comprobar y guardar
                      </button>
                      {remote && (
                        <button
                          type="button"
                          onClick={handleClearConfig}
                          className="btn text-slate-400 hover:text-red-400 px-3 py-2 border border-dungeon-700 text-xs"
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
              </section>

              {/* 2. RESPALDO Y GESTIÓN DE DATOS JSON */}
              <section className="space-y-3 border-t border-dungeon-800 pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                      Entrada / Salida de Datos (JSON)
                    </h3>
                  </div>
                  <button
                    onClick={handleResetEntireCampaign}
                    className="btn flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1 rounded"
                    title="Borrar cambios locales y volver a datos de ejemplo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restablecer datos
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  Exporta e importa personajes, notas, iniciativa, inventario y bestiario. Puedes descargar un archivo, copiar el JSON o pegar texto directamente.
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExport}
                    className="btn flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-3 py-2"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar archivo .json
                  </button>

                  <button
                    onClick={handleCopyJsonToClipboard}
                    className="btn flex items-center gap-1.5 bg-dungeon-800 hover:bg-dungeon-700 text-slate-200 border border-dungeon-700 text-xs px-3 py-2"
                  >
                    {copiedJson ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedJson ? 'Copiado' : 'Copiar JSON'}
                  </button>

                  <button
                    onClick={() => fileRef.current?.click()}
                    className="btn flex items-center gap-1.5 bg-dungeon-800 hover:bg-dungeon-700 text-slate-200 border border-dungeon-700 text-xs px-3 py-2"
                  >
                    <Upload className="w-3.5 h-3.5" /> Subir archivo
                  </button>

                  <button
                    onClick={handlePasteFromClipboard}
                    className="btn flex items-center gap-1.5 bg-dungeon-800 hover:bg-dungeon-700 text-slate-200 border border-dungeon-700 text-xs px-3 py-2"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 text-amber-400" /> Pegar del portapapeles
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

                {/* Editor / Inspector de texto JSON */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowJsonInspector(!showJsonInspector)}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                  >
                    {showJsonInspector ? 'Ocultar editor de texto' : 'Ver / pegar texto JSON directamente'}
                  </button>

                  {showJsonInspector && (
                    <div className="space-y-2 p-3 bg-dungeon-950 border border-dungeon-800 rounded-lg">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Pega aquí el contenido JSON para validar y restaurar:</span>
                        <button
                          type="button"
                          onClick={() => setRawJsonText('')}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          Limpiar
                        </button>
                      </div>
                      <textarea
                        rows={6}
                        value={rawJsonText}
                        onChange={e => setRawJsonText(e.target.value)}
                        placeholder='{"format": "dm-companion-campaign", "version": 1, ...}'
                        className="w-full bg-dungeon-900 border border-dungeon-800 rounded p-2 text-xs font-mono text-slate-200 resize-y"
                      />
                      <button
                        type="button"
                        onClick={handleApplyRawJson}
                        disabled={!rawJsonText.trim()}
                        className="btn btn-primary text-xs w-full py-2 flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aplicar y Validar Campaña
                      </button>
                    </div>
                  )}
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
                      <kbd className="bg-dungeon-950 border border-dungeon-700 rounded px-2 py-1 font-mono text-micro text-amber-300 shrink-0">
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
