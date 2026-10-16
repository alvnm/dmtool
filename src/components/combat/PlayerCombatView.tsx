'use client';

/**
 * Vista de solo lectura del combate para los jugadores.
 *
 * Se suscribe al canal Broadcast del DM (token viajado en `?s=`) y pinta el
 * estado en vivo: iniciativa, turno, condiciones y barras de vida. No admite
 * ninguna edición; los HP exactos de los enemigos sólo se muestran si el DM
 * decidió no ocultarlos.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Swords, Shield, Heart, Wifi, WifiOff, Loader2, Users } from 'lucide-react';
import { CONDITION_ICONS } from '@/lib/conditions';
import {
  openCombatChannel,
  COMBAT_SYNC_EVENT,
  COMBAT_SHARE_EVENT,
  isSharedCombatState,
  type SharedCombatState,
} from '@/lib/combatShare';
import { isPublicKey } from '@/lib/supabase/keys';
import { supabase as envClient, isSupabaseConfigured } from '@/lib/supabase/client';

type LinkStatus = 'loading' | 'waiting' | 'live' | 'error';

interface ShareParams {
  token: string;
  url: string | null;
  key: string | null;
}

function readShareParams(): ShareParams | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('s');
  if (!token || !/^[a-f0-9]{32}$/.test(token)) return null;
  return { token, url: params.get('u'), key: params.get('k') };
}

function isPlausibleUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

/** Cliente para la vista pública: variables de entorno o credenciales del enlace. */
function resolveClient(params: ShareParams): SupabaseClient | null {
  if (params.url && params.key && isPublicKey(params.key) && isPlausibleUrl(params.url)) {
    return createClient(params.url, params.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  if (isSupabaseConfigured()) return envClient;
  return null;
}

export default function PlayerCombatView() {
  const [params, setParams] = useState<ShareParams | null>(null);
  const [status, setStatus] = useState<LinkStatus>('loading');
  const [state, setState] = useState<SharedCombatState | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  // Leer la URL en el cliente (evita depender de useSearchParams/Suspense).
  useEffect(() => {
    const parsed = readShareParams();
    setParams(parsed);
    if (!parsed) setStatus('error');
  }, []);

  useEffect(() => {
    if (!params) return;
    const client = resolveClient(params);
    if (!client) {
      setStatus('error');
      return;
    }

    let cancelled = false;
    const channel = openCombatChannel(client, params.token);
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    channel
      .on('broadcast', { event: COMBAT_SHARE_EVENT }, ({ payload }) => {
        if (cancelled || !isSharedCombatState(payload)) return;
        setState(payload);
        setLastUpdate(Date.now());
        setStatus('live');
      })
      .subscribe(subStatus => {
        if (cancelled) return;
        if (subStatus === 'SUBSCRIBED') {
          setStatus(prev => (prev === 'live' ? prev : 'waiting'));
          // Contar espectadores para el DM.
          channel.track({});
          // Pedir el estado actual: si el DM ya publica, responde al instante.
          channel.send({ type: 'broadcast', event: COMBAT_SYNC_EVENT, payload: {} });
        } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
          setStatus('error');
          // Reintento suave: el websocket de Supabase también reconecta solo.
          if (!retryTimer) {
            retryTimer = setTimeout(() => {
              if (!cancelled) channel.subscribe();
            }, 4000);
          }
        }
      });

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      client.removeChannel(channel);
    };
  }, [params]);

  // "Última actualización hace Ns" para detectar al DM desconectado.
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const secondsSinceUpdate = useMemo(() => {
    if (!lastUpdate) return null;
    return Math.round((Date.now() - lastUpdate) / 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdate, tick]);

  const activeCombatant = state && state.combatants[state.turnIndex];

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-dungeon-950 text-slate-100 flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </main>
    );
  }

  if (status === 'error' || !params) {
    return (
      <main className="min-h-screen bg-dungeon-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-3 bg-dungeon-900 border border-dungeon-800 rounded-xl p-6">
          <WifiOff className="w-10 h-10 text-red-400 mx-auto" />
          <h1 className="text-lg font-bold">Enlace de combate no válido</h1>
          <p className="text-sm text-slate-400">
            Pide al Dungeon Master que comparta el combate de nuevo y abre el enlace más
            reciente.
          </p>
        </div>
      </main>
    );
  }

  const isLive = status === 'live' && (secondsSinceUpdate ?? 999) < 30;

  return (
    <main className="min-h-screen bg-dungeon-950 text-slate-100 pb-10">
      {/* Cabecera */}
      <header className="bg-dungeon-900 border-b border-dungeon-800 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg flex items-center justify-center text-slate-950 shrink-0">
              <Swords className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-100 font-serif truncate">
                Vista de Combate
              </h1>
              <p className="text-[10px] text-slate-400">En vivo desde la mesa del DM</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {state && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-1 rounded border border-amber-500/30">
                Ronda {state.round}
              </span>
            )}
            <span
              className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border ${
                isLive
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              }`}
              title={
                secondsSinceUpdate != null
                  ? `Última actualización: hace ${secondsSinceUpdate}s`
                  : undefined
              }
            >
              {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isLive ? 'En vivo' : 'Reconectando…'}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {/* Turno actual destacado */}
        {activeCombatant ? (
          <div className="bg-dungeon-850 border border-amber-500/60 rounded-xl p-4 flex items-center justify-between gap-3 shadow-xl">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                Turno actual
              </p>
              <p className="text-xl font-black text-slate-100 truncate">
                {activeCombatant.name}
              </p>
            </div>
            <span
              className={`text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wide shrink-0 ${
                activeCombatant.is_player
                  ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40'
                  : 'bg-red-500/25 text-red-300 border border-red-500/40'
              }`}
            >
              {activeCombatant.is_player ? 'Aliado' : 'Enemigo'}
            </span>
          </div>
        ) : (
          <div className="bg-dungeon-900 border border-dashed border-dungeon-700 rounded-xl p-6 text-center text-sm text-slate-400">
            {status === 'waiting'
              ? 'Esperando a que el DM publique el combate…'
              : 'El DM aún no ha compartido ningún combate.'}
          </div>
        )}

        {/* Lista de combatientes */}
        {state && state.combatants.length > 0 && (
          <ul className="space-y-2.5">
            {state.combatants.map((c, index) => {
              const isActive = index === state.turnIndex;
              const defeated = c.hp_current !== null && c.hp_current <= 0;
              const hpPercent =
                c.hp_current === null
                  ? 100
                  : Math.max(0, Math.min(100, Math.round((c.hp_current / c.hp_max) * 100)));
              return (
                <li
                  key={c.id}
                  className={`relative rounded-xl border p-3.5 transition-colors ${
                    isActive
                      ? 'bg-dungeon-850 border-amber-500/80 ring-1 ring-amber-500/40'
                      : c.is_player
                        ? 'bg-dungeon-900 border-blue-500/35'
                        : 'bg-dungeon-900 border-red-500/35'
                  } ${defeated ? 'opacity-60 grayscale' : ''}`}
                >
                  {isActive && (
                    <span className="absolute top-0 left-0 bottom-0 w-1.5 rounded-l-xl bg-gradient-to-b from-amber-400 to-amber-600" />
                  )}

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center bg-dungeon-950 border border-dungeon-800 rounded-lg px-2 py-1 min-w-[46px]">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">
                        INI
                      </span>
                      <span className="text-lg font-bold text-amber-400">{c.initiative}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2
                          className={`font-bold text-slate-100 truncate ${
                            defeated ? 'line-through decoration-red-500/70' : ''
                          }`}
                        >
                          {c.name}
                        </h2>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                            c.is_player
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : 'bg-red-500/20 text-red-300 border-red-500/30'
                          }`}
                        >
                          {c.is_player ? 'PJ' : 'Enemigo'}
                        </span>
                        {isActive && (
                          <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase">
                            Turno
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-amber-400" /> AC {c.ac}
                        </span>
                      </div>

                      {/* Barra de vida (número oculto si el DM lo decidió) */}
                      <div className="mt-2 flex items-center gap-2">
                        <Heart className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <div className="flex-1 h-2.5 bg-dungeon-950 rounded-full overflow-hidden border border-dungeon-800">
                          <div
                            className={`h-full transition-all duration-500 ${
                              hpPercent > 50
                                ? 'bg-emerald-500'
                                : hpPercent > 20
                                  ? 'bg-amber-500'
                                  : 'bg-red-600'
                            }`}
                            style={{ width: `${hpPercent}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-300 tabular-nums w-16 text-right">
                          {c.hp_current === null
                            ? `${c.hp_max} máx.`
                            : `${c.hp_current} / ${c.hp_max}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Condiciones con iconos */}
                  {c.conditions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 sm:pl-[58px]">
                      {c.conditions.map(cond => {
                        const rounds = c.condition_rounds?.[cond];
                        return (
                          <span
                            key={cond}
                            className="inline-flex items-center gap-1 text-[10px] bg-purple-950/80 text-purple-300 border border-purple-800 px-2 py-1 rounded"
                          >
                            <span aria-hidden="true">{CONDITION_ICONS[cond] ?? '•'}</span>
                            {cond}
                            <span
                              className={`font-bold ${
                                rounds == null ? 'text-slate-400' : 'text-amber-400'
                              }`}
                            >
                              {rounds == null ? '∞' : `${rounds}↺`}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Estado de la conexión */}
        {state && secondsSinceUpdate != null && secondsSinceUpdate >= 30 && (
          <p className="text-center text-xs text-amber-300/80 flex items-center justify-center gap-1.5 pt-1">
            <Users className="w-3.5 h-3.5" />
            Sin actualizaciones del DM desde hace {secondsSinceUpdate}s. Esta vista se
            refrescará sola cuando vuelva a moverse el combate.
          </p>
        )}
      </div>
    </main>
  );
}
