'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Shield, Eye, Heart, Swords, Trash2, Edit2, Skull, Coins, Package } from 'lucide-react';
import { Combatant, InventoryItem, PartyMember } from '@/types';
import { useToast } from '@/components/Toast';

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
  /** Inventario de la campaña: se sincroniza al renombrar o borrar un PJ. */
  items: InventoryItem[];
  onUpdateItems: (items: InventoryItem[]) => void;
}  const passivePerception = (m: PartyMember) =>
  m.passivePerception != null ? m.passivePerception : 10 + m.wisMod;

/** Limita un número al rango válido; si no es numérico usa el valor por defecto. */
const clampNum = (v: number, min: number, max: number, fallback: number) =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

export const PartyManager: React.FC<PartyManagerProps> = ({
  members,
  onUpdateMembers,
  combatants,
  onUpdateCombatants,
  items,
  onUpdateItems,
}) => {
  const toast = useToast();
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
    const cleanName = name.trim();
    if (!cleanName) return;
    const passiveRaw = passiveInput.trim() === '' ? null : Number(passiveInput);
    const passive = passiveRaw === null ? null : clampNum(passiveRaw, 0, 40, 10 + wisMod);
    const safeLevel = clampNum(level, 1, 20, 1);
    const safeAc = clampNum(ac, 0, 30, 10);
    const safeMaxHp = clampNum(maxHp, 1, 999, 1);
    const safeWis = clampNum(wisMod, -5, 10, 0);
    const safeInitiative = clampNum(initiative, -10, 30, 10);

    if (editingId) {
      const target = members.find(m => m.id === editingId);
      onUpdateMembers(
        members.map(m =>
          m.id === editingId
            ? {
                ...m,
                name: cleanName,
                className: className.trim() || 'Aventurero',
                level: safeLevel,
                ac: safeAc,
                maxHp: safeMaxHp,
                wisMod: safeWis,
                passivePerception: passive,
                initiative: safeInitiative,
              }
            : m
        )
      );
      // Sincroniza el inventario: los objetos asignados le siguen al cambiar de nombre.
      if (target && target.name !== cleanName) {
        const renamed = items.some(i => i.assigned_to === target.name);
        if (renamed) {
          onUpdateItems(
            items.map(i => i.assigned_to === target.name ? { ...i, assigned_to: cleanName } : i)
          );
        }
      }
    } else {
      const member: PartyMember = {
        id: `party-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: cleanName,
        className: className.trim() || 'Aventurero',
        level: safeLevel,
        ac: safeAc,
        maxHp: safeMaxHp,
        wisMod: safeWis,
        passivePerception: passive,
        initiative: safeInitiative,
      };
      onUpdateMembers([...members, member]);
    }
    setIsModalOpen(false);
    toast.success(editingId ? `Ficha de ${cleanName} actualizada.` : `Ficha de ${cleanName} creada.`);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const target = members.find(m => m.id === id);
    if (!target) return;
    if (!window.confirm(`¿Eliminar a ${target.name} del grupo? También saldrá del combate si estaba en él.`)) return;
    onUpdateMembers(members.filter(m => m.id !== id));
    // Si estaba en combate, también sale de la iniciativa.
    onUpdateCombatants(combatants.filter(c => c.id !== id));
    // Sus objetos pasan a la Bolsa General en lugar de quedarse huérfanos.
    const carriesItems = items.some(i => i.assigned_to === target.name);
    if (carriesItems) {
      onUpdateItems(
        items.map(i => i.assigned_to === target.name ? { ...i, assigned_to: 'Bolsa General' } : i)
      );
    }
    toast.success(`${target.name} eliminado del grupo.`);
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
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Users className="w-6 h-6 text-blue-400" />
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
          className="btn flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-3 py-2 text-sm border border-amber-500/30"
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
            className="btn btn-primary mt-4 text-sm"
          >
            Añadir PJ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence initial={false}>
            {members.map(m => {
              const live = inCombat(m);
              const carriedItems = items.filter(i => i.assigned_to === m.name);
              const carriedGold = carriedItems.reduce((sum, i) => sum + (Number(i.value_gp) || 0), 0);
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
                      <p className="text-micro text-slate-400">
                        Nivel {m.level} {m.className}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(m)}
                        className="btn btn-icon text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                        title="Editar ficha" aria-label="Editar ficha"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="btn btn-icon text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        title="Eliminar del grupo" aria-label="Eliminar del grupo"
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

                  {/* Inventario portado: sincronizado con la sección Inventario */}
                  <div className="flex items-center justify-between text-micro bg-dungeon-950 border border-dungeon-800 rounded-lg px-2.5 py-1.5">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                      {carriedItems.length} objeto{carriedItems.length === 1 ? '' : 's'}
                    </span>
                    <span
                      className="flex items-center gap-1.5 font-semibold text-yellow-400"
                      title="Valor total de los objetos asignados a este personaje"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      {carriedGold.toLocaleString()} PO
                    </span>
                  </div>

                  {/* HP en vivo si está en combate */}
                  {live ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-micro">
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
                        className="btn flex-1 flex items-center justify-center gap-1.5 bg-dungeon-800 hover:bg-dungeon-700 text-slate-300 px-3 py-2 min-h-[40px]"
                      >
                        <Skull className="w-3.5 h-3.5" /> Quitar del combate
                      </button>
                    ) : (
                      <button
                        onClick={() => sendToCombat(m)}
                        className="btn flex-1 flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-2 min-h-[40px]"
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
          <div className="card p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100 border-b border-dungeon-800 pb-2">
              {editingId ? 'Editar personaje' : 'Añadir personaje jugador'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nombre</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Lira Vientosol"
                    className="input min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="label">Clase</label>
                  <input
                    type="text"
                    value={className}
                    onChange={e => setClassName(e.target.value)}
                    placeholder="Ej: Pícara 5"
                    className="input min-h-[42px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Nivel</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={level}
                    onChange={e => setLevel(Number(e.target.value))}
                    className="input min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="label">CA</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={30}
                    value={ac}
                    onChange={e => setAc(Number(e.target.value))}
                    className="input min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="label">HP máximo</label>
                  <input
                    type="number"
                    min={1}
                    value={maxHp}
                    onChange={e => setMaxHp(Number(e.target.value))}
                    className="input min-h-[42px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Mod. Sabiduría</label>
                  <input
                    type="number"
                    min={-5}
                    max={10}
                    value={wisMod}
                    onChange={e => setWisMod(Number(e.target.value))}
                    className="input min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="label">Percep. pasiva*</label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={passiveInput}
                    onChange={e => setPassiveInput(e.target.value)}
                    placeholder={String(10 + wisMod)}
                    className="input min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="label">Iniciativa</label>
                  <input
                    type="number"
                    min={-10}
                    max={30}
                    value={initiative}
                    onChange={e => setInitiative(Number(e.target.value))}
                    className="input min-h-[42px]"
                  />
                </div>
              </div>
              <p className="text-micro text-slate-500">* Vacío = 10 + mod. Sabiduría.</p>

              <div className="flex justify-end gap-2 pt-2 border-t border-dungeon-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="btn px-4 py-2 text-sm text-slate-400 hover:bg-dungeon-800 min-h-[42px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-sm min-h-[42px]"
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
