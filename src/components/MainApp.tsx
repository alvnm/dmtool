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
import type { TranslationKey } from '@/lib/i18n';
import { Globe } from 'lucide-react';
import { useToast } from '@/components/Toast';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { Monster } from '@/types';
import { DmDashboard } from '@/components/dashboard/DmDashboard';
import type { PaletteTabId } from '@/components/CommandPalette';

const TabLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[350px] gap-3 text-slate-400">
    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
    <span className="text-xs uppercase tracking-wider font-semibold">Cargando herramienta...</span>
  </div>
);

const InitiativeTracker = dynamic(() => import('@/components/initiative/InitiativeTracker').then(m => m.InitiativeTracker), { loading: TabLoadingFallback });
const InventoryTracker = dynamic(() => import('@/components/inventory/InventoryTracker').then(m => m.InventoryTracker), { loading: TabLoadingFallback });
const MonsterCompendium = dynamic(() => import('@/components/monsters/MonsterCompendium').then(m => m.MonsterCompendium), { loading: TabLoadingFallback });
const NpcManager = dynamic(() => import('@/components/npcs/NpcManager').then(m => m.NpcManager), { loading: TabLoadingFallback });
const Spellbook = dynamic(() => import('@/components/spells/Spellbook').then(m => m.Spellbook), { loading: TabLoadingFallback });
const PartyManager = dynamic(() => import('@/components/party/PartyManager').then(m => m.PartyManager), { loading: TabLoadingFallback });
const TreasureGenerator = dynamic(() => import('@/components/treasure/TreasureGenerator').then(m => m.TreasureGenerator), { loading: TabLoadingFallback });
const Toolbox = dynamic(() => import('@/components/tools/Toolbox').then(m => m.Toolbox), { ssr: false });
const SettingsModal = dynamic(() => import('@/components/settings/SettingsModal').then(m => m.SettingsModal), { ssr: false });
const CommandPalette = dynamic(() => import('@/components/CommandPalette').then(m => m.CommandPalette), { ssr: false });

type NavGroupId = 'session' | 'party' | 'content' | 'loot';

/** Orden de los grupos en la barra lateral. */
const NAV_GROUPS: Array<{ id: NavGroupId; labelKey: TranslationKey }> = [
  { id: 'session', labelKey: 'groupSession' },
  { id: 'party', labelKey: 'groupParty' },
  { id: 'content', labelKey: 'groupContent' },
  { id: 'loot', labelKey: 'groupLoot' },
];

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
    initialLoading,
    syncStatus, syncError,
    storageAlert, dismissStorageAlert,
    getCampaign, exportCampaign, importCampaign, reloadConnection,
  } = useCampaignData();

  const [loggingOut, setLoggingOut] = useState(false);
  const { success, info } = useToast();

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
        success('¡Respaldo JSON descargado con éxito!');
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
    success(`¡${monster.name} añadido a iniciativa!`);
  };

  const NAV_ITEMS: Array<{
    id: PaletteTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    group: NavGroupId;
  }> = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, group: 'session' },
    { id: 'initiative', label: t('initiative'), icon: Swords, group: 'session' },
    { id: 'party', label: t('party'), icon: UserCheck, group: 'party' },
    { id: 'npcs', label: t('npcs'), icon: Users, group: 'party' },
    { id: 'monsters', label: t('monsters'), icon: Skull, group: 'content' },
    { id: 'spells', label: t('spells'), icon: BookOpen, group: 'content' },
    { id: 'inventory', label: t('inventory'), icon: Backpack, group: 'loot' },
    { id: 'treasure', label: t('treasure'), icon: Gift, group: 'loot' },
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
        return (
          <InventoryTracker
            items={items}
            onUpdateItems={setItems}
            assigneeSuggestions={[
              'Bolsa General',
              ...party.map(p => p.name),
              ...Array.from(new Set(items.map(i => i.assigned_to))).filter(
                a => a && a !== 'Bolsa General' && !party.some(p => p.name === a)
              ),
            ]}
          />
        );
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
            items={items}
            onUpdateItems={setItems}
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
            party={party}
            highlightNoteId={highlightNoteId}
            onUpdateNotes={setNotes}
            onSelectTab={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-dungeon-950 text-slate-100">
      {/* Barra de carga inicial: compendio SRD + nube descargando */}
      {initialLoading && (
        <div
          className="fixed top-0 inset-x-0 z-[80] h-1 bg-dungeon-800/60 overflow-hidden"
          role="status"
          aria-label="Cargando datos de la campaña"
        >
          <motion.div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600"
            initial={{ x: '-110%' }}
            animate={{ x: '320%' }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      )}
      {/* Barra lateral de secciones (desktop). En Focus Mode desaparece. */}
      {!focusMode && (
        <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-56 flex-col bg-dungeon-900 border-r border-dungeon-800">
          {/* Marca */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            title={t('dashboard')}
            aria-label={t('dashboard')}
            className="btn flex items-center gap-3 px-4 h-16 shrink-0 border-b border-dungeon-800 group"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-amber-500/30 group-hover:border-amber-400 flex items-center justify-center bg-dungeon-950 transition">
              <img src="/icon-192.png" alt="" aria-hidden="true" width={192} height={192} decoding="async" className="w-full h-full object-cover" />
            </div>
            <span className="font-serif text-base text-amber-400 tracking-wide">DM Companion</span>
          </button>

          {/* Secciones agrupadas: la sesión primero, luego personajes, contenido y botín */}
          <nav
            className="flex-1 overflow-y-auto p-3 space-y-4"
            aria-label="Secciones de la campaña"
          >
            {NAV_GROUPS.map(group => (
              <div key={group.id}>
                <p className="px-3 pb-1.5 text-micro uppercase tracking-widest text-slate-500 font-bold">
                  {t(group.labelKey)}
                </p>
                <div className="space-y-1">
                  {NAV_ITEMS.filter(item => item.group === group.id).map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
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
                </div>
              </div>
            ))}
          </nav>

          {/* Atajo de búsqueda */}
          <div className="p-3 border-t border-dungeon-800 flex items-center justify-between gap-2 text-micro text-slate-500">
            <span>Busca al vuelo</span>
            <kbd className="font-mono border border-dungeon-700 rounded px-1.5 py-0.5">Ctrl K</kbd>
          </div>
        </aside>
      )}

      <div className={`flex min-h-screen flex-col ${focusMode ? '' : 'lg:pl-56'}`}>
      {/* Top Navbar (oculta en Focus Mode para maximizar espacio en la mesa) */}
      {!focusMode && (
      <header className="bg-dungeon-900 border-b border-dungeon-800 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* flex-wrap + min-h-16: en pantallas de 320px las acciones no caben en
              una línea y, sin poder envolver, la página hacía scroll horizontal. */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end min-h-[4rem] gap-2">
            {/* Botón Inicio / Logo */}
            <button
              type="button"
              className="btn flex items-center cursor-pointer shrink-0 group rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 lg:hidden"
              onClick={() => setActiveTab('dashboard')}
              title={t('dashboard')} aria-label={t('dashboard')}
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20 border border-amber-500/30 group-hover:border-amber-400 flex items-center justify-center bg-dungeon-950 transition">
                <img src="/icon-192.png" alt="DM Companion" width={192} height={192} decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition" />
              </div>
            </button>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex lg:hidden items-center space-x-1 overflow-x-auto py-1 scrollbar-none flex-1 justify-center min-w-0">
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
            <div className="flex flex-wrap items-center justify-end gap-1.5 pl-1 ml-auto">
              <button
                onClick={() => setPaletteOpen(true)}
                className="btn btn-secondary flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                title={t("searchTooltip")} aria-label={t("searchTooltip")}
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{t("search")}</span>
                <kbd className="hidden lg:inline text-micro font-mono border border-dungeon-600 rounded px-1">Ctrl K</kbd>
              </button>

              <button
              onClick={exportCampaign}
              className="btn btn-secondary hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
              title={t("downloadTooltip")} aria-label={t("downloadTooltip")}
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {/* Selector de idioma */}
              <button
                type="button"
                onClick={toggleLanguage}
                title={t('langTooltip')}
                className="btn btn-secondary flex items-center gap-1 px-2.5 py-1 rounded-full"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>{language.toUpperCase()}</span>
              </button>

              <ThemeToggle />

              {/* Estado de sincronización en la nube */}
              {supabaseActive && (
                <span
                  className={`hidden xl:flex items-center gap-1.5 text-micro px-2.5 py-1 rounded-full font-medium border ${
                    syncStatus === 'error'
                      ? 'bg-red-950 text-red-300 border-red-800'
                      : syncStatus === 'saving'
                      ? 'bg-dungeon-800 text-slate-300 border-dungeon-700'
                      : syncStatus === 'saved'
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                      : 'bg-dungeon-800 text-slate-400 border-dungeon-700'
                  }`}
                  title={syncStatus === 'error' && syncError ? `Error de sincronización: ${syncError}` : undefined}
                >
                  {syncStatus === 'saving' && (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Sincronizando…</>
                  )}
                  {syncStatus === 'error' && <>⚠ Error de sync</>}
                  {syncStatus === 'saved' && <>✓ Sincronizado</>}
                  {syncStatus === 'idle' && <>En espera…</>}
                </span>
              )}
              

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
                className="btn btn-secondary flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                title={t("focusTooltip")}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{t("focus")}</span>
              </button>

              {supabaseActive && (
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="btn btn-secondary flex items-center gap-1.5 px-3 py-1.5 rounded-full disabled:opacity-60"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" /> <span className="hidden md:inline">{t("logout")}</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Nav Tabs */}
          <div className="md:hidden flex items-center overflow-x-auto py-2 border-t border-dungeon-800 space-x-1 scrollbar-none px-1 touch-pan-x overscroll-x-contain">
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
                className="btn btn-primary px-3 py-1"
              >
                Descargar Respaldo JSON
              </button>
              <button
                onClick={dismissStorageAlert}
                className="btn text-amber-400 hover:text-amber-200 px-2 py-1" aria-label="Descartar aviso"
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
            className="btn p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-dungeon-800 min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Buscador rápido (Ctrl + K)" aria-label="Buscador rápido (Ctrl + K)"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="btn p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-dungeon-800 min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Ajustes" aria-label="Ajustes"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFocusMode(false)}
            className="btn flex items-center gap-1.5 bg-amber-500 text-slate-950 px-3 py-2 rounded-full min-h-[40px]"
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
        items={items}
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
    </div>
  );
}
