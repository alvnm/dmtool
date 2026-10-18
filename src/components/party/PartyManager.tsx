'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Shield, Eye, Heart, Swords, Trash2, Edit2, Skull } from 'lucide-react';
import { Combatant, PartyMember } from '@/types';

/**
 * Ficha resumen del grupo: lo que el DM necesita mirar sin pestañas de más
 * mientras narra (CA, percepción pasiva y HP máximo) + acceso al combate.
 */
export type { PartyMember };

interface PartyManagerProps {
  members: PartyMember[];
  onUpdateMembers: (members: PartyMember[]) => void;
  combatants: Combatant[];
  onUpdateCombatants: (combatants: Combatant[]) => void;
}

const passivePerception = (m: PartyMember) =>
  m.passivePerception != null ? m.passivePerception : 10 + m.wisMod;

export const PartyManager: React.FC<PartyManagerProps> = ({
  members,
  onUpdateMembers,
  combatants,
  onUpdateCombatants,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [level, setLevel] = useState(1);
  const [ac, setAc] = useState(15);
  const [maxHp, setMaxHp] = useState(10);
  const [wisMod, setWisMod] = useState(1);
  const [passiveInput, setPassiveInput] = useState('');
  const [initiative, setInitiative] = useState(10);

  const resetForm = () => {
    setName('');
    setClassName('');
    setLevel(1);
    setAc(15);
    setMaxHp(10);
    setWisMod(1);
    setPassiveInput('');
    setInitiative(10);
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (m: PartyMember) => {
    setEditingId(m.id);
    setName(m.name);
    setClassName(m.className);
    setLevel(m.level);
    setAc(m.ac);
    setMaxHp(m.maxHp);
    setWisMod(m.wisMod);
    setPassiveInput(m.passivePerception != null ? String(m.passivePerception) : '');
    setInitiative(m.initiative);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const passive = passiveInput.trim() === '' ? null : Number(passiveInput);

    if (editingId) {
      onUpdateMembers(
        members.map(m =>
          m.id === editingId
            ? {
                ...m,
                name,
                className: className.trim() || 'Aventurero',
                level,
                ac,
                maxHp,
                wisMod,
                passivePerception: passive,
                initiative,
              }
            : m
        )
      );
    } else {
      const member: PartyMember = {
        id: `party-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name,
        className: className.trim() || 'Aventurero',
        level,
        ac,
        maxHp,
        wisMod,
        passivePerception: passive,
        initiative,
      };
      onUpdateMembers([...members, member]);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    onUpdateMembers(members.filter(m => m.id !== id));
    // Si estaba en combate, también sale de la iniciativa.
    onUpdateCombatants(combatants.filter(c => c.id !== id));
  };

  const inCombat = (m: PartyMember) => combatants.find(c => c.id === m.id);

  const sendToCombat = (m: PartyMember) => {
    if (inCombat(m)) return;
    const combatant: Combatant = {
      id: m.id, // el mismo id enlaza la ficha con su fila de combate (HP en vivo)
      name: m.name,
      initiative: m.initiative,
      hp_current: m.maxHp,
      hp_max: m.maxHp,
      ac: m.ac,
      is_player: true,
      conditions: [],
      condition_rounds: {},
    };
    const updated = [...combatants, combatant].sort((a, b) => b.initiative - a.initiative);
    onUpdateCombatants(updated);
  };

  const removeFromCombat = (m: PartyMember) => {
    onUpdateCombatants(combatants.filter(c => c.id !== m.id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Gestor de Jugadores</h2>
            <p className="text-xs text-slate-400">
              {members.length} PJ{members.length === 1 ? '' : 's'} en la party • CA, percepción pasiva y HP máximo a un vistazo
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-3 py-2 rounded-lg text-sm border border-amber-500/30 transition"
        >
          <Plus className="w-4 h-4" /> Nuevo PJ
        </button>
      </div>

      {/* Lista de fichas */}
      {members.length === 0 ? (
        <div className="text-center py-16 bg-dungeon-900/50 border border-dashed border-dungeon-800 rounded-xl">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">Todavía no hay personajes</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Añade a tus jugadores con su CA, HP máximo y percepción pasiva para tenerlo todo a mano durante la sesión.
          </p>
          <button
            onClick={openAdd}
            className="mt-4 bg-amber-500 text-slate-950 px-4 py-2 rounded-lg font-medium text-sm hover:bg-amber-400 transition"
          >
            Añadir PJ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence initial={false}>
            {members.map(m => {
              const live = inCombat(m);
              const hpPercent = live
                ? Math.max(0, Math.min(100, Math.round((live.hp_current / live.hp_max) * 100)))
                : 100;
              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-dungeon-900 border border-dungeon-800 rounded-xl p-4 shadow-md flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-100 truncate">{m.name}</h3>
                      <p className="text-[11px] text-slate-400">
                        Nivel {m.level} {m.className}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(m)}
                        className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded transition"
                        title="Editar ficha"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                        title="Eliminar del grupo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Estadísticas clave */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-dungeon-950 border border-dungeon-800 rounded-lg py-2">
                      <Shield className="w-3.5 h-3.5 text-amber-400 mx-auto mb-0.5" />
                      <p className="text-[9px] uppercase tracking-wider text-slate-500">CA</p>
                      <p className="font-bold text-slate-100">{m.ac}</p>
                    </div>
                    <div className="bg-dungeon-950 border border-dungeon-800 rounded-lg py-2">
                      <Eye className="w-3.5 h-3.5 text-blue-400 mx-auto mb-0.5" />
                      <p className="text-[9px] uppercase tracking-wider text-slate-500">Percep. pas.</p>
                      <p className="font-bold text-slate-100">{passivePerception(m)}</p>
                    </div>
                    <div className="bg-dungeon-950 border border-dungeon-800 rounded-lg py-2">
                      <Heart className="w-3.5 h-3.5 text-red-400 mx-auto mb-0.5" />
                      <p className="text-[9px] uppercase tracking-wider text-slate-500">HP máx</p>
                      <p className="font-bold text-slate-100">{m.maxHp}</p>
                    </div>
                  </div>

                  {/* HP en vivo si está en combate */}
                  {live ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">En combate</span>
                        <span className="font-semibold text-red-400">
                          {live.hp_current}/{live.hp_max} PV
                        </span>
                      </div>
                      <div className="w-full bg-dungeon-950 h-2 rounded-full overflow-hidden border border-dungeon-800">
                        <motion.div
                          className={`h-full ${hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-red-600'}`}
                          initial={false}
                          animate={{ width: `${hpPercent}%` }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-auto flex gap-2">
                    {live ? (
                      <button
                        onClick={() => removeFromCombat(m)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-dungeon-800 hover:bg-dungeon-700 text-slate-300 px-3 py-2 rounded-lg transition min-h-[40px]"
                      >
                        <Skull className="w-3.5 h-3.5" /> Quitar del combate
                      </button>
                    ) : (
                      <button
                        onClick={() => sendToCombat(m)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-2 rounded-lg transition min-h-[40px]"
                      >
                        <Swords className="w-3.5 h-3.5" /> Enviar al combate
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal alta/edición */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100 border-b border-dungeon-800 pb-2">
              {editingId ? 'Editar personaje' : 'Añadir personaje jugador'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Lira Vientosol"
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Clase</label>
                  <input
                    type="text"
                    value={className}
                    onChange={e => setClassName(e.target.value)}
                    placeholder="Ej: Pícara 5"
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none min-h-[42px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nivel</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={level}
                    onChange={e => setLevel(Number(e.target.value))}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">CA</label>
                  <input
                    type="number"
                    value={ac}
                    onChange={e => setAc(Number(e.target.value))}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">HP máximo</label>
                  <input
                    type="number"
                    min={1}
                    value={maxHp}
                    onChange={e => setMaxHp(Number(e.target.value))}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none min-h-[42px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mod. Sabiduría</label>
                  <input
                    type="number"
                    min={-5}
                    max={10}
                    value={wisMod}
                    onChange={e => setWisMod(Number(e.target.value))}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Percep. pasiva*</label>
                  <input
                    type="number"
                    value={passiveInput}
                    onChange={e => setPassiveInput(e.target.value)}
                    placeholder={String(10 + wisMod)}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Iniciativa</label>
                  <input
                    type="number"
                    value={initiative}
                    onChange={e => setInitiative(Number(e.target.value))}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none min-h-[42px]"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500">* Vacío = 10 + mod. Sabiduría.</p>

              <div className="flex justify-end gap-2 pt-2 border-t border-dungeon-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-dungeon-800 transition min-h-[42px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition min-h-[42px]"
                >
                  {editingId ? 'Guardar cambios' : 'Añadir PJ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
