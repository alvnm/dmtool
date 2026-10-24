'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InventoryItem } from '@/types';
import { useToast } from '@/components/Toast';
import { EmptyState } from '@/components/EmptyState';
import { 
  Backpack, Plus, Search, Coins, Scale, Trash2, 
  Tag, User, Edit2, Shield, Sparkles, Check, ChevronRight
} from 'lucide-react';

interface InventoryTrackerProps {
  items: InventoryItem[];
  onUpdateItems: (items: InventoryItem[]) => void;
  assigneeSuggestions?: string[];
  onLogEvent?: (entry: { author: string; entityType: 'item'; action: 'create' | 'update' | 'delete' | 'transfer'; summary: string }) => void;
}

export const InventoryTracker: React.FC<InventoryTrackerProps> = ({
  items,
  onUpdateItems,
  assigneeSuggestions = [],
  onLogEvent,
}) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('Todos');
  const [selectedRarity, setSelectedRarity] = useState<string>('Todas');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<InventoryItem['type']>('General');
  const [rarity, setRarity] = useState<InventoryItem['rarity']>('Común');
  const [weight, setWeight] = useState(1);
  const [valueGp, setValueGp] = useState(10);
  const [quantity, setQuantity] = useState(1);
  const [equipped, setEquipped] = useState(false);
  const [attuned, setAttuned] = useState(false);
  const [assignedTo, setAssignedTo] = useState('Bolsa General');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState('DM');

  const TYPES = ['Todos', 'Arma', 'Armadura', 'Poción', 'Pergamino', 'Anillo', 'Tesoro', 'General'];
  const RARITIES = ['Todas', 'Común', 'Poco Común', 'Raro', 'Muy Raro', 'Legendario', 'Artefacto'];

  const allAssignees = Array.from(new Set(['Todos', 'Bolsa General', ...assigneeSuggestions, ...items.map(i => i.assigned_to)]));

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.assigned_to.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'Todos' || item.type === selectedType;
    const matchesRarity = selectedRarity === 'Todas' || item.rarity === selectedRarity;
    const matchesAssignee = selectedAssignee === 'Todos' || item.assigned_to === selectedAssignee;
    return matchesSearch && matchesType && matchesRarity && matchesAssignee;
  });

  const totalValueGp = items.reduce((sum, i) => sum + ((Number(i.value_gp) || 0) * (Number(i.quantity) || 1)), 0);
  const totalWeight = items.reduce((sum, i) => sum + ((Number(i.weight) || 0) * (Number(i.quantity) || 1)), 0);
  const totalItemCount = items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setType('General');
    setRarity('Común');
    setWeight(1);
    setValueGp(10);
    setQuantity(1);
    setEquipped(false);
    setAttuned(false);
    setAssignedTo('Bolsa General');
    setDescription('');
    setAuthorName('DM');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setType(item.type);
    setRarity(item.rarity);
    setWeight(item.weight);
    setValueGp(item.value_gp);
    setQuantity(item.quantity ?? 1);
    setEquipped(Boolean(item.equipped));
    setAttuned(Boolean(item.attuned));
    setAssignedTo(item.assigned_to);
    setDescription(item.description);
    setAuthorName(item.last_modified_by || 'DM');
    setIsModalOpen(true);
  };

  const handleToggleEquip = (item: InventoryItem) => {
    const updated = items.map(i => i.id === item.id ? { ...i, equipped: !i.equipped } : i);
    onUpdateItems(updated);
    const actionLabel = !item.equipped ? 'equipado' : 'desequipado';
    toast.success(`«${item.name}» ${actionLabel}.`);
    onLogEvent?.({
      author: 'DM',
      entityType: 'item',
      action: 'update',
      summary: `«${item.name}» ${actionLabel} en ${item.assigned_to}`,
    });
  };

  const handleAdjustQuantity = (item: InventoryItem, delta: number) => {
    const currentQty = item.quantity ?? 1;
    const nextQty = Math.max(1, currentQty + delta);
    if (nextQty === currentQty) return;
    const updated = items.map(i => i.id === item.id ? { ...i, quantity: nextQty } : i);
    onUpdateItems(updated);
    onLogEvent?.({
      author: 'DM',
      entityType: 'item',
      action: 'update',
      summary: `Cantidad de «${item.name}»: ${currentQty} ➔ ${nextQty}`,
    });
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    const safeWeight = Math.max(0, Number(weight) || 0);
    const safeValueGp = Math.max(0, Number(valueGp) || 0);
    const safeQty = Math.max(1, Math.floor(Number(quantity) || 1));
    const targetAssignee = assignedTo.trim() || 'Bolsa General';
    const modifier = authorName.trim() || 'DM';

    if (editingItem) {
      const isTransfer = editingItem.assigned_to !== targetAssignee;
      const updated = items.map(i => i.id === editingItem.id ? {
        ...i,
        name: cleanName,
        type,
        rarity,
        weight: safeWeight,
        value_gp: safeValueGp,
        quantity: safeQty,
        equipped,
        attuned,
        assigned_to: targetAssignee,
        description: description.trim(),
        last_modified_by: modifier,
      } : i);
      onUpdateItems(updated);
      onLogEvent?.({
        author: modifier,
        entityType: 'item',
        action: isTransfer ? 'transfer' : 'update',
        summary: isTransfer 
          ? `«${cleanName}» transferido de ${editingItem.assigned_to} a ${targetAssignee}`
          : `«${cleanName}» actualizado (${safeQty} uds, ${targetAssignee})`,
      });
      toast.success(`Objeto «${cleanName}» actualizado.`);
    } else {
      const newItem: InventoryItem = {
        id: `item-${Date.now()}`,
        name: cleanName,
        type,
        rarity,
        weight: safeWeight,
        value_gp: safeValueGp,
        quantity: safeQty,
        equipped,
        attuned,
        assigned_to: targetAssignee,
        description: description.trim(),
        last_modified_by: modifier,
      };
      onUpdateItems([...items, newItem]);
      onLogEvent?.({
        author: modifier,
        entityType: 'item',
        action: 'create',
        summary: `Nuevo objeto «${cleanName}» (x${safeQty}) añadido a ${targetAssignee}`,
      });
      toast.success(`Objeto «${cleanName}» añadido al inventario.`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    const target = items.find(i => i.id === id);
    if (!target) return;
    if (!window.confirm(`¿Eliminar «${target.name}» del inventario? Esta acción no se puede deshacer.`)) return;
    onUpdateItems(items.filter(i => i.id !== id));
    toast.success(`«${target.name}» eliminado del inventario.`);
    onLogEvent?.({
      author: 'DM',
      entityType: 'item',
      action: 'delete',
      summary: `«${target.name}» eliminado del inventario de ${target.assigned_to}`,
    });
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
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Objetos</p>
            <h3 className="text-2xl font-bold text-slate-100">{totalItemCount} <span className="text-xs font-normal text-slate-400">({items.length} tipos)</span></h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Coins className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor Total del Grupo</p>
            <h3 className="text-2xl font-bold text-yellow-400">
              {Math.round(totalValueGp).toLocaleString()} PO
            </h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Scale className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peso Total de Carga</p>
            <h3 className="text-2xl font-bold text-slate-100">{totalWeight.toFixed(1)} <span className="text-sm font-normal text-slate-400">lb</span></h3>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Add Button */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, portador o descripción..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedAssignee}
              onChange={e => setSelectedAssignee(e.target.value)}
              className="bg-dungeon-950 border border-dungeon-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
            >
              {allAssignees.map(a => (
                <option key={a} value={a}>Portador: {a}</option>
              ))}
            </select>

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
            className="btn btn-primary flex items-center justify-center gap-2"
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
                  setSelectedAssignee('Todos');
                }
          }
        />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence initial={false}>
        {filteredItems.map(item => {
          const qty = item.quantity ?? 1;
          const isEquipped = Boolean(item.equipped);
          const isAttuned = Boolean(item.attuned);

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`bg-dungeon-900 border rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-md transition ${
                isEquipped ? 'border-amber-500/50 ring-1 ring-amber-500/30' : 'border-dungeon-800 hover:border-dungeon-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-100 text-base">{item.name}</h3>
                    {qty > 1 && (
                      <span className="bg-amber-500/20 text-amber-300 font-bold text-xs px-2 py-0.5 rounded-full border border-amber-500/30">
                        x{qty}
                      </span>
                    )}
                  </div>
                  <span className={`text-micro font-semibold px-2 py-0.5 rounded border ${getRarityBadgeColor(item.rarity)}`}>
                    {item.rarity}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-2">
                  <span className="bg-dungeon-950 px-2 py-0.5 rounded border border-dungeon-800 flex items-center gap-1 text-slate-300">
                    <Tag className="w-3 h-3 text-amber-400" /> {item.type}
                  </span>
                  <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                    <Coins className="w-3.5 h-3.5" /> {item.value_gp} PO
                  </span>
                  <span className="flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-slate-500" /> {item.weight} lb
                  </span>
                  {isEquipped && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded text-micro font-bold flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Equipado
                    </span>
                  )}
                  {isAttuned && (
                    <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded text-micro font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Sintonizado
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-dungeon-950/60 p-2.5 rounded-lg border border-dungeon-800/80">
                  {item.description || 'Sin descripción.'}
                </p>

                {item.last_modified_by && (
                  <p className="text-micro text-slate-500 mt-1 italic">
                    Modificado por: {item.last_modified_by}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-dungeon-800 pt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium bg-dungeon-950 px-2 py-1 rounded border border-dungeon-800">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  {item.assigned_to}
                </span>

                <div className="flex items-center gap-1">
                  {/* Quantity quick controls */}
                  <div className="flex items-center bg-dungeon-950 border border-dungeon-800 rounded mr-1">
                    <button
                      onClick={() => handleAdjustQuantity(item, -1)}
                      className="px-2 py-0.5 text-slate-400 hover:text-amber-400 hover:bg-dungeon-800 rounded-l"
                      title="Disminuir cantidad"
                    >
                      -
                    </button>
                    <span className="px-1 text-micro font-bold text-slate-200">{qty}</span>
                    <button
                      onClick={() => handleAdjustQuantity(item, 1)}
                      className="px-2 py-0.5 text-slate-400 hover:text-amber-400 hover:bg-dungeon-800 rounded-r"
                      title="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleEquip(item)}
                    className={`btn btn-icon ${isEquipped ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200'}`}
                    title={isEquipped ? 'Desequipar' : 'Equipar objeto'}
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </button>

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
          );
        })}
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Valor (PO)</label>
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
                <div>
                  <label className="label">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 py-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={equipped}
                    onChange={e => setEquipped(e.target.checked)}
                    className="rounded bg-dungeon-950 border-dungeon-700 text-amber-500 focus:ring-0"
                  />
                  Equipado actualmente
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attuned}
                    onChange={e => setAttuned(e.target.checked)}
                    className="rounded bg-dungeon-950 border-dungeon-700 text-amber-500 focus:ring-0"
                  />
                  Sintonizado (Attunement)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Asignado a</label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    placeholder="Bolsa General / Personaje"
                    list="assignee-options"
                    maxLength={80}
                    className="input"
                  />
                  <datalist id="assignee-options">
                    {assigneeSuggestions.map(option => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="label">Editado por</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    placeholder="DM o Nombre de PJ"
                    maxLength={50}
                    className="input"
                  />
                </div>
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
