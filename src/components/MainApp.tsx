'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Swords, Backpack, Skull, 
  Users, BookOpen, Database, Sparkles, LogOut
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { usePersistentState } from '@/lib/usePersistentState';
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

export default function MainApp() {
  // La pestaña activa también se recuerda: si el DM refresca a mitad de combate
  // vuelve justo donde estaba.
  const [activeTab, setActiveTab] = usePersistentState<string>('active-tab', 'dashboard');
  const [supabaseActive, setSupabaseActive] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // App State (persistidos en localStorage: la sesión local sobrevive a un refresco)
  const [combatants, setCombatants] = usePersistentState<Combatant[]>('combatants', INITIAL_COMBATANTS);
  const [items, setItems] = usePersistentState<InventoryItem[]>('items', INITIAL_ITEMS);
  const [monsters, setMonsters] = useState<Monster[]>(INITIAL_MONSTERS);
  const [npcs, setNpcs] = usePersistentState<NPC[]>('npcs', INITIAL_NPCS);
  const [spells, setSpells] = useState<Spell[]>(INITIAL_SPELLS);
  const [notes, setNotes] = usePersistentState<DMNote[]>('notes', INITIAL_NOTES);

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
    // Los monstruos/hechizos propios se fusionan sobre el compendio SRD
    // (por id y por nombre) para no ocultar el bestiario con las filas de la BD.
    const { data: monData } = await supabase.from('monsters').select('*');
      if (monData && monData.length > 0) setMonsters(prev => mergeById(prev, monData));

      const { data: spellData } = await supabase.from('spells').select('*');
      if (spellData && spellData.length > 0) setSpells(prev => mergeById(prev, spellData));

      const { data: npcData } = await supabase.from('npcs').select('*');
      if (npcData && npcData.length > 0) setNpcs(npcData);

      const { data: itemData } = await supabase.from('items').select('*');
      if (itemData && itemData.length > 0) setItems(itemData);

      const { data: combData } = await supabase.from('initiative_combatants').select('*');
      if (combData && combData.length > 0) setCombatants(combData);

      const { data: noteData } = await supabase.from('dm_notes').select('*');
      if (noteData && noteData.length > 0) setNotes(noteData);
  }, []);

  useEffect(() => {
    const configured = isSupabaseConfigured();    setSupabaseActive(configured);

    let cancelled = false;
    let sub: { subscription: { unsubscribe: () => void } } | undefined;

    if (configured) {
      // Sesión del usuario (el middleware ya exige login para acceder aquí).
      supabase.auth.getUser().then(({ data }) => {
        if (!cancelled) setUserEmail(data.user?.email ?? null);
      });
      sub = supabase.auth.onAuthStateChange((_event, session) => {
        if (!cancelled) setUserEmail(session?.user?.email ?? null);
      }).data;
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
  }, [loadCompendium, loadDataFromSupabase]);

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

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // La ruta del servidor revoca el token y limpia las cookies httpOnly.
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      await supabase.auth.signOut();
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

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Panel Global', icon: LayoutDashboard },
    { id: 'initiative', label: 'Iniciativa', icon: Swords },
    { id: 'inventory', label: 'Inventario', icon: Backpack },
    { id: 'monsters', label: 'Monstruos', icon: Skull },
    { id: 'npcs', label: 'NPCs', icon: Users },
    { id: 'spells', label: 'Hechizos', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-dungeon-950 text-slate-100">
      {/* Top Navbar */}
      <header className="bg-dungeon-900 border-b border-dungeon-800 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                <Sparkles className="w-6 h-6 fill-slate-950" />
              </div>
              <div>
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
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

            {/* Supabase Status Pill */}
            <div className="flex items-center gap-2 pl-2">
              <ThemeToggle />
              {supabaseActive ? (
                <span className="flex items-center gap-1.5 text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full font-medium" title={userEmail ?? undefined}>
                  <Database className="w-3.5 h-3.5 text-emerald-400" /> <span className="hidden sm:inline">{userEmail ?? 'Conectado'}</span><span className="sm:hidden">En línea</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs bg-amber-950/60 text-amber-300 border border-amber-800/80 px-3 py-1 rounded-full font-medium" title="Modo local: iniciativa, inventario, NPCs y notas se guardan solos en este navegador (localStorage). Conecta Supabase en .env.local para sincronizar en la nube.">
                  <Database className="w-3.5 h-3.5 text-amber-400" /> <span className="hidden sm:inline">Modo Local (Demo)</span><span className="sm:hidden">Local</span>
                </span>
              )}
              {supabaseActive && (
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-1.5 text-xs bg-dungeon-800 text-slate-300 border border-dungeon-700 hover:text-slate-100 hover:bg-dungeon-700 px-3 py-1 rounded-full font-medium transition disabled:opacity-60"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" /> Salir
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

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Transición suave al cambiar de sección */}
        <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
        {activeTab === 'dashboard' && (
          <DmDashboard
            combatants={combatants}
            items={items}
            monsters={monsters}
            npcs={npcs}
            spells={spells}
            notes={notes}
            onUpdateNotes={setNotes}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'initiative' && (
          <InitiativeTracker
            combatants={combatants}
            monsters={monsters}
            npcs={npcs}
            onUpdateCombatants={setCombatants}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryTracker
            items={items}
            onUpdateItems={setItems}
          />
        )}

        {activeTab === 'monsters' && (
          <MonsterCompendium
            monsters={monsters}
            onUpdateMonsters={setMonsters}
            onSendToCombat={handleSendMonsterToCombat}
          />
        )}

        {activeTab === 'npcs' && (
          <NpcManager
            npcs={npcs}
            onUpdateNpcs={setNpcs}
          />
        )}

        {activeTab === 'spells' && (
          <Spellbook
            spells={spells}
            onUpdateSpells={setSpells}
          />
        )}
        </motion.div>
        </AnimatePresence>
      </main>

      {/* Herramientas flotantes: dados + generador de nombres */}
      <Toolbox />

      {/* Footer */}
      <footer className="bg-dungeon-900 border-t border-dungeon-800 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>DM Companion App • Next.js App Router, Tailwind CSS & Supabase</p>
          <p className="text-slate-400">Listo para despliegue en Vercel</p>
        </div>
      </footer>
    </div>
  );
}
