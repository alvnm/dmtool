'use client';

/**
 * Estado de datos de la campaña + conexión con Supabase / compendio SRD.
 *
 * Extraído de MainApp (antes ~150 líneas de estado, cargas y fusiones
 * mezcladas con la UI). Reglas que centraliza este hook:
 *
 *  1. **Nunca se reemplaza una lista local completa**: la nube y el compendio
 *     SRD se *fusionan* encima de lo local, así los datos predeterminados y
 *     los cambios del DM sobreviven a un refresco y a una carga desde nube.
 *  2. **Todo dato de campaña se persiste en localStorage** (incluidos
 *     bestiario y grimorio personalizados, que antes se perdían al recargar).
 *  3. **El estado de sincronización es honesto**: refleja la descarga real
 *     desde Supabase; el resto de cambios viven en este navegador (respaldo
 *     JSON desde Ajustes).
 */
import { useCallback, useEffect, useState } from 'react';
import { getSupabase, isCloudConfigured } from '@/lib/supabase/client';
import {
  usePersistentState,
  readStorage,
  writeStorage,
  STORAGE_ERROR_EVENT,
} from '@/lib/usePersistentState';
import { loadBestiary, loadGrimoire, mergeById, unionById } from '@/lib/compendium';
import {
  INITIAL_COMBATANTS,
  INITIAL_ITEMS,
  INITIAL_MONSTERS,
  INITIAL_NPCS,
  INITIAL_NOTES,
  INITIAL_SPELLS,
} from '@/lib/mockData';
import {
  AuditLogEntry,
  Combatant,
  DMNote,
  InventoryItem,
  Monster,
  NPC,
  PartyMember,
  Spell,
} from '@/types';
import {
  buildCampaign,
  downloadCampaign,
  STORAGE_KEYS,
  type CampaignData,
  type CampaignExport,
} from '@/lib/campaign';

/**
 * Estado de la nube:
 *  - `idle`: aún no se ha intentado la primera descarga.
 *  - `saving`: descarga en curso.
 *  - `saved`: descarga completada sin errores.
 *  - `error`: no se pudo contactar (red, credenciales o RLS).
 */
export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface CampaignDataApi {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  combatants: Combatant[];
  setCombatants: React.Dispatch<React.SetStateAction<Combatant[]>>;
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  monsters: Monster[];
  setMonsters: React.Dispatch<React.SetStateAction<Monster[]>>;
  npcs: NPC[];
  setNpcs: React.Dispatch<React.SetStateAction<NPC[]>>;
  spells: Spell[];
  setSpells: React.Dispatch<React.SetStateAction<Spell[]>>;
  notes: DMNote[];
  setNotes: React.Dispatch<React.SetStateAction<DMNote[]>>;
  party: PartyMember[];
  setParty: React.Dispatch<React.SetStateAction<PartyMember[]>>;
  auditLog: AuditLogEntry[];
  setAuditLog: React.Dispatch<React.SetStateAction<AuditLogEntry[]>>;
  logEvent: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  supabaseActive: boolean;
  userEmail: string | null;
  /** Descarga inicial (compendio SRD + nube) todavía en curso. */
  initialLoading: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  storageAlert: string | null;
  dismissStorageAlert: () => void;
  /** Snapshot de la campaña para el modal de Ajustes (sin descargar). */
  getCampaign: () => CampaignExport;
  /** Descarga la campaña como JSON (botón / Ctrl+S). */
  exportCampaign: () => void;
  /** Aplica una campaña importada desde JSON. */
  importCampaign: (data: CampaignData) => void;
  /** La conexión cambió en Ajustes: recarga datos y estado de sesión. */
  reloadConnection: () => void;
}

export function useCampaignData(): CampaignDataApi {
  // La pestaña activa también se recuerda: si el DM refresca a mitad de combate
  // vuelve justo donde estaba.
  const [activeTab, setActiveTab] = usePersistentState<string>(STORAGE_KEYS.activeTab, 'dashboard');

  // Conexión con la nube
  const [initialLoading, setInitialLoading] = useState(true);
  const [supabaseActive, setSupabaseActive] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  // Cambia cuando el DM guarda/borra credenciales en el modal de ajustes.
  const [configVersion, setConfigVersion] = useState(0);
  const [storageAlert, setStorageAlert] = useState<string | null>(null);

  // Datos de la campaña (persistidos: la sesión local sobrevive a un refresco)
  // En un dispositivo nuevo o limpio, arrancan vacíos a menos que haya datos guardados.
  const [combatants, setCombatants] = usePersistentState<Combatant[]>(STORAGE_KEYS.combatants, []);
  const [items, setItems] = usePersistentState<InventoryItem[]>(STORAGE_KEYS.items, []);
  const [monsters, setMonsters] = usePersistentState<Monster[]>(STORAGE_KEYS.monsters, []);
  const [npcs, setNpcs] = usePersistentState<NPC[]>(STORAGE_KEYS.npcs, []);
  const [spells, setSpells] = usePersistentState<Spell[]>(STORAGE_KEYS.spells, []);
  const [notes, setNotes] = usePersistentState<DMNote[]>(STORAGE_KEYS.notes, []);
  const [party, setParty] = usePersistentState<PartyMember[]>(STORAGE_KEYS.party, []);
  const [auditLog, setAuditLog] = usePersistentState<AuditLogEntry[]>(STORAGE_KEYS.auditLog, []);

  const logEvent = useCallback(
    (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
      const newEntry: AuditLogEntry = {
        ...entry,
        id: String(Date.now() + Math.random()),
        timestamp: new Date().toISOString(),
      };
      setAuditLog((prev) => [newEntry, ...prev.slice(0, 99)]);
    },
    [setAuditLog]
  );

  // Escuchar errores de cuota de localStorage.
  useEffect(() => {
    const handleStorageError = (e: Event) => {
      const custom = e as CustomEvent<{ message: string }>;
      setStorageAlert(custom.detail?.message || 'Espacio local agotado. Descarga un respaldo JSON.');
    };
    window.addEventListener(STORAGE_ERROR_EVENT, handleStorageError);
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, handleStorageError);
  }, []);

  /**
   * Bestiario + grimorio SRD (data/compendium) como base local.
   * Se FUSIONAN con lo local: nunca sustituyen lo que el DM ya tiene
   * (antes `setMonsters(bestiary)` borraba los monstruos personalizados).
   */
  const loadCompendium = useCallback(async () => {
    try {
      const [bestiary, grimoire] = await Promise.all([loadBestiary(), loadGrimoire()]);
      if (bestiary.length) setMonsters(prev => mergeById(prev, bestiary));
      if (grimoire.length) setSpells(prev => mergeById(prev, grimoire));
    } catch (err) {
      // Sin compendio generado la app sigue con los datos de ejemplo.
      console.warn('Compendio no disponible, se usan datos de ejemplo:', err);
    }
  }, [setMonsters, setSpells]);

  /**
   * Descarga las filas propias del usuario desde Supabase y las fusiona
   * con lo local (lo local manda; las filas nuevas de la nube se añaden).
   */
  const loadDataFromSupabase = useCallback(async () => {
    const client = getSupabase();
    setSyncStatus('saving');
    setSyncError(null);
    try {
      const [monRes, spellRes, npcRes, itemRes, combRes, noteRes] = await Promise.all([
        client.from('monsters').select('*'),
        client.from('spells').select('*'),
        client.from('npcs').select('*'),
        client.from('items').select('*'),
        client.from('initiative_combatants').select('*'),
        client.from('dm_notes').select('*'),
      ]);

      // Fusión sin borrar: lo local se conserva y la nube aporta lo que falte.
      if (monRes.data?.length) setMonsters(prev => mergeById(prev, monRes.data!));
      if (spellRes.data?.length) setSpells(prev => mergeById(prev, spellRes.data!));
      if (npcRes.data?.length) setNpcs(prev => mergeById(prev, npcRes.data!));
      if (itemRes.data?.length) setItems(prev => mergeById(prev, itemRes.data!));
      // Combatientes y notas pueden llevar nombres/títulos repetidos
      // legítimamente: se fusionan solo por identificador.
      if (combRes.data?.length) setCombatants(prev => unionById(prev, combRes.data!));
      if (noteRes.data?.length) setNotes(prev => unionById(prev, noteRes.data!));

      const failed = [monRes, spellRes, npcRes, itemRes, combRes, noteRes].find(r => r.error);
      if (failed) {
        setSyncStatus('error');
        setSyncError(failed.error!.message);
      } else {
        setSyncStatus('saved');
      }
    } catch (err) {
      setSyncStatus('error');
      setSyncError(err instanceof Error ? err.message : 'Error de red');
    }
  }, [setCombatants, setItems, setMonsters, setNpcs, setNotes, setSpells]);

  // Sesión + carga inicial (compendio primero; después, si hay nube, la BD).
  useEffect(() => {
    const configured = isCloudConfigured();
    setSupabaseActive(configured);
    if (!configured) setSyncStatus('idle');
    setInitialLoading(true);

    let cancelled = false;
    let sub: { subscription: { unsubscribe: () => void } } | undefined;

    if (configured) {
      const client = getSupabase();
      // Sesión del usuario (el middleware ya exige login para acceder aquí).
      client.auth.getUser().then(({ data }) => {
        if (!cancelled) setUserEmail(data.user?.email ?? null);
      });
      sub = client.auth.onAuthStateChange((_event, session) => {
        if (!cancelled) setUserEmail(session?.user?.email ?? null);
      }).data;
    } else if (!cancelled) {
      setUserEmail(null);
    }

    loadCompendium()
      .catch(err => {
        // Sin compendio la app sigue con los datos de ejemplo.
        console.warn('Compendium load failed, fallback to sample data:', err);
      })
      .then(() => {
        if (cancelled) return;
        if (!configured) {
          setInitialLoading(false);
          return;
        }
        return loadDataFromSupabase()
          .catch(err => {
            console.warn('Supabase fetch failed, fallback to local state:', err);
          })
          .finally(() => {
            if (!cancelled) setInitialLoading(false);
          });
      });
    return () => {
      cancelled = true;
      sub?.subscription.unsubscribe();
    };
  }, [loadCompendium, loadDataFromSupabase, configVersion]);

  // ---- Respaldo / restauración de la campaña ----------------------------
  const getCampaign = useCallback(
    () =>
      buildCampaign({
        combatants,
        items,
        monsters,
        npcs,
        spells,
        notes,
        party,
        auditLog,
        activeTab,
        turnIndex: readStorage<number>(STORAGE_KEYS.turnIndex, 0),
        round: readStorage<number>(STORAGE_KEYS.round, 1),
      }),
    [combatants, items, monsters, npcs, spells, notes, party, activeTab]
  );

  const exportCampaign = useCallback(() => {
    downloadCampaign(getCampaign());
  }, [getCampaign]);

  const importCampaign = useCallback(
    (data: CampaignData) => {
      setCombatants(data.combatants);
      setItems(data.items);
      setNpcs(data.npcs);
      setNotes(data.notes);
      if (Array.isArray(data.party)) setParty(data.party as PartyMember[]);
      if (Array.isArray(data.auditLog)) setAuditLog(data.auditLog);
      // Bestiario/grimorio: si el archivo los trae, mandan sobre lo actual
      // (una importación es un restablecimiento), pero nunca dejan la lista
      // vacía si el archivo no los incluía.
      if (data.monsters?.length) setMonsters(data.monsters);
      if (data.spells?.length) setSpells(data.spells);
      if (data.activeTab) setActiveTab(data.activeTab);
      // Turno y ronda viven en el rastreador: se escriben directamente para que
      // el recargado posterior arranque en el punto correcto.
      writeStorage(STORAGE_KEYS.turnIndex, data.turnIndex ?? 0);
      writeStorage(STORAGE_KEYS.round, data.round ?? 1);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setCombatants, setItems, setMonsters, setNpcs, setNotes, setParty, setSpells, setActiveTab]
  );

  return {
    activeTab,
    setActiveTab,
    combatants,
    setCombatants,
    items,
    setItems,
    monsters,
    setMonsters,
    npcs,
    setNpcs,
    spells,
    setSpells,
    notes,
    setNotes,
    party,
    setParty,
    auditLog,
    setAuditLog,
    logEvent,
    supabaseActive,
    userEmail,
    initialLoading,
    syncStatus,
    syncError,
    storageAlert,
    dismissStorageAlert: () => setStorageAlert(null),
    getCampaign,
    exportCampaign,
    importCampaign,
    reloadConnection: () => setConfigVersion(v => v + 1),
  };
}