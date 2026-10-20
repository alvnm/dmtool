'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Swords, Backpack, Skull, 
  Users, BookOpen, Database, Sparkles, LogOut,
  UserCheck, Gift, Settings, Search, Maximize2, Minimize2, Download
} from 'lucide-react';
import { getSupabase, isCloudConfigured } from '@/lib/supabase/client';
import { usePersistentState } from '@/lib/usePersistentState';
import { useCampaignData } from '@/lib/useCampaignData';
import { sortCombatants, monsterToCombatant } from '@/lib/combat';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useI18n } from '@/lib/i18n';
import { Globe } from 'lucide-react';
import { Toolbox } from '@/components/tools/Toolbox';
import { Monster } from '@/types';
import { DmDashboard } from '@/components/dashboard/DmDashboard';
import { InitiativeTracker } from '@/components/initiative/InitiativeTracker';
import { InventoryTracker } from '@/components/inventory/InventoryTracker';
import { MonsterCompendium } from '@/components/monsters/MonsterCompendium';
import { NpcManager } from '@/components/npcs/NpcManager';
import { Spellbook } from '@/components/spells/Spellbook';
import { PartyManager } from '@/components/party/PartyManager';
import { TreasureGenerator } from '@/components/treasure/TreasureGenerator';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { CommandPalette, type PaletteTabId } from '@/components/CommandPalette';

export default function MainApp() {
  const { t, language, toggleLanguage } = useI18n();
  // Datos + nube: toda la carga/fusión vive en useCampaignData.
  const {
    activeTab, setActiveTab,
    combatants, setCombatants,
    items, setItems,
    monsters, setMonsters,
    npcs, setNpcs,
    spells, setSpells,
    notes, setNotes,
    party, setParty,
    supabaseActive, userEmail,
    syncStatus, syncError,
    storageAlert, dismissStorageAlert,
    getCampaign, exportCampaign, importCampaign, reloadConnection,
  } = useCampaignData();

  const [loggingOut, setLoggingOut] = useState(false);

  // UI state
  const [focusMode, setFocusMode] = usePersistentState<boolean>('focus-mode', false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [highlightNoteId, setHighlightNoteId] = useState<string | null>(null);


  // Bestiario, grimorio y nube se cargan dentro de useCampaignData.

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
        exportCampaign();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exportCampaign]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // La ruta del servidor revoca el token y limpia las cookies httpOnly.
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      await getSupabase().auth.signOut();
      window.location.assign('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSendMonsterToCombat = (monster: Monster) => {
    setCombatants(sortCombatants([...combatants, monsterToCombatant(monster)]));
    setActiveTab('initiative');
  };

  const NAV_ITEMS: Array<{ id: PaletteTabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'initiative', label: t('initiative'), icon: Swords },
    { id: 'inventory', label: t('inventory'), icon: Backpack },
    { id: 'monsters', label: t('monsters'), icon: Skull },
    { id: 'npcs', label: t('npcs'), icon: Users },
    { id: 'spells', label: t('spells'), icon: BookOpen },
    { id: 'party', label: t('party'), icon: UserCheck },
    { id: 'treasure', label: t('treasure'), icon: Gift },
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
            <nav className="hidden md:flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none flex-1 justify-center min-w-0">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-dungeon-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
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
                title={t("searchTooltip")}
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{t("search")}</span>
                <kbd className="hidden lg:inline text-[10px] font-mono border border-dungeon-600 rounded px-1">Ctrl K</kbd>
              </button>

              <button
              onClick={exportCampaign}
              className="hidden sm:flex items-center gap-1.5 text-xs bg-dungeon-800 text-slate-400 border border-dungeon-700 hover:text-slate-100 hover:bg-dungeon-700 px-2.5 py-1.5 rounded-full font-medium transition"
              title={t("downloadTooltip")}
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {/* Selector de idioma */}
              <button
                type="button"
                onClick={toggleLanguage}
                title={t('langTooltip')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-dungeon-800 text-slate-300 border border-dungeon-700 hover:text-slate-100 hover:bg-dungeon-700 transition"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>{language.toUpperCase()}</span>
              </button>

              <ThemeToggle />

              {/* Estado de sincronización en la nube */}
              

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
                title={t("focusTooltip")}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{t("focus")}</span>
              </button>

              {supabaseActive && (
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-1.5 text-xs bg-dungeon-800 text-slate-300 border border-dungeon-700 hover:text-slate-100 hover:bg-dungeon-700 px-3 py-1.5 rounded-full font-medium transition disabled:opacity-60"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" /> <span className="hidden md:inline">{t("logout")}</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Nav Tabs */}
          <div className="md:hidden flex items-center overflow-x-auto py-2 border-t border-dungeon-800 space-x-1 scrollbar-none px-1">
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
        {/* Aviso de error de cuota / almacenamiento local */}
        {storageAlert && (
          <div className="mb-4 bg-amber-500/15 border border-amber-500/40 text-amber-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs gap-3">
            <span>⚠️ {storageAlert}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={exportCampaign}
                className="bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs hover:bg-amber-400 transition"
              >
                Descargar Respaldo JSON
              </button>
              <button
                onClick={dismissStorageAlert}
                className="text-amber-400 hover:text-amber-200 font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

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
            title={t("exitFocus")}
          >
            <Minimize2 className="w-4 h-4" /> {t("exitFocus")}
          </button>
        </motion.div>
      )}

      {/* Herramientas flotantes: dados + nombres + NPC al vuelo */}
      <Toolbox onSaveNpc={npc => setNpcs(prev => [npc, ...prev])} />

      {/* Ajustes: Supabase, respaldo JSON y atajos */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        getCampaign={getCampaign}
        onImportCampaign={importCampaign}
        onConnectionChanged={reloadConnection}
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
