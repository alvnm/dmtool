'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InventoryItem } from '@/types';
import { 
  Backpack, Plus, Search, Filter, Coins, Scale, Trash2, 
  Tag, User, Sparkles, Edit2
} from 'lucide-react';

interface InventoryTrackerProps {
  items: InventoryItem[];
  onUpdateItems: (items: InventoryItem[]) => void;
}

export const InventoryTracker: React.FC<InventoryTrackerProps> = ({
  items,
  onUpdateItems,
}) => {
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
    if (!name.trim()) return;

    if (editingItem) {
      const updated = items.map(i => i.id === editingItem.id ? {
        ...i,
        name,
        type,
        rarity,
        weight: Number(weight),
        value_gp: Number(valueGp),
        assigned_to: assignedTo,
        description,
      } : i);
      onUpdateItems(updated);
    } else {
      const newItem: InventoryItem = {
        id: `item-${Date.now()}`,
        name,
        type,
        rarity,
        weight: Number(weight),
        value_gp: Number(valueGp),
        assigned_to: assignedTo || 'Bolsa General',
        description,
      };
      onUpdateItems([...items, newItem]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    onUpdateItems(items.filter(i => i.id !== id));
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
        <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Backpack className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Objetos</p>
            <h3 className="text-2xl font-bold text-slate-100">{items.length}</h3>
          </div>
        </div>

        <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400">
            <Coins className="w-6 h-6" />
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

        <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peso Total del Botín</p>
            <h3 className="text-2xl font-bold text-slate-100">{totalWeight.toFixed(1)} lb</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar objeto, asignación o descripción..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
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
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Añadir Objeto
          </button>
        </div>
      </div>

      {/* Item List Grid */}
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
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getRarityBadgeColor(item.rarity)}`}>
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
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded transition"
                  title="Editar Objeto"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                  title="Eliminar Objeto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100 border-b border-dungeon-800 pb-2">
              {editingItem ? 'Editar Objeto del Inventario' : 'Registrar Nuevo Objeto'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre del Objeto</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Poción de Curación / Espada Corta"
                  className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tipo</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  >
                    {TYPES.filter(t => t !== 'Todos').map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Rareza</label>
                  <select
                    value={rarity}
                    onChange={e => setRarity(e.target.value as any)}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  >
                    {RARITIES.filter(r => r !== 'Todas').map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Valor en Oro (PO)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={valueGp}
                    onChange={e => setValueGp(Number(e.target.value))}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Peso (lb)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={e => setWeight(Number(e.target.value))}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Asignado a Personaje o Bolsa</label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  placeholder="Ej: Bolsa General / Valerius / Lyra"
                  className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Descripción / Propiedades</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Efectos mágicos, detalles físicos, etc."
                  className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-dungeon-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-dungeon-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
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
