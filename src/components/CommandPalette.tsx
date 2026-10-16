'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CornerDownLeft, FileText, Skull, BookOpen, Users, Swords,
  LayoutDashboard, Backpack, Gift, UserCheck, Command,
} from 'lucide-react';
import { Combatant, DMNote, Monster, NPC, Spell } from '@/types';

export type PaletteTabId =
  | 'dashboard' | 'initiative' | 'inventory' | 'monsters'
  | 'npcs' | 'spells' | 'party' | 'treasure';

export interface PaletteTarget {
  /** Identificador único del resultado (para la tecla React y el índice activo). */
  key: string;
  label: string;
  hint: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  /** A qué pestaña lleva. */
  tab: PaletteTabId;
  /** Índice de nota seleccionada (sólo notas), para abrirla directa. */
  noteId?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectTab: (tab: PaletteTabId) => void;
  onSelectNote?: (noteId: string) => void;
  notes: DMNote[];
  monsters: Monster[];
  spells: Spell[];
  npcs: NPC[];
  partyNames: string[];
  combatants: Combatant[];
}

/** Normaliza texto para comparaciones sin acentos ni mayúsculas. */
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const TAB_TARGETS: Array<Omit<PaletteTarget, 'key'>> = [
  { label: 'Panel Global', hint: 'Vista general de la sesión', group: 'Secciones', icon: LayoutDashboard, tab: 'dashboard' },
  { label: 'Iniciativa', hint: 'Rastreador de combate', group: 'Secciones', icon: Swords, tab: 'initiative' },
  { label: 'Inventario & Tesoro', hint: 'Objetos y botín del grupo', group: 'Secciones', icon: Backpack, tab: 'inventory' },
  { label: 'Bestiario', hint: 'Buscar monstruos', group: 'Secciones', icon: Skull, tab: 'monsters' },
  { label: 'NPCs', hint: 'Fichas y secretos', group: 'Secciones', icon: Users, tab: 'npcs' },
  { label: 'Grimorio', hint: 'Hechizos', group: 'Secciones', icon: BookOpen, tab: 'spells' },
  { label: 'Grupo de jugadores', hint: 'CA, percepción pasiva y HP', group: 'Secciones', icon: UserCheck, tab: 'party' },
  { label: 'Generador de tesoros', hint: 'Botín al vuelo', group: 'Secciones', icon: Gift, tab: 'treasure' },
];

/**
 * Paleta de comandos estilo Spotlight (Ctrl+K): busca entre secciones, notas,
 * monstruos, hechizos, NPCs, grupo y combatientes, y salta al resultado.
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  onSelectTab,
  onSelectNote,
  notes,
  monsters,
  spells,
  npcs,
  partyNames,
  combatants,
}) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // Pequeño delay: el nodo aún no está pintado en el primer frame.
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open]);

  const results = useMemo<PaletteTarget[]>(() => {
    const q = norm(query.trim());
    const targets: PaletteTarget[] = [
      ...TAB_TARGETS.map(t => ({ ...t, key: `tab:${t.tab}` })),
      ...notes.map(n => ({
        key: `note:${n.id}`,
        label: n.title,
        hint: n.content.slice(0, 80) || 'Nota de campaña',
        group: 'Notas',
        icon: FileText,
        tab: 'dashboard' as PaletteTabId,
        noteId: n.id,
      })),
      ...monsters.map(m => ({
        key: `monster:${m.id}`,
        label: m.name,
        hint: `${m.type} • CR ${m.cr} • CA ${m.ac}`,
        group: 'Bestiario',
        icon: Skull,
        tab: 'monsters' as PaletteTabId,
      })),
      ...spells.map(s => ({
        key: `spell:${s.id}`,
        label: s.name,
        hint: `Nivel ${s.level} • ${s.school}`,
        group: 'Grimorio',
        icon: BookOpen,
        tab: 'spells' as PaletteTabId,
      })),
      ...npcs.map(n => ({
        key: `npc:${n.id}`,
        label: n.name,
        hint: `${n.race} • ${n.disposition}`,
        group: 'NPCs',
        icon: Users,
        tab: 'npcs' as PaletteTabId,
      })),
      ...partyNames.map(name => ({
        key: `party:${name}`,
        label: name,
        hint: 'Miembro del grupo',
        group: 'Grupo',
        icon: UserCheck,
        tab: 'party' as PaletteTabId,
      })),
      ...combatants.map(c => ({
        key: `combat:${c.id}`,
        label: c.name,
        hint: `En combate • INIT ${c.initiative} • ${c.hp_current}/${c.hp_max} PV`,
        group: 'Combate',
        icon: Swords,
        tab: 'initiative' as PaletteTabId,
      })),
    ];

    if (!q) return targets.slice(0, 40);
    return targets
      .map(t => {
        const haystack = norm(`${t.label} ${t.hint} ${t.group}`);
        const score = haystack.includes(q) ? (norm(t.label).startsWith(q) ? 2 : 1) : 0;
        return { target: t, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map(x => x.target);
  }, [query, notes, monsters, spells, npcs, partyNames, combatants]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  // Mantiene el resultado activo visible al navegar con las flechas.
  useEffect(() => {
    const node = listRef.current?.children[active] as HTMLElement | undefined;
    node?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const runTarget = (target: PaletteTarget | undefined) => {
    if (!target) return;
    onSelectTab(target.tab);
    if (target.noteId && onSelectNote) onSelectNote(target.noteId);
    onClose();
  };

  if (!open) return null;

  let lastGroup = '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Buscador rápido"
          initial={{ opacity: 0, y: -14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-xl bg-dungeon-900 border border-dungeon-700 rounded-xl shadow-2xl overflow-hidden"
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive(prev => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              runTarget(results[active]);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            }
          }}
        >
          {/* Campo de búsqueda */}
          <div className="flex items-center gap-3 px-4 border-b border-dungeon-800">
            <Search className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Saltar a una nota, monstruo, NPC, hechizo o sección…"
              aria-label="Buscar en la campaña"
              className="flex-1 bg-transparent py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
            <kbd className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 border border-dungeon-700 rounded px-1.5 py-0.5 font-mono">
              <Command className="w-3 h-3" /> K
            </kbd>
          </div>

          {/* Resultados */}
          <ul ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
            {results.length === 0 && (
              <li className="text-center text-xs text-slate-500 py-6">
                Sin resultados para “{query}”.
              </li>
            )}
            {results.map((target, index) => {
              const Icon = target.icon;
              const showGroup = target.group !== lastGroup;
              lastGroup = target.group;
              return (
                <React.Fragment key={target.key}>
                  {showGroup && (
                    <li className="px-2 pt-2.5 pb-1 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                      {target.group}
                    </li>
                  )}
                  <li>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => runTarget(target)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${
                        index === active ? 'bg-amber-500/15 text-slate-100' : 'text-slate-300 hover:bg-dungeon-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${index === active ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold truncate">{target.label}</span>
                        <span className="block text-[11px] text-slate-500 truncate">{target.hint}</span>
                      </span>
                      {index === active && (
                        <CornerDownLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </button>
                  </li>
                </React.Fragment>
              );
            })}
          </ul>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
