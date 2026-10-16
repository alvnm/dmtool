/**
 * Compartir el combate con los jugadores en tiempo real.
 *
 * Transporte: canales **Broadcast** de Supabase Realtime (sin esquema SQL y sin
 * tablas nuevas). El DM publica el estado del combate en un canal cuyo nombre
 * incluye un token aleatorio; los jugadores se suscriben desde un enlace
 * `/combat?s=<token>` y reciben cada cambio al instante.
 *
 * Seguridad:
 *  - El token es aleatorio (128 bits) y sólo autoriza ESTE canal: no da acceso
 *    a ningún dato de la base de datos (las tablas siguen protegidas por RLS).
 *  - El enlace sólo lleva URL + clave pública de Supabase cuando la app corre
 *    en "modo pegado en Ajustes"; `isPublicKey` rechaza cualquier clave
 *    secreta antes de construir el enlace.
 *  - Los HP exactos de los enemigos pueden ocultarse (`hideEnemyHp`): los
 *    jugadores ven la barra de vida, pero no el número.
 */
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Combatant } from '@/types';
import { readStorage, writeStorage } from '@/lib/usePersistentState';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getRemoteConfig } from '@/lib/supabase/remoteConfig';

export const COMBAT_SHARE_EVENT = 'combat:state';
export const COMBAT_SYNC_EVENT = 'combat:sync';

const SHARE_TOKEN_KEY = 'combat-share-token';
const CHANNEL_PREFIX = 'dm-combat-share';

/** Combatante tal como lo ven los jugadores (HP de enemigo puede ir oculto). */
export interface PlayerCombatant {
  id: string;
  name: string;
  initiative: number;
  hp_max: number;
  /** `null` cuando el DM oculta la vida exacta de los enemigos. */
  hp_current: number | null;
  ac: number;
  is_player: boolean;
  conditions: string[];
  condition_rounds?: Record<string, number | null>;
}

/** Estado completo del combate publicado por el DM. */
export interface SharedCombatState {
  v: 1;
  round: number;
  turnIndex: number;
  hideEnemyHp: boolean;
  combatants: PlayerCombatant[];
  updatedAt: number;
}

export interface ShareSource {
  combatants: Combatant[];
  round: number;
  turnIndex: number;
  hideEnemyHp: boolean;
}

/** Genera un token aleatorio de 128 bits en hexadecimal. */
export function generateShareToken(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback solo posible en entornos sin WebCrypto (no debería ocurrir).
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/** Token estable por navegador: compartir no cambia el enlace entre sesiones. */
export function getOrCreateShareToken(): string {
  const existing = readStorage<string | null>(SHARE_TOKEN_KEY, null);
  if (existing && /^[a-f0-9]{32}$/.test(existing)) return existing;
  const token = generateShareToken();
  writeStorage(SHARE_TOKEN_KEY, token);
  return token;
}

export function combatChannelName(token: string): string {
  return `${CHANNEL_PREFIX}:${token}`;
}

/** Reduce el estado interno del DM a lo que los jugadores deben ver. */
export function sanitizeCombatState(source: ShareSource): SharedCombatState {
  return {
    v: 1,
    round: source.round,
    turnIndex: source.turnIndex,
    hideEnemyHp: source.hideEnemyHp,
    updatedAt: Date.now(),
    combatants: source.combatants.map(c => ({
      id: c.id,
      name: c.name,
      initiative: c.initiative,
      hp_max: c.hp_max,
      hp_current: source.hideEnemyHp && !c.is_player ? null : c.hp_current,
      ac: c.ac,
      is_player: c.is_player,
      conditions: c.conditions,
      condition_rounds: c.condition_rounds,
    })),
  };
}

/**
 * Enlace de vista de jugadores. Si la app no tiene variables de entorno de
 * Supabase (credenciales pegadas en Ajustes), se incrustan la URL y la clave
 * pública en el enlace para que los jugadores puedan conectarse.
 */
export function buildShareUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = new URL(`/combat`, origin || 'http://localhost:3000');
  url.searchParams.set('s', token);
  if (!isSupabaseConfigured()) {
    const config = getRemoteConfig();
    if (config) {
      url.searchParams.set('u', config.url);
      url.searchParams.set('k', config.anonKey);
    }
  }
  return url.toString();
}

/** Crea y suscribe un canal broadcast. El caller es responsable del cleanup. */
export function openCombatChannel(client: SupabaseClient, token: string): RealtimeChannel {
  return client.channel(combatChannelName(token), {
    config: { broadcast: { self: false } },
  });
}

/** Publica el estado actual del combate en el canal. */
export function broadcastCombatState(
  channel: RealtimeChannel | null,
  source: ShareSource
): void {
  if (!channel) return;
  channel.send({
    type: 'broadcast',
    event: COMBAT_SHARE_EVENT,
    payload: sanitizeCombatState(source),
  });
}

/** Valida un estado recibido por broadcast antes de pintarlo. */
export function isSharedCombatState(value: unknown): value is SharedCombatState {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<SharedCombatState>;
  return (
    s.v === 1 &&
    typeof s.round === 'number' &&
    typeof s.turnIndex === 'number' &&
    Array.isArray(s.combatants)
  );
}
