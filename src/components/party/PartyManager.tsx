'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Shield, Eye, Heart, Swords, Trash2, Edit2, Skull, Coins, Package, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Combatant, InventoryItem, PartyMember } from '@/types';
import { useToast } from '@/components/Toast';

export type { PartyMember };

interface PartyManagerProps {
  members: PartyMember[];
  onUpdateMembers: (members: PartyMember[]) => void;
  combatants: Combatant[];
  onUpdateCombatants: (combatants: Combatant[]) => void;
  items: InventoryItem[];
  onUpdateItems: (items: InventoryItem[]) => void;
  onLogEvent?: (entry: { author: string; entityType: 'party'; action: 'create' | 'update' | 'delete'; summary: string }) => void;
}

const passivePerception = (m: PartyMember) =>
  m.passivePerception != null ? m.passivePerception : 10 + m.wisMod;

const clampNum = (v: number, min: number, max: number, fallback: number) =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

export const PartyManager: React.FC<PartyManagerProps> = ({
  members,
  onUpdateMembers,
  combatants,
  onUpdateCombatants,
  items,
  onUpdateItems,
  onLogEvent,
}) => {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedInventoryId, setExpandedInventoryId] = useState<string | null>(null);

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
      if (target && target.name !== cleanName) {
        onUpdateItems(
          items.map(i => i.assigned_to === target.name ? { ...i, assigned_to: cleanName } : i)
        );
      }
      onLogEvent?.({
        author: 'DM',
        entityType: 'party',
        action: 'update',
        summary: `Ficha de «${cleanName}» actualizada`,
      });
      toast.success(`Ficha de «${cleanName}» guardada.`);
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
      onLogEvent?.({
        author: 'DM',
        entityType: 'party',
        action: 'create',
        summary: `Personaje «${cleanName}» añadido al grupo`,
      });
      toast.success(`Personaje «${cleanName}» añadido al grupo.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const target = members.find(m => m.id === id);
    if (!target) return;
    if (!window.confirm(`¿Quitar a «${target.name}» del grupo? (Sus objetos en inventario pasarán a «Bolsa General»).`)) return;
    onUpdateMembers(members.filter(m => m.id !== id));
    onUpdateItems(items.map(i => i.assigned_to === target.name ? { ...i, assigned_to: 'Bolsa General' } : i));
    onLogEvent?.({
      author: 'DM',
      entityType: 'party',
      action: 'delete',
      summary: `Personaje «${target.name}» eliminado del grupo`,
    });
    toast.success(`«${target.name}» eliminado.`);
  };

  const inCombat = (m: PartyMember) =>
    combatants.find(c => c.is_player && c.name.toLowerCase() === m.name.toLowerCase());

  const sendToCombat = (m: PartyMember) => {
    if (inCombat(m)) {
      toast.info(`«${m.name}» ya está en el combate.`);
      return;
    }
    const newCombatant: Combatant = {
      id: `combatant-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: m.name,
      initiative: m.initiative || 10,
      hp_current: m.maxHp,
      hp_max: m.maxHp,
      ac: m.ac,
      is_player: true,
      conditions: [],
    };
    onUpdateCombatants([...combatants, newCombatant]);
    toast.success(`«${m.name}» añadido a la lista de iniciativa.`);
  };

  const removeFromCombat = (m: PartyMember) => {
    const found = inCombat(m);
    if (!found) return;
    onUpdateCombatants(combatants.filter(c => c.id !== found.id));
    toast.info(`«${m.name}» retirado del combate.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dungeon-900 border border-dungeon-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Grupo de Aventureros</h2>
            <p className="text-xs text-slate-400">
              {members.length} PJ{members.length === 1 ? '' : 's'} en la party • CA, percepción pasiva, HP y equipo equipado
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="btn flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-3 py-2 text-sm border border-amber-500/30"
        >
          <Plus className="w-4 h-4" /> Nuevo PJ
        </button>
      </div>

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
              const carriedGold = carriedItems.reduce((sum, i) => sum + ((Number(i.value_gp) || 0) * (Number(i.quantity) || 1)), 0);
              const equippedItems = carriedItems.filter(i => i.equipped);
              const isExpanded = expandedInventoryId === m.id;
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

                  {/* Resumen de Inventario y Equipo */}
                  <div className="bg-dungeon-950 border border-dungeon-800 rounded-lg p-2.5 space-y-2">
                    <div 
                      onClick={() => setExpandedInventoryId(isExpanded ? null : m.id)}
                      className="flex items-center justify-between text-micro cursor-pointer select-none"
                    >
                      <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                        <Package className="w-3.5 h-3.5 text-amber-400" />
                        {carriedItems.length} objetos ({equippedItems.length} equipados)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400 font-bold flex items-center gap-1">
                          <Coins className="w-3 h-3" /> {Math.round(carriedGold)} PO
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-2 border-t border-dungeon-800 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {carriedItems.length === 0 ? (
                          <p className="text-micro text-slate-500 italic">Sin objetos asignados.</p>
                        ) : (
                          carriedItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between text-micro bg-dungeon-900/80 px-2 py-1 rounded border border-dungeon-800">
                              <span className="text-slate-200 truncate flex items-center gap-1">
                                {item.equipped && <Shield className="w-2.5 h-2.5 text-emerald-400 shrink-0" />}
                                {item.attuned && <Sparkles className="w-2.5 h-2.5 text-purple-400 shrink-0" />}
                                {item.name} {(item.quantity ?? 1) > 1 && `(x${item.quantity})`}
                              </span>
                              <span className="text-slate-400 text-[10px] shrink-0 ml-1">
                                {item.value_gp} PO
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
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
                  <label className="label">Clase de Armadura</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={ac}
                    onChange={e => setAc(Number(e.target.value))}
                    className="input min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="label">Puntos de Golpe Máx</label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={maxHp}
                    onChange={e => setMaxHp(Number(e.target.value))}
                    className="input min-h-[42px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="label">Percepción Pasiva</label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={passiveInput}
                    onChange={e => setPassiveInput(e.target.value)}
                    placeholder={`Por defecto ${10 + wisMod}`}
                    className="input min-h-[42px]"
                  />
                </div>
              </div>

              <div>
                <label className="label">Iniciativa base</label>
                <input
                  type="number"
                  min={-10}
                  max={30}
                  value={initiative}
                  onChange={e => setInitiative(Number(e.target.value))}
                  className="input min-h-[42px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-dungeon-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn px-4 py-2 text-sm text-slate-400 hover:bg-dungeon-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-sm min-h-[42px]"
                >
                  {editingId ? 'Guardar Cambios' : 'Añadir Personaje'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
