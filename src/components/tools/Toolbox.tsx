'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, UserRound, X, Copy, Trash2, Wand2, Check, UserPlus, Users, BookOpen } from 'lucide-react';
import { roll, rollD20WithMode, type RollMode } from '@/lib/dice';
import { NAME_POOLS, randomName, type NameCategory } from '@/lib/names';
import { generateQuickNpc, type QuickNpc } from '@/lib/npcGenerator';
import { QuickRules } from '@/components/tools/QuickRules';
import { NPC } from '@/types';
import { usePersistentState } from '@/lib/usePersistentState';

type TabId = 'dados' | 'nombres' | 'npc' | 'reglas';

interface HistoryEntry {
  id: number;
  notation: string;
  total: number;
  detail: string;
}

const QUICK_ROLLS = ['1d20', '1d20+5', '1d20-2', '2d6+3', '4d6', '1d8', '1d100'];
const DIE_BUTTONS = [4, 6, 8, 10, 12, 20, 100];
const MAX_HISTORY = 25;

/**
 * Toolbox flotante del DM: lanzador de dados con historial + soundboard +
 * referencia de reglas + generador de nombres + NPC improvisado al vuelo. El
 * historial de tiradas se guarda en localStorage.
 */
export interface ToolboxProps {
  /** Guarda un NPC generado al vuelo en la lista del DM. */
  onSaveNpc?: (npc: NPC) => void;
}

export const Toolbox: React.FC<ToolboxProps> = ({ onSaveNpc }) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabId>('dados');

  // Dados
  const [notation, setNotation] = useState('1d20+5');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = usePersistentState<HistoryEntry[]>('dice-history', []);
  const [lastTotal, setLastTotal] = useState<number | null>(null);

  // Nombres
  const [category, setCategory] = usePersistentState<NameCategory>('name-category', 'Humano');
  const [generated, setGenerated] = useState<{ id: number; value: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // NPC al vuelo
  const [quickNpc, setQuickNpc] = useState<QuickNpc | null>(null);
  const [npcSaved, setNpcSaved] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open && tab === 'dados') inputRef.current?.focus();
  }, [open, tab]);

  useEffect(() => {
    const timer = copyTimer.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const doRoll = (value: string) => {
    try {
      const result = roll(value);
      setError(null);
      setLastTotal(result.total);
      setHistory(prev =>
        [
          {
            id: Date.now() + Math.random(),
            notation: result.notation,
            total: result.total,
            detail: result.rolls.join(' + ') + (result.modifier ? ` ${result.modifier > 0 ? '+' : ''}${result.modifier}` : ''),
          },
          ...prev,
        ].slice(0, MAX_HISTORY)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tirada no válida');
    }
  };

  /**
   * Tira 1d20 con ventaja/desventaja. Si el campo de notación contiene un
   * modificador de d20 (1d20+5) se aplica; si no, tira con +0.
   */
  const doD20WithMode = (mode: Exclude<RollMode, 'normal'>) => {
    let modifier = 0;
    try {
      const parsed = roll(notation);
      if (parsed.count === 1 && parsed.sides === 20) modifier = parsed.modifier;
    } catch {
      // Notación libre: se tira con +0 en lugar de romper el flujo de la partida.
    }
    const result = rollD20WithMode(modifier, mode);
    setError(null);
    setLastTotal(result.total);
    setHistory(prev =>
      [
        {
          id: Date.now() + Math.random(),
          notation: result.notation,
          total: result.total,
          detail: `${result.rolls![0]}, ${result.rolls![1]} → ${result.kept}${modifier ? ` ${modifier > 0 ? '+' : ''}${modifier}` : ''}`,
        },
        ...prev,
      ].slice(0, MAX_HISTORY)
    );
  };

  const generateName = () => {
    const value = randomName(category);
    setGenerated({ id: Date.now(), value });
    setCopied(false);
  };

  const copyName = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.value);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard bloqueado: el nombre queda visible para copiarlo a mano.
    }
  };

  const activePool = NAME_POOLS.find(p => p.category === category) ?? NAME_POOLS[0];

  const generateNpc = () => {
    setQuickNpc(generateQuickNpc());
    setNpcSaved(false);
  };

  const saveQuickNpc = () => {
    if (!quickNpc || !onSaveNpc) return;
    const { job: _job, trait: _trait, ...npc } = quickNpc;
    onSaveNpc(npc);
    setNpcSaved(true);
  };

  return (
    <>
      {/* Botón flotante */}
      <motion.button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-label={open ? 'Cerrar herramientas del DM' : 'Abrir herramientas del DM (dados, sonidos, reglas, nombres y NPCs)'}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="btn fixed z-50 bottom-4 right-4 mb-[env(safe-area-inset-bottom)] w-14 h-14 rounded-full bg-gradient-to-br text-slate-950 shadow-xl shadow-amber-600/30 flex items-center justify-center border border-amber-400/60"
        title="Herramientas del DM: dados, sonidos, reglas, nombres y NPC al vuelo"
      >
        {open ? <X className="w-6 h-6" /> : <Dices className="w-7 h-7" />}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            role="dialog"
            aria-label="Herramientas del DM"
            className="fixed z-50 bottom-20 right-4 mb-[env(safe-area-inset-bottom)] w-[min(22rem,calc(100vw-2rem))] max-h-[75vh] flex flex-col bg-dungeon-900 border border-dungeon-700 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Pestañas */}
            <div className="flex border-b border-dungeon-800 overflow-x-auto">
              <button
                onClick={() => setTab('dados')}
                className={`flex-1 min-w-[4.5rem] shrink-0 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition ${
                  tab === 'dados' ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Dices className="w-4 h-4" /> Dados
              </button>
              <button
                onClick={() => setTab('reglas')}
                className={`flex-1 min-w-[4.5rem] shrink-0 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition ${
                  tab === 'reglas' ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" /> Reglas
              </button>
              <button
                onClick={() => setTab('nombres')}
                className={`flex-1 min-w-[4.5rem] shrink-0 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition ${
                  tab === 'nombres' ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserRound className="w-4 h-4" /> Nombres
              </button>
              <button
                onClick={() => setTab('npc')}
                className={`flex-1 min-w-[4.5rem] shrink-0 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition ${
                  tab === 'npc' ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" /> NPC
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              {tab === 'dados' ? (
                <div className="space-y-3">
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      doRoll(notation);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={notation}
                      onChange={e => setNotation(e.target.value)}
                      placeholder="2d6+3"
                      aria-label="Notación de tirada"
                      className="input flex-1 min-w-0 font-mono"
                    />
                    <button
                      type="submit"
                      className="btn btn-primary text-sm px-3"
                    >
                      Tirar
                    </button>
                  </form>

                  {error && <p className="text-xs text-red-400">{error}</p>}

                  {/* Botones rápidos de dados */}
                  <div className="flex flex-wrap gap-1.5">
                    {DIE_BUTTONS.map(sides => (
                      <button
                        key={sides}
                        onClick={() => doRoll(`1d${sides}`)}
                        title={`Tira 1d${sides}`}
                        aria-label={`Tirar 1d${sides}`}
                        className="btn text-micro px-3 py-2 rounded-md text-amber-300 bg-gradient-to-b border border-dungeon-600 shadow-[0_2px_0_#07080b,0_5px_10px_rgba(0,0,0,0.45)] hover:text-amber-200 active:translate-y-[2px] active:shadow-[0_0px_0_#07080b,0_2px_5px_rgba(0,0,0,0.4)]"
                      >
                        1d{sides}
                      </button>
                    ))}
                  </div>
                  {/* Ventaja / Desventaja: el 90% de las tiradas de monstruos */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => doD20WithMode('ventaja')}
                      className="btn flex items-center justify-center gap-1.5 text-micro bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 py-2 min-h-[40px]"
                      title="Tira 2d20 y quédate con el mayor"
                    >
                      1d20 Ventaja
                    </button>
                    <button
                      onClick={() => doD20WithMode('desventaja')}
                      className="btn flex items-center justify-center gap-1.5 text-micro bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 py-2 min-h-[40px]"
                      title="Tira 2d20 y quédate con el menor"
                    >
                      1d20 Desventaja
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ROLLS.map(n => (
                      <button
                        key={n}
                        onClick={() => doRoll(n)}
                        title={`Tira ${n}`}
                        aria-label={`Tirar ${n}`}
                        className="btn text-micro px-3 py-2 rounded-md text-amber-300 bg-gradient-to-b border border-amber-500/40 shadow-[0_2px_0_rgba(0,0,0,0.5),0_5px_10px_rgba(0,0,0,0.35)] hover:text-amber-200 active:translate-y-[2px] active:shadow-[0_0px_0_rgba(0,0,0,0.5),0_2px_5px_rgba(0,0,0,0.3)]"
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  {/* Resultado destacado */}
                  <AnimatePresence mode="popLayout">
                    {lastTotal !== null && (
                      <motion.div
                        key={lastTotal + '-' + (history[0]?.id ?? 0)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-dungeon-950 border border-amber-500/40 rounded-lg p-3 text-center"
                      >
                        <p className="text-micro uppercase tracking-widest text-slate-500">
                          {history[0]?.notation ?? ''}
                        </p>
                        <p className="text-3xl font-black text-amber-400">{lastTotal}</p>
                        <p className="text-micro text-slate-400 font-mono">{history[0]?.detail}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Historial */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-micro uppercase tracking-widest font-bold text-slate-500">
                      Historial ({history.length})
                    </h4>
                    {history.length > 0 && (
                      <button
                        onClick={() => setHistory([])}
                        className="btn text-micro text-slate-500 hover:text-red-400 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Limpiar
                      </button>
                    )}
                  </div>
                  <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {history.map(h => (
                        <motion.li
                          key={h.id}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-between gap-2 bg-dungeon-950 border border-dungeon-800 rounded px-2 py-1.5 text-xs"
                        >
                          <span className="font-mono text-slate-400">{h.notation}</span>
                          <span className="text-micro text-slate-500 font-mono truncate">{h.detail}</span>
                          <span className="font-bold text-amber-400">{h.total}</span>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              ) : tab === 'nombres' ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {NAME_POOLS.map(pool => (
                      <button
                        key={pool.category}
                        onClick={() => setCategory(pool.category)}
                        className={`text-micro px-2.5 py-1.5 rounded-full border transition ${
                          category === pool.category
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                            : 'bg-dungeon-950 text-slate-400 border-dungeon-700 hover:text-slate-200'
                        }`}
                      >
                        {pool.label}
                      </button>
                    ))}
                  </div>

                  <p className="text-micro text-slate-500">{activePool.hint}</p>

                  <button
                    onClick={generateName}
                    className="btn btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5"
                  >
                    <Wand2 className="w-4 h-4" /> Generar nombre
                  </button>

                  <div className="bg-dungeon-950 border border-dungeon-700 rounded-lg p-4 text-center min-h-[68px] flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                      {generated ? (
                        <motion.p
                          key={generated.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.18 }}
                          className="font-serif text-xl font-bold text-amber-400"
                        >
                          {generated.value}
                        </motion.p>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Pulsa el botón cuando los jugadores hablen con un NPC improvisado.
                        </p>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={copyName}
                    disabled={!generated}
                    className="btn w-full flex items-center justify-center gap-2 bg-dungeon-800 hover:bg-dungeon-700 text-slate-300 px-3 py-2 disabled:opacity-50"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado' : 'Copiar nombre'}
                  </button>
                </div>
              ) : tab === 'reglas' ? (
                <QuickRules />
              ) : (
                /* NPC improvisado al vuelo: nombre + raza + actitud + secreto. */
                <div className="space-y-3">
                  <button
                    onClick={generateNpc}
                    className="btn btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5"
                  >
                    <Wand2 className="w-4 h-4" /> {quickNpc ? 'Otro NPC' : 'Generar NPC al vuelo'}
                  </button>

                  {!quickNpc ? (
                    <p className="text-micro text-slate-500 text-center">
                      ¿Los jugadores hablan con alguien improvisado? Un clic y tienes nombre,
                      raza, actitud y un secreto listo para soltar.
                    </p>
                  ) : (
                    <motion.div
                      key={quickNpc.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className="bg-dungeon-950 border border-dungeon-800 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-serif text-lg font-bold text-amber-400 truncate">{quickNpc.name}</p>
                          <p className="text-micro text-slate-400">
                            {quickNpc.race} • {quickNpc.job}
                          </p>
                        </div>
                        <span className="text-micro font-bold px-2 py-0.5 rounded border shrink-0 bg-dungeon-900 text-slate-300 border-dungeon-700">
                          {quickNpc.disposition}
                        </span>
                      </div>

                      <p className="text-micro text-slate-400">
                        <span className="text-slate-500 font-semibold">Rasgo:</span> {quickNpc.trait}
                      </p>
                      <p className="text-micro text-purple-300 bg-purple-950/50 border border-purple-900 rounded p-2">
                        <span className="font-bold">Secreto DM:</span> {quickNpc.secret_notes}
                      </p>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => quickNpc && navigator.clipboard?.writeText(`${quickNpc.name} (${quickNpc.race}, ${quickNpc.job}) — ${quickNpc.disposition}\nRasgo: ${quickNpc.trait}\nSecreto: ${quickNpc.secret_notes}`).catch(() => {})}
                      disabled={!quickNpc}
                      className="btn flex items-center justify-center gap-2 bg-dungeon-800 hover:bg-dungeon-700 text-slate-300 px-3 py-2 disabled:opacity-50"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar
                    </button>
                    <button
                      onClick={saveQuickNpc}
                      disabled={!quickNpc || !onSaveNpc || npcSaved}
                      className="btn flex items-center justify-center gap-2 bg-dungeon-800 hover:bg-dungeon-700 text-amber-300 px-3 py-2 disabled:opacity-50"
                      title="Añade el NPC a tu lista de personajes"
                    >
                      {npcSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <UserPlus className="w-3.5 h-3.5" />}
                      {npcSaved ? 'Guardado' : 'Guardar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
