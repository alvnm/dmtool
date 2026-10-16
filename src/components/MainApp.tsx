'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Swords, Backpack, Skull, 
  Users, BookOpen, Database, Sparkles, LogOut,
  UserCheck, Gift, Settings, Search, Maximize2, Minimize2, Download
} from 'lucide-react';
import { supabase, getSupabase, isSupabaseConfigured, isCloudConfigured } from '@/lib/supabase/client';
import { usePersistentState, readStorage, writeStorage } from '@/lib/usePersistentState';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Toolbox } from '@/components/tools/Toolbox';
import { loadBestiary, loadGrimoire, mergeById } from '@/lib/compendium';
import { 
  INITIAL_COMBATANTS, INITIAL_ITEMS, INITIAL_MONSTERS, 
  INITIAL_NPCS, INITIAL_SPELLS, INITIAL_NOTES 
} from '@/lib/mockData';
import { Combatant, InventoryItem, Monster, NPC, Spell, DMNote } from '@/types';
import { DmDashboard } from '@/components/dashboard/DmDashboard';
import { InitiativeTracker } from '@/components/initiative/InitiativeTracker';
import { InventoryTracker } from '@/components/inventory/InventoryTracker';
import { MonsterCompendium } from '@/components/monsters/MonsterCompendium';
import { NpcManager } from '@/components/npcs/NpcManager';
import { Spellbook } from '@/components/spells/Spellbook';
import { PartyManager, type PartyMember } from '@/components/party/PartyManager';
import { TreasureGenerator } from '@/components/treasure/TreasureGenerator';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { CommandPalette, type PaletteTabId } from '@/components/CommandPalette';
import { buildCampaign, downloadCampaign, STORAGE_KEYS, type CampaignData } from '@/lib/campaign';

export default function MainApp() {
  // La pestaña activa también se recuerda: si el DM refresca a mitad de combate
  // vuelve justo donde estaba.
  const [activeTab, setActiveTab] = usePersistentState<string>('active-tab', 'dashboard');
  const [supabaseActive, setSupabaseActive] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // UI state
  const [focusMode, setFocusMode] = usePersistentState<boolean>('focus-mode', false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [highlightNoteId, setHighlightNoteId] = useState<string | null>(null);
  // Cambia cuando el DM guarda/borra credenciales en el modal de ajustes.
  const [configVersion, setConfigVersion] = useState(0);

  // App State (persistidos en localStorage: la sesión local sobrevive a un refresco)
  const [combatants, setCombatants] = usePersistentState<Combatant[]>('combatants', INITIAL_COMBATANTS);
  const [items, setItems] = usePersistentState<InventoryItem[]>('items', INITIAL_ITEMS);
  const [monsters, setMonsters] = useState<Monster[]>(INITIAL_MONSTERS);
  const [npcs, setNpcs] = usePersistentState<NPC[]>('npcs', INITIAL_NPCS);
  const [spells, setSpells] = useState<Spell[]>(INITIAL_SPELLS);
  const [notes, setNotes] = usePersistentState<DMNote[]>('notes', INITIAL_NOTES);
  const [party, setParty] = usePersistentState<PartyMember[]>('party', []);

  // Bestiario + grimorio SRD (data/compendium) como base local de la app.
  const loadCompendium = useCallback(async () => {
    try {
      const [bestiary, grimoire] = await Promise.all([loadBestiary(), loadGrimoire()]);
      if (bestiary.length) setMonsters(bestiary);
      if (grimoire.length) setSpells(grimoire);
    } catch (err) {
      // Sin compendio generado la app sigue con los datos de ejemplo.
      console.warn('Compendio no disponible, se usan datos de ejemplo:', err);
    }
  }, []);

  const loadDataFromSupabase = useCallback(async () => {
    const client = getSupabase();
    // Los monstruos/hechizos propios se fusionan sobre el compendio SRD
    // (por id y por nombre) para no ocultar el bestiario con las filas de la BD.
    const { data: monData } = await client.from('monsters').select('*');
      if (monData && monData.length > 0) setMonsters(prev => mergeById(prev, monData));

      const { data: spellData } = await client.from('spells').select('*');
      if (spellData && spellData.length > 0) setSpells(prev => mergeById(prev, spellData));

      const { data: npcData } = await client.from('npcs').select('*');
      if (npcData && npcData.length > 0) setNpcs(npcData);

      const { data: itemData } = await client.from('items').select('*');
      if (itemData && itemData.length > 0) setItems(itemData);

      const { data: combData } = await client.from('initiative_combatants').select('*');
      if (combData && combData.length > 0) setCombatants(combData);

      const { data: noteData } = await client.from('dm_notes').select('*');
      if (noteData && noteData.length > 0) setNotes(noteData);
  }, []);

  useEffect(() => {
    // Nube por variables de entorno O por credenciales pegadas en Ajustes.
    const configured = isCloudConfigured();
    setSupabaseActive(configured);

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

    // Compendio SRD primero (también en modo local); después, si hay Supabase,
    // las filas propias del usuario se fusionan encima del bestiario.
    loadCompendium().then(() => {
      if (cancelled || !configured) return;
      return loadDataFromSupabase().catch(err => {
        console.warn('Supabase fetch failed, fallback to local state:', err);
      });
    });
    return () => {
      cancelled = true;
      sub?.subscription.unsubscribe();
    };
  }, [loadCompendium, loadDataFromSupabase, configVersion]);

  // PWA: registrar el service worker para uso offline en tablets del DM.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Sin SW la app sigue funcionando igual, sólo pierde el modo offline.
      });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  // ---- Respaldo / restauración de la campaña ----------------------------
  const handleExportCampaign = useCallback(() => {
    downloadCampaign(
      buildCampaign({
        combatants,
        items,
        npcs,
        notes,
        party,
        activeTab,
        turnIndex: readStorage<number>(STORAGE_KEYS.turnIndex, 0),
        round: readStorage<number>(STORAGE_KEYS.round, 1),
      })
    );
  }, [combatants, items, npcs, notes, party, activeTab]);

  const handleImportCampaign = useCallback((data: CampaignData) => {
    setCombatants(data.combatants);
    setItems(data.items);
    setNpcs(data.npcs);
    setNotes(data.notes);
    if (Array.isArray(data.party)) setParty(data.party as PartyMember[]);
    if (data.activeTab) setActiveTab(data.activeTab);
    // Turno y ronda viven en el rastreador: se escriben directamente para que
    // el recargado posterior arranque en el punto correcto.
    writeStorage(STORAGE_KEYS.turnIndex, data.turnIndex ?? 0);
    writeStorage(STORAGE_KEYS.round, data.round ?? 1);
  }, [setCombatants, setItems, setNpcs, setNotes, setParty, setActiveTab]);

  // ---- Atajos globales de teclado ---------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
        return;
      }
      if (mod && e.key.toLowerCase() === 's') {
        // Respaldo rápido de la campaña sin pasar por el modal.
        e.preventDefault();
        handleExportCampaign();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleExportCampaign]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // La ruta del servidor revoca el token y limpia las cookies httpOnly.
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      await supabase.auth.signOut();
      // Sesión iniciada desde el modal de ajustes (credenciales en el navegador).
      if (!isSupabaseConfigured()) await getSupabase().auth.signOut();
      window.location.assign('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSendMonsterToCombat = (monster: Monster) => {
    const dexMod = Math.floor((monster.stats.dex - 10) / 2);
    const initRoll = Math.floor(Math.random() * 20) + 1 + dexMod;
    const imported: Combatant = {
      id: `comb-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: monster.name,
      initiative: initRoll,
      hp_current: monster.hp_max,
      hp_max: monster.hp_max,
      ac: monster.ac,
      is_player: false,
      conditions: [],
      condition_rounds: {},
      dex_mod: dexMod,
    };
    const updated = [...combatants, imported].sort((a, b) => b.initiative - a.initiative);
    setCombatants(updated);
    setActiveTab('initiative');
  };

  const NAV_ITEMS: Array<{ id: PaletteTabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'initiative', label: 'Iniciativa', icon: Swords },
    { id: 'inventory', label: 'Inventario', icon: Backpack },
    { id: 'monsters', label: 'Bestiario', icon: Skull },
    { id: 'npcs', label: 'NPCs', icon: Users },
    { id: 'spells', label: 'Grimorio', icon: BookOpen },
    { id: 'party', label: 'Grupo', icon: UserCheck },
    { id: 'treasure', label: 'Tesoros', icon: Gift },
  ];

  const activeLabel = NAV_ITEMS.find(i => i.id === activeTab)?.label ?? 'Panel';

  const renderTab = (tab: string) => {
    switch (tab) {
      case 'initiative':
        return (
          <InitiativeTracker
            combatants={combatants}
            monsters={monsters}
            npcs={npcs}
            onUpdateCombatants={setCombatants}
          />
        );
      case 'inventory':
        return <InventoryTracker items={items} onUpdateItems={setItems} />;
      case 'monsters':
        return (
          <MonsterCompendium
            monsters={monsters}
            onUpdateMonsters={setMonsters}
            onSendToCombat={handleSendMonsterToCombat}
          />
        );
      case 'npcs':
        return <NpcManager npcs={npcs} onUpdateNpcs={setNpcs} />;
      case 'spells':
        return <Spellbook spells={spells} onUpdateSpells={setSpells} />;
      case 'party':
        return (
          <PartyManager
            members={party}
            onUpdateMembers={setParty}
            combatants={combatants}
            onUpdateCombatants={setCombatants}
          />
        );
      case 'treasure':
        return (
          <TreasureGenerator
            onUpdateItems={setItems}
            onGoToInventory={() => setActiveTab('inventory')}
          />
        );
      default:
        return (
          <DmDashboard
            combatants={combatants}
            items={items}
            monsters={monsters}
            npcs={npcs}
            spells={spells}
            notes={notes}
            highlightNoteId={highlightNoteId}
            onUpdateNotes={setNotes}
            onSelectTab={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dungeon-950 text-slate-100">
      {/* Top Navbar (oculta en Focus Mode para maximizar espacio en la mesa) */}
      {!focusMode && (
      <header className="bg-dungeon-900 border-b border-dungeon-800 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab('dashboard')}>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                <Sparkles className="w-6 h-6 fill-slate-950" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-100 tracking-wide font-serif">
                  DM <span className="text-amber-400">Companion</span>
                </h1>
                <p className="text-[10px] text-slate-400">D&D 5e Campaign Assistant</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-dungeon-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Acciones rápidas */}
            <div className="flex items-center gap-1.5 pl-1 shrink-0">
              <button
                onClick={() => setPaletteOpen(true)}
                className="hidden sm:flex items-center gap-1.5 text-xs bg-dungeon-800 text-slate-400 border border-dungeon-700 hover:text-slate-100 hover:bg-dungeon-700 px-2.5 py-1.5 rounded-full font-medium transition"
                title="Buscador rápido (Ctrl + K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Buscar</span>
                <kbd className="hidden lg:inline text-[10px] font-mono border border-dungeon-600 rounded px-1">Ctrl K</kbd>
              </button>

              <button
                onClick={handleExportCampaign}
                className="hidden sm:flex items-center gap-1.5 text-xs bg-dungeon-800 text-slate-400 border border-dungeon-700 hover:text-slate-100 hover:bg-dungeon-700 px-2.5 py-1.5 rounded-full font-medium transition"
                title="Descargar la campaña en JSON (Ctrl + S)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <ThemeToggle />

              {/* Estado del almacenamiento + acceso a ajustes */}
              <button
                onClick={() => setSettingsOpen(true)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium border transition ${
                  supabaseActive
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                    : 'bg-amber-950/60 text-amber-300 border-amber-800/80 hover:bg-amber-900/60'
                }`}
                title={
                  supabaseActive
                    ? `Conectado${userEmail ? `: ${userEmail}` : ''}. Abrir ajustes.`
                    : 'Modo local: la campaña se guarda en este navegador. Pulsa para conectar Supabase o respaldar en JSON.'
                }
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{supabaseActive ? (userEmail ?? 'En la nube') : 'Modo Local'}</span>
                <span className="sm:hidden">{supabaseActive ? 'Nube' : 'Local'}</span>
                <Settings className="w-3.5 h-3.5 opacity-70" />
              </button>

              <button
                onClick={() => setFocusMode(true)}
                className="flex items-center gap-1.5 text-xs bg-dungeon-800 text-slate-400 border border-dungeon-700 hover:text-slate-100 hover:bg-dungeon-700 px-2.5 py-1.5 rounded-full font-medium transition"
                title="Focus Mode: ocultar barras y maximizar el espacio (tablet/laptop en la mesa)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Focus</span>
              </button>

              {supabaseActive && (
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-1.5 text-xs bg-dungeon-800 text-slate-300 border border-dungeon-700 hover:text-slate-100 hover:bg-dungeon-700 px-3 py-1.5 rounded-full font-medium transition disabled:opacity-60"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" /> <span className="hidden md:inline">Salir</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Nav Tabs */}
          <div className="md:hidden flex items-center justify-between overflow-x-auto py-2 border-t border-dungeon-800 space-x-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:bg-dungeon-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>
      )}

      {/* Main Content Body */}
      <main
        className={`flex-1 w-full mx-auto ${
          focusMode ? 'max-w-none p-2 sm:p-3' : 'max-w-7xl p-4 sm:p-6 lg:p-8'
        }`}
      >
        {/* Transición suave al cambiar de sección */}
        <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
        {renderTab(activeTab)}
        </motion.div>
        </AnimatePresence>
      </main>

      {/* Barra flotante de Focus Mode: sección actual + salida rápida */}
      {focusMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed z-50 bottom-4 left-4 mb-[env(safe-area-inset-bottom)] flex items-center gap-2 bg-dungeon-900/95 backdrop-blur border border-dungeon-700 rounded-full shadow-2xl px-3 py-2"
        >
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider pl-1">
            {activeLabel}
          </span>
          <button
            onClick={() => setPaletteOpen(true)}
            className="p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-dungeon-800 transition min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Buscador rápido (Ctrl + K)"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-dungeon-800 transition min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Ajustes"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFocusMode(false)}
            className="flex items-center gap-1.5 bg-amber-500 text-slate-950 text-xs font-bold px-3 py-2 rounded-full transition min-h-[40px]"
            title="Salir del Focus Mode"
          >
            <Minimize2 className="w-4 h-4" /> Focus
          </button>
        </motion.div>
      )}

      {/* Herramientas flotantes: dados + nombres + NPC al vuelo */}
      <Toolbox onSaveNpc={npc => setNpcs(prev => [npc, ...prev])} />

      {/* Ajustes: Supabase, respaldo JSON y atajos */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        getCampaign={() =>
          buildCampaign({
            combatants,
            items,
            npcs,
            notes,
            party,
            activeTab,
            turnIndex: readStorage<number>(STORAGE_KEYS.turnIndex, 0),
            round: readStorage<number>(STORAGE_KEYS.round, 1),
          })
        }
        onImportCampaign={handleImportCampaign}
        onConnectionChanged={() => setConfigVersion(v => v + 1)}
      />

      {/* Paleta de comandos (Ctrl + K) */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelectTab={tab => setActiveTab(tab)}
        onSelectNote={noteId => setHighlightNoteId(noteId)}
        notes={notes}
        monsters={monsters}
        spells={spells}
        npcs={npcs}
        partyNames={party.map(p => p.name)}
        combatants={combatants}
      />

      {/* Footer (oculto en Focus Mode) */}
      {!focusMode && (
      <footer className="bg-dungeon-900 border-t border-dungeon-800 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>DM Companion App • Next.js App Router, Tailwind CSS & Supabase</p>
          <p className="text-slate-400">Listo para despliegue en Vercel</p>
        </div>
      </footer>
      )}
    </div>
  );
}
