'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, Backpack, Skull, Users, BookOpen, 
  ArrowRight, Heart, Maximize2, Shield, Eye, Flame, Compass, Coins, Sparkles, Clock, History
} from 'lucide-react';
import { QuickNotes } from './QuickNotes';
import { Combatant, InventoryItem, Monster, NPC, PartyMember, Spell, DMNote, AuditLogEntry } from '@/types';

interface DmDashboardProps {
  combatants: Combatant[];
  items: InventoryItem[];
  monsters: Monster[];
  npcs: NPC[];
  spells: Spell[];
  notes: DMNote[];
  party: PartyMember[];
  auditLog?: AuditLogEntry[];
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
  party,
  auditLog = [],
  highlightNoteId,
  onUpdateNotes,
  onSelectTab,
}) => {
  const activeEnemies = combatants.filter(c => !c.is_player);
  const activePlayers = combatants.filter(c => c.is_player);
  const totalGp = items.reduce((acc, i) => acc + ((Number(i.value_gp) || 0) * (Number(i.quantity) || 1)), 0);
  const wounded = combatants.filter(c => c.hp_current < c.hp_max).length;
  const unconscious = combatants.filter(c => c.hp_current <= 0).length;

  const highestPerception = party.reduce((max, p) => {
    const val = p.passivePerception != null ? p.passivePerception : 10 + p.wisMod;
    return val > max ? val : max;
  }, 10);

  const averageAc = party.length
    ? Math.round((party.reduce((sum, p) => sum + p.ac, 0) / party.length) * 10) / 10
    : 10;

  const CARDS = [
    {
      id: 'party',
      icon: Users,
      title: 'Personajes',
      detail: `${party.length} PJs • CA prom ${averageAc}`,
      count: party.length,
      iconClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      badgeClass: 'bg-emerald-500/20 text-emerald-300',
      cta: 'Ver grupo',
    },
    {
      id: 'initiative',
      icon: Swords,
      title: 'Iniciativa',
      detail: `${activePlayers.length} PJs | ${activeEnemies.length} Enemigos`,
      count: combatants.length,
      iconClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      badgeClass: 'bg-amber-500/20 text-amber-300',
      cta: 'Abrir combate',
    },
    {
      id: 'inventory',
      icon: Backpack,
      title: 'Inventario & Tesoro',
      detail: `${Math.round(totalGp).toLocaleString()} PO acumulados`,
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
      {/* Tarjetas de acceso rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {CARDS.map(card => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.id}
              onClick={() => onSelectTab(card.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group card p-3.5 text-left border border-dungeon-800 hover:border-amber-500/40 transition duration-150 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg border ${card.iconClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-micro font-bold px-1.5 py-0.5 rounded ${card.badgeClass}`}>
                  {card.count}
                </span>
              </div>
              <h3 className="font-bold text-slate-100 text-xs sm:text-sm group-hover:text-amber-400 transition truncate">
                {card.title}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{card.detail}</p>
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
              Panel de Campaña
              <span className="text-micro bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-semibold">
                En Directo
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {party.length} Aventureros • CA media: <strong className="text-slate-200">{averageAc}</strong> • Mayor Percep. Pasiva: <strong className="text-amber-300">{highestPerception}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-dungeon-950 border border-dungeon-800 px-3 py-1.5 rounded-lg text-xs">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-slate-400">Tesoro:</span>
            <strong className="text-yellow-400 font-mono">{Math.round(totalGp).toLocaleString()} PO</strong>
          </div>
          <button
            onClick={() => onSelectTab('initiative')}
            className="btn btn-primary flex items-center gap-1.5 px-3 py-1.5 shadow text-xs"
          >
            <Swords className="w-3.5 h-3.5" />
            {combatants.length > 0 ? 'Ir al Combate' : 'Iniciar Encuentro'}
          </button>
        </div>
      </div>

      {/* Main Grid: Active Combat Preview + Recent Activity + DM Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Active Combat Overview + Activity Log */}
        <div className="space-y-6 lg:col-span-2">
          {/* Active Combat */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-dungeon-800 pb-3 gap-2 flex-wrap">
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                <Swords className="w-4 h-4 text-amber-400" />
                Estado del Combate Activo
                {wounded > 0 && (
                  <span className="text-micro bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded-full font-semibold">
                    {wounded} heridos
                  </span>
                )}
                {unconscious > 0 && (
                  <span className="text-micro bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-semibold">
                    {unconscious} caídos
                  </span>
                )}
              </h3>
              <button
                onClick={() => onSelectTab('initiative')}
                className="btn text-amber-400 hover:underline flex items-center gap-1 text-xs"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Abrir Rastreador
              </button>
            </div>

            {combatants.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs space-y-2">
                <p>No hay combate activo en este momento.</p>
                <button
                  onClick={() => onSelectTab('initiative')}
                  className="btn inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 underline"
                >
                  + Preparar o lanzar iniciativa
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {combatants.map((c, i) => {
                    const hpPercent = Math.max(0, Math.min(100, Math.round((c.hp_current / c.hp_max) * 100)));
                    const defeated = c.hp_current <= 0;

                    return (
                      <motion.div
                        key={c.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition ${
                          defeated
                            ? 'bg-dungeon-950/60 border-dungeon-800/60 opacity-60'
                            : c.is_player
                            ? 'bg-dungeon-900 border-amber-500/20 hover:border-amber-500/40'
                            : 'bg-dungeon-900 border-red-500/20 hover:border-red-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-amber-400 font-bold w-5 shrink-0 text-center">
                            #{i + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className={`font-bold truncate ${defeated ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                                {c.name}
                              </h4>
                              {c.is_player ? (
                                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                  PJ
                                </span>
                              ) : (
                                <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                  Enemigo
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] mt-0.5">
                              <span>AC: {c.ac}</span>
                              {c.conditions.length > 0 && (
                                <span className="text-purple-300">
                                  • {c.conditions.slice(0, 2).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-1.5 bg-dungeon-950 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={`h-full ${hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${hpPercent}%` }}
                            />
                          </div>
                          <span className="text-red-400 font-semibold flex items-center gap-1 font-mono">
                            <Heart className="w-3 h-3" />
                            {c.hp_current}/{c.hp_max}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Activity Changelog / Audit Trail */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between border-b border-dungeon-800 pb-2.5">
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                <History className="w-4 h-4 text-blue-400" />
                Historial de Actividad & Cambios
              </h3>
              <span className="text-[10px] text-slate-400">
                Últimos eventos
              </span>
            </div>

            {auditLog.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">Sin actividad reciente registrada.</p>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {auditLog.slice(0, 8).map(event => (
                  <div key={event.id} className="flex items-center justify-between text-xs bg-dungeon-950 px-2.5 py-1.5 rounded border border-dungeon-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-amber-400 font-semibold text-[10px] bg-amber-500/10 px-1 rounded border border-amber-500/20 shrink-0">
                        {event.author}
                      </span>
                      <span className="text-slate-200 truncate">{event.summary}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 col): DM Notes */}
        <div className="card">
          <QuickNotes notes={notes} onUpdateNotes={onUpdateNotes} highlightNoteId={highlightNoteId} />
        </div>
      </div>
    </div>
  );
};
