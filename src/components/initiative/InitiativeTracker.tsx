'use client';

import React, { useState } from 'react';
import { Combatant, Monster, NPC } from '@/types';
import { 
  Swords, Plus, Trash2, Shield, Heart, ArrowRight, 
  RotateCcw, Sparkles, UserCheck, Skull, ChevronUp, ChevronDown
} from 'lucide-react';

interface InitiativeTrackerProps {
  combatants: Combatant[];
  monsters: Monster[];
  npcs: NPC[];
  onUpdateCombatants: (combatants: Combatant[]) => void;
}

export const InitiativeTracker: React.FC<InitiativeTrackerProps> = ({
  combatants,
  monsters,
  npcs,
  onUpdateCombatants,
}) => {
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  
  // Custom new combatant form state
  const [newName, setNewName] = useState('');
  const [newInitiative, setNewInitiative] = useState(10);
  const [newHp, setNewHp] = useState(10);
  const [newAc, setNewAc] = useState(10);
  const [isPlayer, setIsPlayer] = useState(false);

  // Condition toggle options
  const AVAILABLE_CONDITIONS = [
    'Cegado', 'Encantado', 'Ensordecido', 'Asustado', 
    'Agarrado', 'Incapacitado', 'Invisible', 'Paralizado', 
    'Petrificado', 'Envenenado', 'Derribado', 'Apresado', 
    'Aturdido', 'Inconsciente'
  ];

  const sortCombatants = (list: Combatant[]) => {
    return [...list].sort((a, b) => b.initiative - a.initiative);
  };

  const handleNextTurn = () => {
    if (combatants.length === 0) return;
    if (currentTurnIndex >= combatants.length - 1) {
      setCurrentTurnIndex(0);
      setRound(prev => prev + 1);
    } else {
      setCurrentTurnIndex(prev => prev + 1);
    }
  };

  const handleResetCombat = () => {
    setCurrentTurnIndex(0);
    setRound(1);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newCombatant: Combatant = {
      id: `comb-${Date.now()}`,
      name: newName,
      initiative: Number(newInitiative),
      hp_current: Number(newHp),
      hp_max: Number(newHp),
      ac: Number(newAc),
      is_player: isPlayer,
      conditions: [],
    };

    const updated = sortCombatants([...combatants, newCombatant]);
    onUpdateCombatants(updated);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleImportMonster = (monster: Monster) => {
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

    const updated = sortCombatants([...combatants, imported]);
    onUpdateCombatants(updated);
  };

  const handleImportNpc = (npc: NPC) => {
    const imported: Combatant = {
      id: `comb-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: npc.name,
      initiative: Math.floor(Math.random() * 20) + 1,
      hp_current: 12,
      hp_max: 12,
      ac: 12,
      is_player: false,
      conditions: [],
    };

    const updated = sortCombatants([...combatants, imported]);
    onUpdateCombatants(updated);
  };

  const handleHpChange = (id: string, delta: number) => {
    const updated = combatants.map(c => {
      if (c.id === id) {
        const nextHp = Math.max(0, Math.min(c.hp_max, c.hp_current + delta));
        return { ...c, hp_current: nextHp };
      }
      return c;
    });
    onUpdateCombatants(updated);
  };

  const handleToggleCondition = (combatantId: string, condition: string) => {
    const updated = combatants.map(c => {
      if (c.id === combatantId) {
        const hasCond = c.conditions.includes(condition);
        const newConds = hasCond
          ? c.conditions.filter(item => item !== condition)
          : [...c.conditions, condition];
        return { ...c, conditions: newConds };
      }
      return c;
    });
    onUpdateCombatants(updated);
  };

  const handleRemoveCombatant = (id: string) => {
    const updated = combatants.filter(c => c.id !== id);
    if (currentTurnIndex >= updated.length) {
      setCurrentTurnIndex(Math.max(0, updated.length - 1));
    }
    onUpdateCombatants(updated);
  };

  const resetForm = () => {
    setNewName('');
    setNewInitiative(10);
    setNewHp(10);
    setNewAc(10);
    setIsPlayer(false);
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Rastreador de Iniciativa
              <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                Ronda {round}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {combatants.length} Combatientes registrados | Turno actual: {combatants[currentTurnIndex]?.name || 'Ninguno'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleNextTurn}
            disabled={combatants.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg shadow transition disabled:opacity-50"
          >
            Siguiente Turno
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetCombat}
            className="flex items-center gap-1.5 bg-dungeon-800 hover:bg-dungeon-700 text-slate-300 px-3 py-2 rounded-lg text-sm border border-dungeon-700 transition"
            title="Reiniciar rondas y turnos"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            Reiniciar
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 bg-dungeon-800 hover:bg-dungeon-700 text-amber-400 px-3 py-2 rounded-lg text-sm border border-dungeon-700 transition"
          >
            <Sparkles className="w-4 h-4" />
            Importar Monstruo / NPC
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-3 py-2 rounded-lg text-sm border border-amber-500/30 transition"
          >
            <Plus className="w-4 h-4" />
            Nuevo Combatiente
          </button>
        </div>
      </div>

      {/* Combatants List */}
      {combatants.length === 0 ? (
        <div className="text-center py-16 bg-dungeon-900/50 border border-dashed border-dungeon-800 rounded-xl">
          <Skull className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No hay combatientes en escena</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Agrega jugadores o importa monstruos desde tu compendio para comenzar la secuencia de combate.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="bg-amber-500 text-slate-950 px-4 py-2 rounded-lg font-medium text-sm hover:bg-amber-400 transition"
            >
              Importar del Compendio
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {combatants.map((c, index) => {
            const isActive = index === currentTurnIndex;
            const hpPercent = Math.max(0, Math.min(100, Math.round((c.hp_current / c.hp_max) * 100)));

            return (
              <div
                key={c.id}
                className={`relative rounded-xl border transition-all duration-200 overflow-hidden ${
                  isActive
                    ? 'bg-dungeon-850 border-amber-500/80 ring-1 ring-amber-500/50 shadow-xl'
                    : 'bg-dungeon-900 border-dungeon-800 hover:border-dungeon-700'
                }`}
              >
                {/* Turn indicator bar */}
                {isActive && (
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-amber-600" />
                )}

                <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="flex items-center gap-4 min-w-[220px]">
                    <div className="flex flex-col items-center justify-center bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 min-w-[50px]">
                      <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">INIT</span>
                      <span className="text-xl font-bold text-amber-400">{c.initiative}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-100 text-lg">{c.name}</h3>
                        {c.is_player ? (
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-500/30 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Jugador
                          </span>
                        ) : (
                          <span className="text-[10px] bg-red-500/20 text-red-300 font-semibold px-2 py-0.5 rounded border border-red-500/30 flex items-center gap-1">
                            <Skull className="w-3 h-3" /> Enemigo
                          </span>
                        )}
                      </div>

                      {/* Armor Class */}
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-medium bg-dungeon-950 px-2 py-0.5 rounded border border-dungeon-800 text-slate-300">
                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                          AC: {c.ac}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* HP Controls */}
                  <div className="flex flex-col items-center gap-1 min-w-[200px] flex-1 max-w-xs">
                    <div className="flex items-center justify-between w-full text-xs font-semibold text-slate-300">
                      <span className="flex items-center gap-1 text-red-400">
                        <Heart className="w-3.5 h-3.5 fill-red-400/20" /> HP:
                      </span>
                      <span>
                        {c.hp_current} / {c.hp_max}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-dungeon-950 h-2 rounded-full overflow-hidden border border-dungeon-800">
                      <div
                        className={`h-full transition-all duration-300 ${
                          hpPercent > 50
                            ? 'bg-emerald-500'
                            : hpPercent > 20
                            ? 'bg-amber-500'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${hpPercent}%` }}
                      />
                    </div>

                    {/* Quick HP Adjustment Buttons */}
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        onClick={() => handleHpChange(c.id, -5)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/20"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => handleHpChange(c.id, -1)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/20"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => handleHpChange(c.id, 1)}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/20"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleHpChange(c.id, 5)}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/20"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  {/* Conditions & Actions */}
                  <div className="flex items-center gap-2">
                    {/* Conditions Pill Selector */}
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {c.conditions.map(cond => (
                        <span
                          key={cond}
                          onClick={() => handleToggleCondition(c.id, cond)}
                          className="cursor-pointer text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded hover:bg-purple-900 transition"
                          title="Haz clic para remover condición"
                        >
                          {cond} ×
                        </span>
                      ))}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleToggleCondition(c.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="bg-dungeon-950 border border-dungeon-800 text-slate-400 text-xs rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-500"
                        defaultValue=""
                      >
                        <option value="" disabled>+ Estado</option>
                        {AVAILABLE_CONDITIONS.map(cond => (
                          <option key={cond} value={cond}>
                            {cond}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => handleRemoveCombatant(c.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                      title="Eliminar de la iniciativa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Create Custom Combatant */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100 border-b border-dungeon-800 pb-2">
              Agregar Nuevo Combatiente
            </h3>

            <form onSubmit={handleAddCustom} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ej: Aragorn / Goblin Asesino"
                  className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Iniciativa</label>
                  <input
                    type="number"
                    required
                    value={newInitiative}
                    onChange={e => setNewInitiative(Number(e.target.value))}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">HP Máximo</label>
                  <input
                    type="number"
                    required
                    value={newHp}
                    onChange={e => setNewHp(Number(e.target.value))}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">AC</label>
                  <input
                    type="number"
                    required
                    value={newAc}
                    onChange={e => setNewAc(Number(e.target.value))}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPlayerCheck"
                  checked={isPlayer}
                  onChange={e => setIsPlayer(e.target.checked)}
                  className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="isPlayerCheck" className="text-sm text-slate-300 cursor-pointer">
                  ¿Es un personaje jugador (PC)?
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-dungeon-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-dungeon-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
                >
                  Agregar Combatiente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Import from Monster / NPC Database */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-dungeon-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Importar al Combate desde la Base de Datos
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">
                  Monstruos Disponibles ({monsters.length})
                </h4>
                <div className="space-y-2">
                  {monsters.map(m => (
                    <div
                      key={m.id}
                      className="bg-dungeon-950 border border-dungeon-800 hover:border-amber-500/50 rounded-lg p-3 flex items-center justify-between transition"
                    >
                      <div>
                        <span className="font-bold text-slate-200 text-sm">{m.name}</span>
                        <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                          <span>CR: {m.cr}</span>
                          <span>AC: {m.ac}</span>
                          <span>HP: {m.hp_max}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleImportMonster(m)}
                        className="bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-semibold px-3 py-1.5 rounded transition"
                      >
                        + Añadir al Combate
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">
                  NPCs Registrados ({npcs.length})
                </h4>
                <div className="space-y-2">
                  {npcs.map(n => (
                    <div
                      key={n.id}
                      className="bg-dungeon-950 border border-dungeon-800 hover:border-amber-500/50 rounded-lg p-3 flex items-center justify-between transition"
                    >
                      <div>
                        <span className="font-bold text-slate-200 text-sm">{n.name}</span>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {n.race} • {n.disposition}
                        </div>
                      </div>
                      <button
                        onClick={() => handleImportNpc(n)}
                        className="bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-semibold px-3 py-1.5 rounded transition"
                      >
                        + Añadir al Combate
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-dungeon-800">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="bg-dungeon-800 text-slate-300 px-4 py-2 rounded-lg text-sm hover:bg-dungeon-700 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
