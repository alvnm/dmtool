'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DMNote } from '@/types';
import { FileText, Plus, Pin, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { EmptyState } from '@/components/EmptyState';

interface QuickNotesProps {
  notes: DMNote[];
  onUpdateNotes: (notes: DMNote[]) => void;
  /** Nota resaltada desde la paleta de comandos (Ctrl+K). */
  highlightNoteId?: string | null;
}

export const QuickNotes: React.FC<QuickNotesProps> = ({
  notes,
  onUpdateNotes,
  highlightNoteId,
}) => {
  const toast = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<DMNote['category']>('General');
  const [pinned, setPinned] = useState(false);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const CATEGORIES = ['Todas', 'General', 'Lore', 'Misión', 'Sesión', 'Combate', 'NPCs'];

  const filteredNotes = notes.filter(n => 
    selectedCategory === 'Todas' || n.category === selectedCategory
  ).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const handleOpenAdd = () => {
    setEditingNoteId(null);
    setTitle('');
    setContent('');
    setCategory('General');
    setPinned(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (n: DMNote) => {
    setEditingNoteId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setCategory(n.category);
    setPinned(n.pinned);
    setIsModalOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingNoteId) {
      onUpdateNotes(
        notes.map(n =>
          n.id === editingNoteId
            ? { ...n, title, content, category, pinned, updated_at: new Date().toISOString() }
            : n
        )
      );
    } else {
      const newNote: DMNote = {
        id: `note-${Date.now()}`,
        title,
        content,
        category,
        pinned,
        updated_at: new Date().toISOString(),
      };
      onUpdateNotes([...notes, newNote]);
    }

    setIsModalOpen(false);
    toast.success(editingNoteId ? `Nota «${title}» actualizada.` : `Nota «${title}» guardada.`);
    setEditingNoteId(null);
    setTitle('');
    setContent('');
    setCategory('General');
    setPinned(false);
  };

  const togglePin = (id: string) => {
    onUpdateNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const handleDelete = (id: string) => {
    const target = notes.find(n => n.id === id);
    if (!target) return;
    if (!window.confirm(`¿Eliminar la nota «${target.title}»? Esta acción no se puede deshacer.`)) return;
    onUpdateNotes(notes.filter(n => n.id !== id));
    toast.success(`Nota «${target.title}» eliminada.`);
  };

  // Al saltar a una nota desde la paleta, la trae al centro del panel.
  useEffect(() => {
    if (!highlightNoteId) return;
    const el = document.querySelector(`[data-note-id="${highlightNoteId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightNoteId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-400" />
          Notas Rápidas del DM
        </h3>

        <button
          onClick={handleOpenAdd}
          className="btn bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 px-3 py-1.5 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Nueva Nota
        </button>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs px-2.5 py-1 rounded-full transition whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-dungeon-950 text-slate-400 hover:text-slate-200 border border-dungeon-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={notes.length === 0 ? 'Sin notas de campaña' : 'Nada en esta categoría'}
          description={
            notes.length === 0
              ? 'Anota nombres clave, pistas y recordatorios de sesión: se guardan en este navegador.'
              : 'No hay notas de la categoría seleccionada.'
          }
          actionLabel={notes.length === 0 ? 'Nueva nota' : 'Ver todas'}
          onAction={
            notes.length === 0 ? handleOpenAdd : () => setSelectedCategory('Todas')
          }
        />
      ) : (
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
        {filteredNotes.map(n => (
          <motion.div
            key={n.id}
            layout
            data-note-id={n.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 16, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2 }}
            className={`p-3 rounded-lg border transition ${
              n.pinned
                ? 'bg-amber-950/20 border-amber-500/50'
                : 'bg-dungeon-950 border-dungeon-800'
            } ${
              highlightNoteId === n.id ? 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/20' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                {n.pinned && <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                {n.title}
              </h4>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(n)}
                  className="btn btn-icon text-slate-400 hover:text-amber-400"
                  title="Editar nota" aria-label="Editar nota"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => togglePin(n.id)}
                  className={`p-1 rounded text-xs transition ${n.pinned ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                  title={n.pinned ? 'Desfijar' : 'Fijar nota'} aria-label={n.pinned ? 'Desfijar nota' : 'Fijar nota'}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="btn btn-icon text-slate-400 hover:text-red-400"
                  title="Eliminar nota" aria-label="Eliminar nota"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {n.content}
            </p>

            <span className="inline-block text-[9px] bg-dungeon-900 text-slate-400 px-2 py-0.5 rounded mt-2 border border-dungeon-800">
              {n.category}
            </span>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
      )}

      {/* Modal Add Note */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100 border-b border-dungeon-800 pb-2">
              {editingNoteId ? 'Editar Nota de Campaña' : 'Nueva Nota de Campaña'}
            </h3>

            <form onSubmit={handleSaveNote} className="space-y-3">
              <div>
                <label className="label">Título</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej: Pista de la biblioteca / Contraseña del templo"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Categoría</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="input"
                >
                  {CATEGORIES.filter(c => c !== 'Todas').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Contenido de la Nota</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Detalles importantes para la sesión..."
                  className="input resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinnedCheck"
                  checked={pinned}
                  onChange={e => setPinned(e.target.checked)}
                  className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="pinnedCheck" className="text-sm text-slate-300 cursor-pointer">
                  Fijar nota al inicio
                </label>
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
                  {editingNoteId ? 'Actualizar Nota' : 'Guardar Nota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
