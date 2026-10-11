'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  LayoutDashboard, Swords, Backpack, Skull, 
  Users, BookOpen, Database, Sparkles, LogOut
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
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
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [supabaseActive, setSupabaseActive] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // App State
  const [combatants, setCombatants] = useState<Combatant[]>(INITIAL_COMBATANTS);
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_ITEMS);
  const [monsters, setMonsters] = useState<Monster[]>(INITIAL_MONSTERS);
  const [npcs, setNpcs] = useState<NPC[]>(INITIAL_NPCS);
  const [spells, setSpells] = useState<Spell[]>(INITIAL_SPELLS);
  const [notes, setNotes] = useState<DMNote[]>(INITIAL_NOTES);

  const loadDataFromSupabase = useCallback(async () => {
    const { data: monData } = await supabase.from('monsters').select('*');
      if (monData && monData.length > 0) setMonsters(monData);

      const { data: spellData } = await supabase.from('spells').select('*');
      if (spellData && spellData.length > 0) setSpells(spellData);

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
    const configured = isSupabaseConfigured();
    setSupabaseActive(configured);

    if (!configured) return;

    let cancelled = false;

    // Sesión del usuario (el middleware ya exige login para acceder aquí).
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUserEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setUserEmail(session?.user?.email ?? null);
    });

    loadDataFromSupabase().catch(err => {
      if (!cancelled) console.warn('Supabase fetch failed, fallback to local state:', err);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadDataFromSupabase]);

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
    const initRoll = Math.floor(Math.random() * 20) + 1 + Math.floor((monster.stats.dex - 10) / 2);
    const imported: Combatant = {
      id: `comb-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: monster.name,
      initiative: initRoll,
      hp_current: monster.hp_max,
      hp_max: monster.hp_max,
      ac: monster.ac,
      is_player: false,
      conditions: [],
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
            <div className="flex items-center gap-2">
              {supabaseActive ? (
                <span className="flex items-center gap-1.5 text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full font-medium" title={userEmail ?? undefined}>
                  <Database className="w-3.5 h-3.5 text-emerald-400" /> {userEmail ?? 'Conectado'}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs bg-amber-950/60 text-amber-300 border border-amber-800/80 px-3 py-1 rounded-full font-medium" title="Modo local activado. Conecta Supabase en .env.local para sincronización en la nube.">
                  <Database className="w-3.5 h-3.5 text-amber-400" /> Modo Local (Demo)
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
      </main>

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
