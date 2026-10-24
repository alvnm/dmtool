'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, Backpack, Skull, Users, BookOpen, 
  ArrowRight, Heart, Maximize2, Shield, UserCheck, Flame, Compass, Coins, Sparkles
} from 'lucide-react';
import { QuickNotes } from './QuickNotes';
import { Combatant, InventoryItem, Monster, NPC, Spell, DMNote } from '@/types';

interface DmDashboardProps {
  combatants: Combatant[];
  items: InventoryItem[];
  monsters: Monster[];
  npcs: NPC[];
  spells: Spell[];
  notes: DMNote[];
  /** Nota resaltada desde la paleta de comandos (Ctrl+K). */
  highlightNoteId?: string | null;
  onUpdateNotes: (notes: DMNote[]) => void;
  onSelectTab: (tab: string) => void;
}

export const DmDashboard: React.FC<DmDashboardProps> = ({
  combatants,
  items,
  monsters,
  npcs,
  spells,
  notes,
  highlightNoteId,
  onUpdateNotes,
  onSelectTab,
}) => {
  const activeEnemies = combatants.filter(c => !c.is_player);
  const activePlayers = combatants.filter(c => c.is_player);
  const totalGp = items.reduce((acc, i) => acc + (Number(i.value_gp) || 0), 0);
  const wounded = combatants.filter(c => c.hp_current < c.hp_max).length;
  const unconscious = combatants.filter(c => c.hp_current <= 0).length;

  // Tarjetas de acceso directo: cada una lleva a su módulo con un clic.
  const CARDS = [
    {
      id: 'initiative',
      icon: Swords,
      title: 'Iniciativa',
      detail: `${activePlayers.length} Jugadores | ${activeEnemies.length} Enemigos`,
      count: combatants.length,
      iconClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      badgeClass: 'bg-amber-500/20 text-amber-300',
      cta: 'Abrir combate',
    },
    {
      id: 'inventory',
      icon: Backpack,
      title: 'Inventario & Tesoro',
      detail: `${totalGp.toLocaleString()} PO acumulados`,
      count: items.length,
      iconClass: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      badgeClass: 'bg-yellow-500/20 text-yellow-300',
      cta: 'Ver inventario',
    },
    {
      id: 'monsters',
      icon: Skull,
      title: 'Monstruos & SRD',
      detail: 'Bestiario completo',
      count: monsters.length,
      iconClass: 'bg-red-500/10 border-red-500/30 text-red-400',
      badgeClass: 'bg-red-500/20 text-red-300',
      cta: 'Abrir bestiario',
    },
    {
      id: 'npcs',
      icon: Users,
      title: 'Gestor de NPCs',
      detail: 'Fichas y secretos DM',
      count: npcs.length,
      iconClass: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      badgeClass: 'bg-purple-500/20 text-purple-300',
      cta: 'Ver NPCs',
    },
    {
      id: 'spells',
      icon: BookOpen,
      title: 'Grimorio de Hechizos',
      detail: 'Biblioteca arcana',
      count: spells.length,
      iconClass: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
      badgeClass: 'bg-indigo-500/20 text-indigo-300',
      cta: 'Abrir grimorio',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Tool Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {CARDS.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.id}
              type="button"
              onClick={() => onSelectTab(card.id)}
              aria-label={`${card.title}: ${card.detail}. Abrir módulo.`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05, ease: 'easeOut' }}
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97 }}
              className="bg-dungeon-900 border border-dungeon-800 hover:border-amber-500/50 rounded-xl p-4 cursor-pointer transition shadow-md group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dungeon-950"
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`p-2.5 border rounded-lg transition group-hover:scale-110 ${card.iconClass}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded transition ${card.badgeClass}`}
                >
                  {card.count}
                </span>
              </div>
              <h3 className="font-bold text-slate-100 text-sm group-hover:text-amber-400 transition">
                {card.title}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{card.detail}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition">
                {card.cta} <ArrowRight className="w-3 h-3" />
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Resumen de la Sesión Actual (Session Status Banner) */}
      <div className="bg-gradient-to-r from-dungeon-900 via-dungeon-850 to-dungeon-900 border border-amber-500/30 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Resumen de la Sesión
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-semibold">
                Activa
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {activePlayers.length} Héroes en el grupo • {activeEnemies.length} Amenazas activas • {notes.length} Notas tomadas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-dungeon-950 border border-dungeon-800 px-3 py-1.5 rounded-lg text-xs">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-slate-400">Tesoro:</span>
            <strong className="text-yellow-400 font-mono">{totalGp.toLocaleString()} PO</strong>
          </div>
          <button
            onClick={() => onSelectTab('initiative')}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-450 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow transition"
          >
            <Swords className="w-3.5 h-3.5" />
            {combatants.length > 0 ? 'Ir al Combate' : 'Iniciar Encuentro'}
          </button>
        </div>
      </div>

      {/* Main Grid: Active Combat Preview + DM Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Active Combat Overview */}
        <div className="lg:col-span-2 space-y-4 bg-dungeon-900 border border-dungeon-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-dungeon-800 pb-3 gap-2 flex-wrap">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-400" />
              Estado del Combate Activo
              {wounded > 0 && (
                <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded-full font-semibold">
                  {wounded} heridos
                </span>
              )}
              {unconscious > 0 && (
                <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-semibold">
                  {unconscious} caídos
                </span>
              )}
            </h3>
            <button
              onClick={() => onSelectTab('initiative')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Abrir Rastreador
            </button>
          </div>

          {combatants.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm space-y-2">
              <p>No hay combate activo en este momento.</p>
              <button
                onClick={() => onSelectTab('initiative')}
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 underline font-semibold"
              >
                + Preparar o lanzar iniciativa
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {combatants.map(c => {
                  const hpPercent = Math.max(
                    0,
                    Math.min(100, Math.round((c.hp_current / c.hp_max) * 100))
                  );
                  const defeated = c.hp_current <= 0;
                  return (
                    <motion.div
                      key={c.id}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: defeated ? 0.5 : 1, filter: defeated ? 'grayscale(1)' : 'grayscale(0)' }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => onSelectTab('initiative')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectTab('initiative');
                        }
                      }}
                      className={`bg-dungeon-950 border rounded-lg p-3 flex items-center justify-between text-xs gap-3 cursor-pointer transition ${
                        c.is_player
                          ? 'border-blue-500/30 hover:border-blue-400/50'
                          : 'border-red-500/30 hover:border-red-400/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="bg-dungeon-900 border border-dungeon-800 text-amber-400 font-bold px-2 py-1 rounded shrink-0">
                          {c.initiative}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-bold text-slate-200 truncate ${defeated ? 'line-through decoration-red-500/70' : ''}`}>
                              {c.name}
                            </span>
                            {c.is_player ? (
                              <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-semibold inline-flex items-center gap-0.5">
                                <UserCheck className="w-2.5 h-2.5" /> PJ
                              </span>
                            ) : (
                              <span className="text-[9px] bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 py-0.2 rounded font-semibold inline-flex items-center gap-0.5">
                                <Skull className="w-2.5 h-2.5" /> Enemigo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                            <span>AC: {c.ac}</span>
                            {c.conditions.length > 0 && (
                              <span className="text-purple-300 text-[10px]">
                                • {c.conditions.slice(0, 2).join(', ')}{c.conditions.length > 2 ? '…' : ''}
                              </span>
                            )}
                            {defeated && <span className="text-red-400 font-semibold">• Fuera de combate</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-20 h-1.5 bg-dungeon-900 rounded-full overflow-hidden hidden sm:block">
                          <motion.div
                            className={`h-full ${hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-red-500'}`}
                            initial={false}
                            animate={{ width: `${hpPercent}%` }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                          />
                        </div>
                        <span className="text-red-400 font-semibold flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" />
                          <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                              key={c.hp_current}
                              initial={{ y: -8, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: 8, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                            >
                              {c.hp_current}/{c.hp_max}
                            </motion.span>
                          </AnimatePresence>
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right Column (1 col): DM Notes */}
        <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl p-5 shadow-lg">
          <QuickNotes notes={notes} onUpdateNotes={onUpdateNotes} highlightNoteId={highlightNoteId} />
        </div>
      </div>
    </div>
  );
};
