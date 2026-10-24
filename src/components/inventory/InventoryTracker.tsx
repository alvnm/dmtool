'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InventoryItem } from '@/types';
import { useToast } from '@/components/Toast';
import { EmptyState } from '@/components/EmptyState';
import { 
  Backpack, Plus, Search, Filter, Coins, Scale, Trash2, 
  Tag, User, Sparkles, Edit2
} from 'lucide-react';

interface InventoryTrackerProps {
  items: InventoryItem[];
  onUpdateItems: (items: InventoryItem[]) => void;
  /** Nombres sugeridos para «Asignado a»: personajes del grupo + destinos ya usados. */
  assigneeSuggestions?: string[];
}

export const InventoryTracker: React.FC<InventoryTrackerProps> = ({
  items,
  onUpdateItems,
  assigneeSuggestions = [],
}) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('Todos');
  const [selectedRarity, setSelectedRarity] = useState<string>('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<InventoryItem['type']>('General');
  const [rarity, setRarity] = useState<InventoryItem['rarity']>('Común');
  const [weight, setWeight] = useState(1);
  const [valueGp, setValueGp] = useState(10);
  const [assignedTo, setAssignedTo] = useState('Bolsa General');
  const [description, setDescription] = useState('');

  const TYPES = ['Todos', 'Arma', 'Armadura', 'Poción', 'Pergamino', 'Anillo', 'Tesoro', 'General'];
  const RARITIES = ['Todas', 'Común', 'Poco Común', 'Raro', 'Muy Raro', 'Legendario', 'Artefacto'];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.assigned_to.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'Todos' || item.type === selectedType;
    const matchesRarity = selectedRarity === 'Todas' || item.rarity === selectedRarity;
    return matchesSearch && matchesType && matchesRarity;
  });

  const totalValueGp = items.reduce((sum, i) => sum + (Number(i.value_gp) || 0), 0);
  const totalWeight = items.reduce((sum, i) => sum + (Number(i.weight) || 0), 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setType('General');
    setRarity('Común');
    setWeight(1);
    setValueGp(10);
    setAssignedTo('Bolsa General');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setType(item.type);
    setRarity(item.rarity);
    setWeight(item.weight);
    setValueGp(item.value_gp);
    setAssignedTo(item.assigned_to);
    setDescription(item.description);
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    const safeWeight = Math.max(0, Number(weight) || 0);
    const safeValueGp = Math.max(0, Number(valueGp) || 0);

    if (editingItem) {
      const updated = items.map(i => i.id === editingItem.id ? {
        ...i,
        name: cleanName,
        type,
        rarity,
        weight: safeWeight,
        value_gp: safeValueGp,
        assigned_to: assignedTo.trim() || 'Bolsa General',
        description: description.trim(),
      } : i);
      onUpdateItems(updated);
    } else {
      const newItem: InventoryItem = {
        id: `item-${Date.now()}`,
        name: cleanName,
        type,
        rarity,
        weight: safeWeight,
        value_gp: safeValueGp,
        assigned_to: assignedTo.trim() || 'Bolsa General',
        description: description.trim(),
      };
      onUpdateItems([...items, newItem]);
    }

    setIsModalOpen(false);
    toast.success(editingItem ? `Objeto «${cleanName}» actualizado.` : `Objeto «${cleanName}» añadido al inventario.`);
  };

  const handleDeleteItem = (id: string) => {
    const target = items.find(i => i.id === id);
    if (!target) return;
    if (!window.confirm(`¿Eliminar «${target.name}» del inventario? Esta acción no se puede deshacer.`)) return;
    onUpdateItems(items.filter(i => i.id !== id));
    toast.success(`«${target.name}» eliminado del inventario.`);
  };

  const getRarityBadgeColor = (r: InventoryItem['rarity']) => {
    switch (r) {
      case 'Común': return 'bg-slate-700/50 text-slate-300 border-slate-600';
      case 'Poco Común': return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'Raro': return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'Muy Raro': return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'Legendario': return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'Artefacto': return 'bg-rose-950 text-rose-300 border-rose-800';
      default: return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Backpack className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Objetos</p>
            <h3 className="text-2xl font-bold text-slate-100">{items.length}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Coins className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor Total en Oro</p>
            <h3 className="text-2xl font-bold text-yellow-400 flex items-baseline gap-1 overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={totalValueGp}
                  initial={{ y: -14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 14, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {totalValueGp.toLocaleString()}
                </motion.span>
              </AnimatePresence>
              <span className="text-base font-semibold">PO</span>
            </h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Scale className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peso Total del Botín</p>
            <h3 className="text-2xl font-bold text-slate-100">{totalWeight.toFixed(1)} lb</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[220px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar objeto, asignación o descripción..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input pl-9 pr-4 py-2"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap min-w-0">
          {/* flex-wrap aquí también: sin él el min-content de la fila es la suma
              de los dos select y la tarjeta desborda en móvil (scroll horizontal). */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="bg-dungeon-950 border border-dungeon-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
            >
              {TYPES.map(t => (
                <option key={t} value={t}>Tipo: {t}</option>
              ))}
            </select>

            <select
              value={selectedRarity}
              onChange={e => setSelectedRarity(e.target.value)}
              className="bg-dungeon-950 border border-dungeon-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
            >
              {RARITIES.map(r => (
                <option key={r} value={r}>Rareza: {r}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Añadir Objeto
          </button>
        </div>
      </div>

      {/* Item List Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={Backpack}
          title={items.length === 0 ? 'El inventario está vacío' : 'Sin resultados'}
          description={
            items.length === 0
              ? 'Registra armas, pociones y botín para saber quién lleva qué durante la sesión.'
              : 'Ningún objeto coincide con la búsqueda o los filtros actuales.'
          }
          actionLabel={items.length === 0 ? 'Añadir objeto' : 'Limpiar filtros'}
          onAction={
            items.length === 0
              ? handleOpenAdd
              : () => {
                  setSearchTerm('');
                  setSelectedType('Todos');
                  setSelectedRarity('Todas');
                }
          }
        />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence initial={false}>
        {filteredItems.map(item => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="bg-dungeon-900 border border-dungeon-800 hover:border-dungeon-700 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-md transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-slate-100 text-base">{item.name}</h3>
                <span className={`text-micro font-semibold px-2 py-0.5 rounded border ${getRarityBadgeColor(item.rarity)}`}>
                  {item.rarity}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                <span className="bg-dungeon-950 px-2 py-0.5 rounded border border-dungeon-800 flex items-center gap-1 text-slate-300">
                  <Tag className="w-3 h-3 text-amber-400" /> {item.type}
                </span>
                <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                  <Coins className="w-3.5 h-3.5" /> {item.value_gp} PO
                </span>
                <span className="flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-slate-500" /> {item.weight} lb
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-dungeon-950/60 p-2.5 rounded-lg border border-dungeon-800/80">
                {item.description || 'Sin descripción.'}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-dungeon-800 pt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium bg-dungeon-950 px-2 py-1 rounded border border-dungeon-800">
                <User className="w-3.5 h-3.5 text-amber-400" />
                {item.assigned_to}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="btn btn-icon text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                  title="Editar Objeto" aria-label="Editar Objeto"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="btn btn-icon text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  title="Eliminar Objeto" aria-label="Eliminar Objeto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100 border-b border-dungeon-800 pb-2">
              {editingItem ? 'Editar Objeto del Inventario' : 'Registrar Nuevo Objeto'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-3">
              <div>
                <label className="label">Nombre del Objeto</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Poción de Curación / Espada Corta"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipo</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="input"
                  >
                    {TYPES.filter(t => t !== 'Todos').map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Rareza</label>
                  <select
                    value={rarity}
                    onChange={e => setRarity(e.target.value as any)}
                    className="input"
                  >
                    {RARITIES.filter(r => r !== 'Todas').map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Valor en Oro (PO)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={valueGp}
                    onChange={e => setValueGp(Number(e.target.value))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Peso (lb)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={e => setWeight(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Asignado a Personaje o Bolsa</label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  placeholder="Ej: Bolsa General / Valerius / Lyra"
                  list="assignee-options"
                  maxLength={80}
                  className="input"
                />
                <datalist id="assignee-options">
                  {assigneeSuggestions.map(option => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
                <p className="text-micro text-slate-500 mt-1">
                  Los personajes del grupo aparecen como sugerencias.
                </p>
              </div>

              <div>
                <label className="label">Descripción / Propiedades</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Efectos mágicos, detalles físicos, etc."
                  className="input resize-none"
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
                  className="btn btn-primary text-sm"
                >
                  {editingItem ? 'Guardar Cambios' : 'Crear Objeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
