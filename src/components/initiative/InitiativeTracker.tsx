'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Combatant, Monster, NPC } from '@/types';
import { rollD20 } from '@/lib/dice';
import { formatMod, monsterToCombatant, npcToCombatant, sortCombatants } from '@/lib/combat';
import { 
  Swords, Plus, Trash2, Shield, Heart, ArrowRight, ArrowLeft,
  RotateCcw, Sparkles, Search, UserCheck, Skull, Dices, Timer, Maximize2, Minimize2,
  Share2, Link2, Copy, Eye, EyeOff, Radio, Check
} from 'lucide-react';
import { usePersistentState } from '@/lib/usePersistentState';
import { useToast } from '@/components/Toast';
import { AVAILABLE_CONDITIONS, CONDITION_ICONS } from '@/lib/conditions';
import {
  getOrCreateShareToken,
  buildShareUrl,
  openCombatChannel,
  broadcastCombatState,
  COMBAT_SYNC_EVENT,
  isSharedCombatState,
} from '@/lib/combatShare';
import { getSupabase, isCloudConfigured } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface InitiativeTrackerProps {
  combatants: Combatant[];
  monsters: Monster[];
  npcs: NPC[];
  onUpdateCombatants: (combatants: Combatant[]) => void;
}

// Duraciones por defecto (en rondas) que el DM puede ciclar con un clic.
const DURATION_CYCLE: Array<number | null> = [3, 1, 2, 4, 5, 10, null];
const DEFAULT_ROUNDS = 3;

export const InitiativeTracker: React.FC<InitiativeTrackerProps> = ({
  combatants,
  monsters,
  npcs,
  onUpdateCombatants,
}) => {
  const toast = useToast();
  // La sesión de combate también se guarda: un refresco no pierde la ronda.
  const [currentTurnIndex, setCurrentTurnIndex] = usePersistentState<number>('turn-index', 0);
  const [round, setRound] = usePersistentState<number>('round', 1);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importSearchTerm, setImportSearchTerm] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Vista de jugadores en vivo (Supabase Realtime Broadcast).
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<'off' | 'connecting' | 'live' | 'error'>('off');
  const [hideEnemyHp, setHideEnemyHp] = usePersistentState<boolean>('share-hide-enemy-hp', true);
  const [viewerCount, setViewerCount] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Custom new combatant form state
  const [newName, setNewName] = useState('');
  const [newInitiative, setNewInitiative] = useState(10);
  const [newHp, setNewHp] = useState(10);
  const [newAc, setNewAc] = useState(10);
  const [newDexMod, setNewDexMod] = useState(0);
  const [isPlayer, setIsPlayer] = useState(false);

  // Aviso efímero (condiciones caducadas)
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);
  // Indicadores flotantes de +/- HP
  const [floaters, setFloaters] = useState<Record<string, { amount: number; key: number }>>({});
  const floaterTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Modal de daño/curación/vida temporal personalizado
  const [hpModalCombatant, setHpModalCombatant] = useState<Combatant | null>(null);
  const [hpModalAmount, setHpModalAmount] = useState<string>('');
  const [hpModalTab, setHpModalTab] = useState<'damage' | 'heal' | 'temp'>('damage');

  // El turno nunca puede quedar fuera de rango tras borrar combatientes.
  useEffect(() => {
    if (combatants.length === 0) {
      if (currentTurnIndex !== 0) setCurrentTurnIndex(0);
      return;
    }
    if (currentTurnIndex > combatants.length - 1) {
      setCurrentTurnIndex(combatants.length - 1);
    }
  }, [combatants.length, currentTurnIndex, setCurrentTurnIndex]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    const timers = floaterTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const timer = copyTimer.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Estado actual para el canal: se lee desde una ref para no reconectar
  // el canal cada vez que cambia un PV.
  const shareSourceRef = useRef({ combatants, round, turnIndex: currentTurnIndex, hideEnemyHp });
  shareSourceRef.current = { combatants, round, turnIndex: currentTurnIndex, hideEnemyHp };

  useEffect(() => {
    if (!shareToken || !isCloudConfigured()) return;
    let cancelled = false;
    const client = getSupabase();
    const channel = openCombatChannel(client, shareToken);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: COMBAT_SYNC_EVENT }, () => {
        // Un jugador (re)conecta: se le manda el estado actual al instante.
        broadcastCombatState(channel, shareSourceRef.current);
      })
      .on('presence', { event: 'sync' }, () => {
        if (!cancelled) setViewerCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(status => {
        if (cancelled) return;
        if (status === 'SUBSCRIBED') {
          setShareStatus('live');
          broadcastCombatState(channel, shareSourceRef.current);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setShareStatus('error');
        } else if (status === 'CLOSED') {
          setShareStatus('off');
          setViewerCount(0);
        }
      });

    return () => {
      cancelled = true;
      channelRef.current = null;
      setViewerCount(0);
      client.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareToken]);

  // Publicar cambios del combate (debounce para no saturar los toques rápidos de HP).
  useEffect(() => {
    if (shareStatus !== 'live') return;
    const t = setTimeout(() => broadcastCombatState(channelRef.current, shareSourceRef.current), 150);
    return () => clearTimeout(t);
  }, [combatants, round, currentTurnIndex, hideEnemyHp, shareStatus]);

  const handleToggleShare = () => {
    if (shareToken) {
      // Cerrar la sesión de compartición.
      const client = getSupabase();
      if (channelRef.current) client.removeChannel(channelRef.current);
      channelRef.current = null;
      setShareToken(null);
      setShareStatus('off');
      setViewerCount(0);
      return;
    }
    if (!isCloudConfigured()) {
      setNotice({
        id: Date.now(),
        text: '⚠️ Conecta Supabase en Ajustes para compartir el combate en vivo.',
      });
      return;
    }
    setShareStatus('connecting');
    setShareToken(getOrCreateShareToken());
  };

  const handleCopyShareLink = async () => {
    if (!shareToken) return;
    try {
      await navigator.clipboard.writeText(buildShareUrl(shareToken));
      setCopiedLink(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedLink(false), 1600);
    } catch {
      // Clipboard bloqueado: el enlace queda visible para copiarlo a mano.
    }
  };

  /**
   * Avanzar de turno con Espacio/Enter (atajo pedido por el DM para no
   * apartar las manos del teclado). No roba la tecla cuando el foco está en
   * un botón, campo de texto o cualquier control editable.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = document.activeElement;
      if (el && !(el instanceof HTMLElement)) return;
      if (el?.closest('input, textarea, select, button, a, [contenteditable="true"], [role="dialog"]')) return;
      e.preventDefault();
      handleNextTurn();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combatants, currentTurnIndex]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // El navegador puede rechazarlo (p. ej. sin gesto del usuario).
    }
  };

  /**
   * Lanza 1d20 + mod. DEST para monstruos y NPCs (los PJs conservan la
   * iniciativa que haya reportado el jugador) y reordena la ronda.
   */
  const handleRollInitiative = () => {
    const rolled = combatants.map(c => {
      if (c.is_player) return c;
      return { ...c, initiative: rollD20(c.dex_mod ?? 0) };
    });
    onUpdateCombatants(sortCombatants(rolled));
    setCurrentTurnIndex(0);
    setNotice({
      id: Date.now(),
      text: '🎲 Iniciativa lanzada para monstruos y NPCs (1d20 + mod. DEST).',
    });
  };

  /** Retrocede el turno (y descuenta ronda si retrocede al final de la lista). */
  const handlePrevTurn = () => {
    if (combatants.length === 0) return;
    if (currentTurnIndex === 0) {
      if (round > 1) {
        setRound(prev => prev - 1);
        setCurrentTurnIndex(combatants.length - 1);
      }
    } else {
      setCurrentTurnIndex(prev => prev - 1);
    }
  };

  /** Avanza el turno; al cerrar la ronda descuenta los temporizadores. */
  const handleNextTurn = () => {
    if (combatants.length === 0) return;

    const wrapped = currentTurnIndex >= combatants.length - 1;
    const nextIndex = wrapped ? 0 : currentTurnIndex + 1;

    if (wrapped) {
      setCurrentTurnIndex(0);
      setRound(prev => prev + 1);

      // Temporizadores de condiciones: -1 ronda al empezar la ronda siguiente.
      const expired: string[] = [];
      let touched = false;
      const updated = combatants.map(c => {
        const rounds = c.condition_rounds;
        if (!rounds) return c;
        touched = true;
        const nextRounds: Record<string, number | null> = {};
        const kept: string[] = [];
        for (const cond of c.conditions) {
          const left = rounds[cond];
          if (left === undefined || left === null) {
            nextRounds[cond] = left ?? null;
            kept.push(cond);
            continue;
          }
          if (left <= 1) {
            expired.push(`${c.name}: ${cond}`);
            continue;
          }
          nextRounds[cond] = left - 1;
          kept.push(cond);
        }
        return { ...c, conditions: kept, condition_rounds: nextRounds };
      });

      if (touched) onUpdateCombatants(updated);
      if (expired.length) {
        setNotice({ id: Date.now(), text: `⏳ Caducó → ${expired.join(' • ')}` });
      }
    } else {
      setCurrentTurnIndex(prev => prev + 1);
    }

    // Recordatorio al inicio del turno: condiciones por caducar y concentración.
    const acting = combatants[nextIndex];
    if (acting && acting.conditions.length > 0) {
      const expiringSoon = acting.conditions.filter(
        cond => acting.condition_rounds?.[cond] === 1
      );
      const concentrating = acting.conditions.includes('Concentración');
      const parts: string[] = [];
      if (expiringSoon.length) parts.push(`${expiringSoon.join(', ')} → caduca al final de su turno`);
      if (concentrating) parts.push('¿sigue manteniendo la concentración?');
      if (parts.length) {
        setNotice({
          id: Date.now(),
          text: `⏰ ${acting.name}: ${parts.join(' • ')}`,
        });
      }
    }
  };

  const handleResetCombat = () => {
    setCurrentTurnIndex(0);
    setRound(1);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;      const newCombatant: Combatant = {
        id: `comb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newName,
      initiative: Number(newInitiative),
      hp_current: Number(newHp),
      hp_max: Number(newHp),
      ac: Number(newAc),
      is_player: isPlayer,
      conditions: [],
      condition_rounds: {},
      ...(isPlayer ? {} : { dex_mod: Number(newDexMod) || 0 }),
    };

    const updated = sortCombatants([...combatants, newCombatant]);
    onUpdateCombatants(updated);
    toast.success(`${newName} añadido a la escena.`);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleImportMonster = (monster: Monster) => {
    const imported = monsterToCombatant(monster);

    const updated = sortCombatants([...combatants, imported]);
    onUpdateCombatants(updated);
    toast.success(`${imported.name} añadido a la escena.`);
  };

  const handleImportNpc = (npc: NPC) => {
    const imported = npcToCombatant(npc);

    const updated = sortCombatants([...combatants, imported]);
    onUpdateCombatants(updated);
    toast.success(`${imported.name} añadido a la escena.`);
  };

  const handleHpChange = (id: string, delta: number) => {
    const target = combatants.find(c => c.id === id);
    if (!target) return;

    const nextHp = Math.max(0, Math.min(target.hp_max, target.hp_current + delta));
    const applied = nextHp - target.hp_current;
    if (applied === 0) return;

    onUpdateCombatants(
      combatants.map(c => (c.id === id ? { ...c, hp_current: nextHp } : c))
    );

    // Floater "+5" / "-5" para feedback inmediato del cambio de vida.
    const key = Date.now();
    setFloaters(prev => ({ ...prev, [id]: { amount: applied, key } }));
    clearTimeout(floaterTimers.current[id]);
    floaterTimers.current[id] = setTimeout(() => {
      setFloaters(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 900);
  };

  const handleApplyCustomHp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hpModalCombatant) return;
    const val = parseInt(hpModalAmount, 10);
    if (isNaN(val) || val <= 0) return;

    const target = combatants.find(c => c.id === hpModalCombatant.id);
    if (!target) return;

    let nextCurrent = target.hp_current;
    let nextTemp = target.hp_temp || 0;
    let netChange = 0;

    if (hpModalTab === 'damage') {
      let remainingDamage = val;
      // D&D 5e: el daño se descuenta primero de los PV temporales
      if (nextTemp > 0) {
        if (remainingDamage >= nextTemp) {
          remainingDamage -= nextTemp;
          nextTemp = 0;
        } else {
          nextTemp -= remainingDamage;
          remainingDamage = 0;
        }
      }
      if (remainingDamage > 0) {
        const prevHp = nextCurrent;
        nextCurrent = Math.max(0, nextCurrent - remainingDamage);
        netChange = nextCurrent - prevHp;
      }
      if (netChange === 0 && val > 0) {
        netChange = -val; // Mostramos el daño absorbido o aplicado
      }
    } else if (hpModalTab === 'heal') {
      const prevHp = nextCurrent;
      nextCurrent = Math.min(target.hp_max, nextCurrent + val);
      netChange = nextCurrent - prevHp;
    } else if (hpModalTab === 'temp') {
      // D&D 5e: los PV temporales no se acumulan, se reemplazan si el nuevo valor es mayor o deseado
      nextTemp = val;
      netChange = val;
    }

    onUpdateCombatants(
      combatants.map(c =>
        c.id === target.id ? { ...c, hp_current: nextCurrent, hp_temp: nextTemp } : c
      )
    );

    const key = Date.now();
    setFloaters(prev => ({ ...prev, [target.id]: { amount: hpModalTab === 'damage' ? -Math.abs(val) : netChange, key } }));
    clearTimeout(floaterTimers.current[target.id]);
    floaterTimers.current[target.id] = setTimeout(() => {
      setFloaters(prev => {
        const next = { ...prev };
        delete next[target.id];
        return next;
      });
    }, 900);

    setHpModalCombatant(null);
    setHpModalAmount('');
  };

  const handleToggleCondition = (combatantId: string, condition: string) => {
    const updated = combatants.map(c => {
      if (c.id !== combatantId) return c;
      const hasCond = c.conditions.includes(condition);
      const rounds = { ...(c.condition_rounds ?? {}) };
      if (hasCond) {
        delete rounds[condition];
        return { ...c, conditions: c.conditions.filter(item => item !== condition), condition_rounds: rounds };
      }
      rounds[condition] = DEFAULT_ROUNDS;
      return { ...c, conditions: [...c.conditions, condition], condition_rounds: rounds };
    });
    onUpdateCombatants(updated);
  };

  /** Cicla la duración restante: 3 → 1 → 2 → 4 → 5 → 10 → hasta salvar. */
  const handleCycleDuration = (combatantId: string, condition: string) => {
    const updated = combatants.map(c => {
      if (c.id !== combatantId) return c;
      const rounds = { ...(c.condition_rounds ?? {}) };
      const current = rounds[condition] ?? null;
      const idx = DURATION_CYCLE.indexOf(current);
      rounds[condition] = DURATION_CYCLE[(idx + 1) % DURATION_CYCLE.length];
      return { ...c, condition_rounds: rounds };
    });
    onUpdateCombatants(updated);
  };

  const handleRemoveCombatant = (id: string) => {
    const target = combatants.find(c => c.id === id);
    if (!target) return;
    if (!window.confirm(`¿Quitar a ${target.name} de la escena?`)) return;
    const updated = combatants.filter(c => c.id !== id);
    if (currentTurnIndex >= updated.length) {
      setCurrentTurnIndex(Math.max(0, updated.length - 1));
    }
    onUpdateCombatants(updated);
    toast.success(`${target.name} salió de la escena.`);
  };

  const resetForm = () => {
    setNewName('');
    setNewInitiative(10);
    setNewHp(10);
    setNewAc(10);
    setNewDexMod(0);
    setIsPlayer(false);
  };

  const currentTurnName = combatants[currentTurnIndex]?.name || 'Ninguno';

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Swords className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 flex-wrap">
              Rastreador de Iniciativa
              <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                Ronda {round}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {combatants.length} Combatientes registrados | Turno actual:{' '}
              <span className="text-amber-400 font-semibold">{currentTurnName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRollInitiative}
            disabled={combatants.length === 0}
            className="btn flex items-center gap-1.5 bg-dungeon-800 hover:bg-dungeon-700 text-amber-400 px-3 py-2 text-sm border border-dungeon-700 disabled:opacity-50"
            title="Tira 1d20 + mod. DEST para monstruos y NPCs y reordena la ronda"
          >
            <Dices className="w-4 h-4" />
            Lanzar Iniciativa
          </button>

          <div className="inline-flex rounded-lg shadow-sm border border-amber-500/40 overflow-hidden">
            <button
              onClick={handlePrevTurn}
              disabled={combatants.length === 0 || (round === 1 && currentTurnIndex === 0)}
              className="btn flex items-center gap-1 bg-dungeon-800 hover:bg-dungeon-700 text-slate-300 px-3 py-2 text-sm border-r border-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Turno Anterior"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            <button
              onClick={handleNextTurn}
              disabled={combatants.length === 0}
              className="btn btn-primary flex items-center gap-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              title="Siguiente Turno (Espacio o Enter)"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleResetCombat}
            className="btn btn-secondary flex items-center gap-1.5 px-3 py-2 text-sm"
            title="Reiniciar rondas y turnos"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            Reiniciar
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="btn flex items-center gap-1.5 bg-dungeon-800 hover:bg-dungeon-700 text-amber-400 px-3 py-2 text-sm border border-dungeon-700"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Importar Monstruo / NPC</span>
            <span className="sm:hidden">Importar</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-3 py-2 text-sm border border-amber-500/30"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Combatiente</span>
            <span className="sm:hidden">Nuevo</span>
          </button>

          <button
            onClick={handleToggleShare}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition ${
              shareStatus === 'live'
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-dungeon-800 hover:bg-dungeon-700 text-slate-300 border-dungeon-700'
            }`}
            title="Compartir el combate en vivo con los jugadores (vista de solo lectura en su móvil)"
          >
            <Share2 className="w-4 h-4" />
            {shareStatus === 'live' ? (
              <span className="hidden sm:inline">Compartiendo{viewerCount > 0 ? ` (${viewerCount})` : ''}</span>
            ) : (
              <span className="hidden sm:inline">Compartir</span>
            )}
            <span className="sm:hidden">{shareStatus === 'live' ? 'En vivo' : 'Compartir'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="btn btn-secondary flex items-center gap-1.5 px-3 py-2 text-sm"
            title="Ver el combate a pantalla completa (ideal para tablets del DM)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden lg:inline">
              {isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            </span>
          </button>
        </div>
      </div>

      {/* Panel de vista de jugadores en vivo */}
      {shareToken && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dungeon-900 border border-emerald-500/30 rounded-xl p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Radio className={`w-4 h-4 ${shareStatus === 'live' ? 'text-emerald-400 animate-pulse' : shareStatus === 'error' ? 'text-red-400' : 'text-amber-400'}`} />
              <h3 className="text-sm font-bold text-slate-100">Vista de jugadores en vivo</h3>
              <span className={`text-micro font-semibold px-2 py-0.5 rounded border ${
                shareStatus === 'live'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : shareStatus === 'error'
                    ? 'bg-red-500/15 text-red-300 border-red-500/40'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              }`}>
                {shareStatus === 'live'
                  ? `En vivo${viewerCount > 0 ? ` · ${viewerCount} conectado${viewerCount === 1 ? '' : 's'}` : ''}`
                  : shareStatus === 'error' ? 'Sin conexión' : 'Conectando…'}
              </span>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideEnemyHp}
                onChange={e => setHideEnemyHp(e.target.checked)}
                className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
              />
              {hideEnemyHp ? <EyeOff className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
              Ocultar HP exactos de enemigos
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2 flex-1 bg-dungeon-950 border border-dungeon-800 rounded-lg px-3 py-2 min-w-0">
              <Link2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input
                readOnly
                value={buildShareUrl(shareToken)}
                onFocus={e => e.currentTarget.select()}
                aria-label="Enlace de vista de jugadores"
                className="flex-1 min-w-0 bg-transparent text-xs text-slate-300 font-mono focus:outline-none"
              />
            </div>
            <button
              onClick={handleCopyShareLink}
              className="btn flex items-center justify-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-3 py-2 shrink-0 min-h-[40px]"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copiado' : 'Copiar enlace'}
            </button>
          </div>

          <p className="text-micro text-slate-500">
            Los jugadores abren el enlace en su móvil y ven la iniciativa, el turno, las condiciones y las barras de vida en tiempo real. No pueden editar nada.
          </p>
        </motion.div>
      )}

      {/* Aviso de temporizadores / tiradas */}
      <AnimatePresence>
        {notice && (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2"
            role="status"
          >
            <Timer className="w-4 h-4 shrink-0" />
            {notice.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combatants List */}
      {combatants.length === 0 ? (
        <div className="text-center py-16 bg-dungeon-900/50 border border-dashed border-dungeon-800 rounded-xl">
          <Skull className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No hay combatientes en escena</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Agrega jugadores o importa monstruos desde tu compendio para comenzar la secuencia de combate.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="btn btn-primary text-sm"
            >
              Importar del Compendio
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {combatants.map((c, index) => {
              const isActive = index === currentTurnIndex;
              const defeated = c.hp_current <= 0;
              const hpPercent = Math.max(0, Math.min(100, Math.round((c.hp_current / c.hp_max) * 100)));
              const floater = floaters[c.id];

              return (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: defeated ? 0.55 : 1, y: 0, filter: defeated ? 'grayscale(1)' : 'grayscale(0)' }}
                  exit={{ opacity: 0, x: -24, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className={`relative rounded-xl border transition-all duration-200 overflow-hidden ${
                    isActive
                      ? 'bg-dungeon-850 border-amber-500/80 ring-1 ring-amber-500/50 shadow-xl'
                      : c.is_player
                        ? 'bg-dungeon-900 border-blue-500/35 hover:border-blue-400/60'
                        : 'bg-dungeon-900 border-red-500/35 hover:border-red-400/60'
                  }`}
                >
                  {/* Turn indicator bar: se desliza de una fila a otra */}
                  {isActive && (
                    <motion.span
                      layoutId="turn-indicator"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-amber-600"
                    />
                  )}

                  <div className="p-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                    {/* Left info */}
                    <div className="flex items-center gap-4 min-w-[170px] flex-1 sm:flex-none">
                      <div className="flex flex-col items-center justify-center bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 min-w-[50px]">
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">INIT</span>
                        <motion.span
                          key={c.initiative}
                          initial={{ scale: 1.3, opacity: 0.4 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.25 }}
                          className="text-xl font-bold text-amber-400"
                        >
                          {c.initiative}
                        </motion.span>
                        {c.dex_mod !== undefined && !c.is_player && (
                          <span className="text-[9px] text-slate-500">1d20{c.dex_mod >= 0 ? `+${c.dex_mod}` : c.dex_mod}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-bold text-slate-100 text-lg truncate ${defeated ? 'line-through decoration-red-500/70' : ''}`}>
                            {c.name}
                          </h3>
                          {defeated && (
                            <span className="text-micro bg-slate-700/60 text-slate-300 font-semibold px-2 py-0.5 rounded border border-slate-600 uppercase tracking-wide">
                              Fuera de combate
                            </span>
                          )}
                          {c.is_player ? (
                            <span className="text-micro bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-500/30 flex items-center gap-1">
                              <UserCheck className="w-3 h-3" /> Jugador
                            </span>
                          ) : (
                            <span className="text-micro bg-red-500/20 text-red-300 font-semibold px-2 py-0.5 rounded border border-red-500/30 flex items-center gap-1">
                              <Skull className="w-3 h-3" /> Enemigo
                            </span>
                          )}
                          {isActive && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-micro bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase tracking-wide"
                            >
                              Turno
                            </motion.span>
                          )}
                        </div>

                        {/* Armor Class */}
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1 font-medium bg-dungeon-950 px-2 py-0.5 rounded border border-dungeon-800 text-slate-300">
                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                            AC: {c.ac}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* HP Controls */}
                    <div className="relative flex flex-col items-center gap-1 min-w-[170px] flex-1 max-w-xs">
                      <div className="flex items-center justify-between w-full text-xs font-semibold text-slate-300">
                        <button
                          type="button"
                          onClick={() => {
                            setHpModalCombatant(c);
                            setHpModalTab('damage');
                            setHpModalAmount('');
                          }}
                          className="btn flex items-center gap-1 text-red-400 hover:text-red-300 hover:underline"
                          title="Hacer clic para abrir la calculadora de daño/curación" aria-label="Abrir calculadora de daño y curación"
                        >
                          <Heart className="w-3.5 h-3.5 fill-red-400/20" /> HP:
                        </button>
                        <div className="flex items-center gap-1.5">
                          {c.hp_temp && c.hp_temp > 0 ? (
                            <span
                              className="text-micro bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1.5 py-0.5 rounded font-mono font-bold"
                              title="Puntos de golpe temporales"
                            >
                              +{c.hp_temp} temp
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              setHpModalCombatant(c);
                              setHpModalTab('damage');
                              setHpModalAmount('');
                            }}
                            className="btn flex items-center overflow-hidden hover:text-amber-300 font-mono"
                            title="Haz clic para modificar daño/curación"
                          >
                            <AnimatePresence mode="popLayout" initial={false}>
                              <motion.span
                                key={`${c.hp_current}-${c.hp_temp || 0}`}
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 10, opacity: 0 }}
                                transition={{ duration: 0.16 }}
                              >
                                {c.hp_current} / {c.hp_max}
                              </motion.span>
                            </AnimatePresence>
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar con códigos de color de alto contraste (verde > 50%, amarillo 25-50%, rojo < 25%) */}
                      <div className="w-full bg-dungeon-950 h-2.5 rounded-full overflow-hidden border border-dungeon-800 relative">
                        <motion.div
                          className={`h-full transition-colors ${
                            hpPercent > 50
                              ? 'bg-emerald-500'
                              : hpPercent >= 25
                                ? 'bg-amber-400'
                                : hpPercent > 0
                                  ? 'bg-red-500'
                                  : 'bg-slate-700'
                          }`}
                          initial={false}
                          animate={{ width: `${hpPercent}%` }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                        />
                      </div>

                      {/* Quick HP Adjustment Buttons (área táctil >= 44px en móvil) + botón para daño personalizado */}
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          onClick={() => handleHpChange(c.id, -5)}
                          aria-label={`Restar 5 PV a ${c.name}`}
                          className="btn bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 border border-red-500/20 min-w-[38px] min-h-[44px] sm:min-h-[36px] sm:min-w-[36px]"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => handleHpChange(c.id, -1)}
                          aria-label={`Restar 1 PV a ${c.name}`}
                          className="btn bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 border border-red-500/20 min-w-[38px] min-h-[44px] sm:min-h-[36px] sm:min-w-[36px]"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleHpChange(c.id, 1)}
                          aria-label={`Sumar 1 PV a ${c.name}`}
                          className="btn bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 border border-emerald-500/20 min-w-[38px] min-h-[44px] sm:min-h-[36px] sm:min-w-[36px]"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleHpChange(c.id, 5)}
                          aria-label={`Sumar 5 PV a ${c.name}`}
                          className="btn bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 border border-emerald-500/20 min-w-[38px] min-h-[44px] sm:min-h-[36px] sm:min-w-[36px]"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHpModalCombatant(c);
                            setHpModalTab('damage');
                            setHpModalAmount('');
                          }}
                          aria-label={`Abrir cálculo personalizado de daño para ${c.name}`}
                          title="Daño / Curación / Temp exacto"
                          className="btn bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 font-black px-2 border border-amber-500/30 min-w-[38px] min-h-[44px] sm:min-h-[36px] sm:min-w-[36px]"
                        >
                          ±
                        </button>
                      </div>

                      {/* Floater de daño/curación */}
                      <AnimatePresence>
                        {floater && (
                          <motion.span
                            key={floater.key}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: -16 }}
                            exit={{ opacity: 0, y: -26 }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className={`absolute -top-1 right-0 text-sm font-black pointer-events-none ${
                              floater.amount < 0 ? 'text-red-400' : 'text-emerald-400'
                            }`}
                          >
                            {floater.amount > 0 ? '+' : ''}
                            {floater.amount}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Conditions & Actions */}
                    <div className="flex items-start gap-2 flex-1 min-w-[200px] justify-end">
                      {/* Conditions Pill Selector + temporizador */}
                      <div className="flex flex-wrap gap-1 max-w-full sm:max-w-[280px] justify-start">
                        <AnimatePresence initial={false}>
                          {c.conditions.map(cond => {
                            const rounds = c.condition_rounds?.[cond];
                            return (
                              <motion.span
                                key={cond}
                                layout
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                transition={{ duration: 0.15 }}
                                className="inline-flex items-center gap-1 text-micro bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded hover:bg-purple-900 transition"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleToggleCondition(c.id, cond)}
                                  title="Haz clic para remover la condición"
                                  className="btn hover:text-purple-100 inline-flex items-center gap-1"
                                >
                                  <span aria-hidden="true">{CONDITION_ICONS[cond] ?? '•'}</span>
                                  {cond}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCycleDuration(c.id, cond)}
                                  title="Clic para cambiar las rondas restantes"
                                  className={`inline-flex items-center gap-0.5 font-bold pl-1 border-l border-purple-800 ${
                                    rounds == null ? 'text-slate-400' : 'text-amber-400'
                                  }`}
                                >
                                  <Timer className="w-2.5 h-2.5" />
                                  {rounds == null ? '∞' : rounds}
                                </button>
                              </motion.span>
                            );
                          })}
                        </AnimatePresence>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleToggleCondition(c.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="bg-dungeon-950 border border-dungeon-800 text-slate-400 text-xs rounded px-1.5 py-1 min-h-[34px] focus:outline-none focus:border-amber-500"
                          defaultValue=""
                          aria-label={`Añadir estado a ${c.name}`}
                        >
                          <option value="" disabled>+ Estado</option>
                          {AVAILABLE_CONDITIONS.map(cond => (
                            <option key={cond} value={cond}>
                              {cond}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleRemoveCombatant(c.id)}
                        className="btn btn-icon text-slate-400 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                        title="Eliminar de la iniciativa" aria-label="Eliminar de la iniciativa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* MODAL 1: Create Custom Combatant */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100 border-b border-dungeon-800 pb-2">
              Agregar Nuevo Combatiente
            </h3>

            <form onSubmit={handleAddCustom} className="space-y-3">
              <div>
                <label className="label">Nombre</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ej: Aragorn / Goblin Asesino"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Iniciativa</label>
                  <input
                    type="number"
                    required
                    value={newInitiative}
                    onChange={e => setNewInitiative(Number(e.target.value))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">HP Máximo</label>
                  <input
                    type="number"
                    required
                    value={newHp}
                    onChange={e => setNewHp(Number(e.target.value))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">AC</label>
                  <input
                    type="number"
                    required
                    value={newAc}
                    onChange={e => setNewAc(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  Modificador de Destreza (para lanzar iniciativa)
                </label>
                <input
                  type="number"
                  value={newDexMod}
                  onChange={e => setNewDexMod(Number(e.target.value))}
                  disabled={isPlayer}
                  className="input disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPlayerCheck"
                  checked={isPlayer}
                  onChange={e => setIsPlayer(e.target.checked)}
                  className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="isPlayerCheck" className="text-sm text-slate-300 cursor-pointer">
                  ¿Es un personaje jugador (PC)?
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-dungeon-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn px-4 py-2 text-sm text-slate-400 hover:bg-dungeon-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-sm"
                >
                  Agregar Combatiente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Import from Monster / NPC Database */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-dungeon-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Importar al Combate desde la Base de Datos
              </h3>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportSearchTerm('');
                }}
                className="btn text-slate-500 hover:text-slate-300 text-sm" aria-label="Cerrar importación"
              >
                ✕
              </button>
            </div>

            {/* Buscador de monstruos y NPCs */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={importSearchTerm}
                onChange={e => setImportSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, tipo, raza o CR..."
                className="input pl-9 pr-8 py-2 text-xs placeholder-slate-500 outline-none transition"
                autoFocus
              />
              {importSearchTerm && (
                <button
                  type="button"
                  onClick={() => setImportSearchTerm('')}
                  className="btn absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" aria-label="Borrar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            {(() => {
              const term = importSearchTerm.trim().toLowerCase();
              const isCustomMon = (m: Monster) => Boolean(m.isCustom || m.id.startsWith('mon-') || m.id.startsWith('custom-'));
              const filteredMonsters = monsters
                .filter(m => !term || m.name.toLowerCase().includes(term) || m.type.toLowerCase().includes(term) || m.cr.toLowerCase().includes(term))
                .sort((a, b) => {
                  const aC = isCustomMon(a);
                  const bC = isCustomMon(b);
                  if (aC && !bC) return -1;
                  if (!aC && bC) return 1;
                  return a.name.localeCompare(b.name);
                });
              const filteredNpcs = npcs.filter(n => !term || n.name.toLowerCase().includes(term) || n.race.toLowerCase().includes(term) || n.disposition.toLowerCase().includes(term));

              return (
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">
                  Monstruos Disponibles ({filteredMonsters.length})
                </h4>
                <div className="space-y-2">
                  {filteredMonsters.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 italic text-center">No se encontraron monstruos con esa búsqueda.</p>
                  ) : (
                    filteredMonsters.map(m => (
                    <div
                      key={m.id}
                      className="bg-dungeon-950 border border-dungeon-800 hover:border-amber-500/50 rounded-lg p-3 flex items-center justify-between gap-2 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 text-sm truncate block">{m.name}</span>
                          {isCustomMon(m) && (
                            <span className="text-micro bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded font-semibold">
                              Creado
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                          <span>CR: {m.cr}</span>
                          <span>AC: {m.ac}</span>
                          <span>HP: {m.hp_max}</span>
                          <span className="text-amber-400">
                            DEST {m.stats.dex} ({formatMod(m.stats.dex)})
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleImportMonster(m)}
                        className="btn bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 px-3 py-1.5 shrink-0"
                      >
                        + Añadir al Combate
                      </button>
                    </div>
                  )))}
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">
                  NPCs Registrados ({filteredNpcs.length})
                </h4>
                <div className="space-y-2">
                  {filteredNpcs.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 italic text-center">No se encontraron NPCs con esa búsqueda.</p>
                  ) : (
                    filteredNpcs.map(n => (
                    <div
                      key={n.id}
                      className="bg-dungeon-950 border border-dungeon-800 hover:border-amber-500/50 rounded-lg p-3 flex items-center justify-between gap-2 transition"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-slate-200 text-sm truncate block">{n.name}</span>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {n.race} • {n.disposition}
                        </div>
                      </div>
                      <button
                        onClick={() => handleImportNpc(n)}
                        className="btn bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 px-3 py-1.5 shrink-0"
                      >
                        + Añadir al Combate
                      </button>
                    </div>
                  )))}
                </div>
              </div>
            </div>
              );
            })()}

            <div className="flex justify-end pt-3 border-t border-dungeon-800">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="btn bg-dungeon-800 text-slate-300 px-4 py-2 text-sm hover:bg-dungeon-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Daño / Curación / PV Temporales */}
      {hpModalCombatant && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-dungeon-900 border border-amber-500/30 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-dungeon-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  {hpModalCombatant.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Actual: <strong className="text-slate-200">{hpModalCombatant.hp_current}</strong> / {hpModalCombatant.hp_max} PV
                  {hpModalCombatant.hp_temp ? (
                    <span className="text-sky-300 ml-1.5">(+{hpModalCombatant.hp_temp} temp)</span>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHpModalCombatant(null)}
                className="btn text-slate-400 hover:text-slate-200 text-lg p-1" aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Selector de modo */}
            <div className="grid grid-cols-3 gap-1 bg-dungeon-950 p-1 rounded-lg border border-dungeon-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setHpModalTab('damage')}
                className={`py-1.5 rounded transition ${
                  hpModalTab === 'damage'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚔️ Daño
              </button>
              <button
                type="button"
                onClick={() => setHpModalTab('heal')}
                className={`py-1.5 rounded transition ${
                  hpModalTab === 'heal'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ✨ Curar
              </button>
              <button
                type="button"
                onClick={() => setHpModalTab('temp')}
                className={`py-1.5 rounded transition ${
                  hpModalTab === 'temp'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🛡️ Temp HP
              </button>
            </div>

            <form onSubmit={handleApplyCustomHp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {hpModalTab === 'damage' && 'Cantidad de Daño recibido:'}
                  {hpModalTab === 'heal' && 'Puntos de Curación a restaurar:'}
                  {hpModalTab === 'temp' && 'Puntos de Golpe Temporales:'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    autoFocus
                    placeholder="Ej. 12"
                    value={hpModalAmount}
                    onChange={e => setHpModalAmount(e.target.value)}
                    className="w-full bg-dungeon-950 border border-dungeon-750 focus:border-amber-500 rounded-lg px-3 py-2 text-lg font-mono text-slate-100 focus:outline-none"
                  />
                </div>
                {hpModalTab === 'damage' && hpModalCombatant.hp_temp ? (
                  <p className="text-micro text-sky-400 mt-1">
                    ℹ️ Los primeros {hpModalCombatant.hp_temp} de daño se absorberán con los PV temporales.
                  </p>
                ) : null}
              </div>

              {/* Botones rápidos numéricos */}
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 15, 20].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setHpModalAmount(String(n))}
                    className="btn bg-dungeon-950 hover:bg-dungeon-800 border border-dungeon-800 text-slate-300 py-1.5"
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-dungeon-800">
                <button
                  type="button"
                  onClick={() => setHpModalCombatant(null)}
                  className="btn flex-1 bg-dungeon-800 hover:bg-dungeon-700 text-slate-300 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!hpModalAmount || parseInt(hpModalAmount, 10) <= 0}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    hpModalTab === 'damage'
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : hpModalTab === 'heal'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-sky-700 hover:bg-sky-800 text-white'
                  }`}
                >
                  {hpModalTab === 'damage' && 'Aplicar Daño'}
                  {hpModalTab === 'heal' && 'Aplicar Curación'}
                  {hpModalTab === 'temp' && 'Fijar PV Temp'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
