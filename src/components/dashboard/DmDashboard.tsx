'use client';

import React from 'react';
import { 
  Swords, Backpack, Skull, Users, BookOpen, 
  Sparkles, ArrowRight, Shield, Heart, Zap, Coins
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
  onUpdateNotes,
  onSelectTab,
}) => {
  const activeEnemies = combatants.filter(c => !c.is_player);
  const activePlayers = combatants.filter(c => c.is_player);
  const totalGp = items.reduce((acc, i) => acc + (Number(i.value_gp) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Quick Tool Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Initiative Tracker Shortcut */}
        <div
          onClick={() => onSelectTab('initiative')}
          className="bg-dungeon-900 border border-dungeon-800 hover:border-amber-500/50 rounded-xl p-4 cursor-pointer transition shadow-md group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 group-hover:scale-105 transition">
              <Swords className="w-5 h-5" />
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded">
              {combatants.length}
            </span>
          </div>
          <h3 className="font-bold text-slate-100 text-sm group-hover:text-amber-400 transition">Iniciativa</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {activePlayers.length} Jugadores | {activeEnemies.length} Enemigos
          </p>
        </div>

        {/* Inventory Tracker Shortcut */}
        <div
          onClick={() => onSelectTab('inventory')}
          className="bg-dungeon-900 border border-dungeon-800 hover:border-amber-500/50 rounded-xl p-4 cursor-pointer transition shadow-md group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 group-hover:scale-105 transition">
              <Backpack className="w-5 h-5" />
            </div>
            <span className="text-xs bg-yellow-500/20 text-yellow-300 font-bold px-2 py-0.5 rounded">
              {items.length}
            </span>
          </div>
          <h3 className="font-bold text-slate-100 text-sm group-hover:text-amber-400 transition">Inventario & Tesoro</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {totalGp.toLocaleString()} PO acumulados
          </p>
        </div>

        {/* Monster Compendium Shortcut */}
        <div
          onClick={() => onSelectTab('monsters')}
          className="bg-dungeon-900 border border-dungeon-800 hover:border-amber-500/50 rounded-xl p-4 cursor-pointer transition shadow-md group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 group-hover:scale-105 transition">
              <Skull className="w-5 h-5" />
            </div>
            <span className="text-xs bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded">
              {monsters.length}
            </span>
          </div>
          <h3 className="font-bold text-slate-100 text-sm group-hover:text-amber-400 transition">Monstruos & SRD</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Bestiario completo</p>
        </div>

        {/* NPC Manager Shortcut */}
        <div
          onClick={() => onSelectTab('npcs')}
          className="bg-dungeon-900 border border-dungeon-800 hover:border-amber-500/50 rounded-xl p-4 cursor-pointer transition shadow-md group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 group-hover:scale-105 transition">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded">
              {npcs.length}
            </span>
          </div>
          <h3 className="font-bold text-slate-100 text-sm group-hover:text-amber-400 transition">Gestor de NPCs</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Fichas y secretos DM</p>
        </div>

        {/* Spellbook Shortcut */}
        <div
          onClick={() => onSelectTab('spells')}
          className="bg-dungeon-900 border border-dungeon-800 hover:border-amber-500/50 rounded-xl p-4 cursor-pointer transition shadow-md group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400 group-hover:scale-105 transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded">
              {spells.length}
            </span>
          </div>
          <h3 className="font-bold text-slate-100 text-sm group-hover:text-amber-400 transition">Grimorio de Hechizos</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Biblioteca arcana</p>
        </div>
      </div>

      {/* Main Grid: Active Combat Preview + DM Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Active Combat Overview */}
        <div className="lg:col-span-2 space-y-4 bg-dungeon-900 border border-dungeon-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-dungeon-800 pb-3">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-400" />
              Estado del Combate Activo
            </h3>
            <button
              onClick={() => onSelectTab('initiative')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              Abrir Rastreador <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {combatants.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No hay combate activo. Selecciona el Rastreador para iniciar un encuentro.
            </div>
          ) : (
            <div className="space-y-2">
              {combatants.map((c, i) => (
                <div
                  key={c.id}
                  className="bg-dungeon-950 border border-dungeon-800 rounded-lg p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-dungeon-900 border border-dungeon-800 text-amber-400 font-bold px-2 py-1 rounded">
                      INIT: {c.initiative}
                    </span>
                    <div>
                      <span className="font-bold text-slate-200">{c.name}</span>
                      <span className="text-slate-500 ml-2">AC: {c.ac}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-red-400 font-semibold flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" /> {c.hp_current}/{c.hp_max}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (1 col): DM Notes */}
        <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl p-5 shadow-lg">
          <QuickNotes notes={notes} onUpdateNotes={onUpdateNotes} />
        </div>
      </div>
    </div>
  );
};
