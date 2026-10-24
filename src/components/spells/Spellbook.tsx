'use client';

import React, { useState } from 'react';
import { Spell } from '@/types';
import { useToast } from '@/components/Toast';
import { EmptyState } from '@/components/EmptyState';
import { 
  BookOpen, Plus, Search, Sparkles, Wand2, 
  Trash2, Clock, Target, Layers
} from 'lucide-react';

interface SpellbookProps {
  spells: Spell[];
  onUpdateSpells: (spells: Spell[]) => void;
}

export const Spellbook: React.FC<SpellbookProps> = ({
  spells,
  onUpdateSpells,
}) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('Todos');
  const [selectedSchool, setSelectedSchool] = useState<string>('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  // El grimorio SRD completo (~400 conjuros) se muestra de 60 en 60 para no
  // montar cientos de tarjetas de golpe.
  const [visibleCount, setVisibleCount] = useState(60);

  // Form State
  const [name, setName] = useState('');
  const [level, setLevel] = useState<number>(1);
  const [school, setSchool] = useState('Evocación');
  const [castingTime, setCastingTime] = useState('1 Acción');
  const [range, setRange] = useState('60 ft.');
  const [components, setComponents] = useState('V, S');
  const [duration, setDuration] = useState('Instantáneo');
  const [description, setDescription] = useState('');
  const [selectedClassesStr, setSelectedClassesStr] = useState('Mago, Hechicero');

  const SCHOOLS = [
    'Todas', 'Abjuración', 'Adivinación', 'Encantamiento', 
    'Evocación', 'Ilusión', 'Nigromancia', 'Transmutación', 'Conjuración'
  ];

  const LEVELS = [
    { label: 'Todos los niveles', val: 'Todos' },
    { label: 'Truco (Nivel 0)', val: '0' },
    { label: 'Nivel 1', val: '1' },
    { label: 'Nivel 2', val: '2' },
    { label: 'Nivel 3', val: '3' },
    { label: 'Nivel 4', val: '4' },
    { label: 'Nivel 5', val: '5' },
    { label: 'Nivel 6+', val: '6+' },
  ];

  const isCustomSpell = (s: Spell) => Boolean(s.isCustom || s.id.startsWith('sp-') || s.id.startsWith('custom-'));

  const filteredSpells = spells
    .filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = selectedLevel === 'Todos' || 
                           (selectedLevel === '6+' ? s.level >= 6 : s.level.toString() === selectedLevel);
      const matchesSchool = selectedSchool === 'Todas' || s.school === selectedSchool;
      return matchesSearch && matchesLevel && matchesSchool;
    })
    .sort((a, b) => {
      const aCustom = isCustomSpell(a);
      const bCustom = isCustomSpell(b);
      if (aCustom && !bCustom) return -1;
      if (!aCustom && bCustom) return 1;
      return a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name);
    });
  const visibleSpells = filteredSpells.slice(0, visibleCount);

  // El cambio de filtros restaura la paginación visible.
  React.useEffect(() => { setVisibleCount(60); }, [searchTerm, selectedLevel, selectedSchool]);

  const handleSaveSpell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const classesArray = selectedClassesStr.split(',').map(c => c.trim()).filter(Boolean);

    const newSpell: Spell = {
      id: `sp-${Date.now()}`,
      name,
      level: Number(level),
      school,
      casting_time: castingTime,
      range,
      components,
      duration,
      description,
      classes: classesArray,
      isCustom: true,
    };

    onUpdateSpells([...spells, newSpell]);
    setIsModalOpen(false);
    toast.success(`Hechizo «${name}» añadido al grimorio.`);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setLevel(1);
    setSchool('Evocación');
    setCastingTime('1 Acción');
    setRange('60 ft.');
    setComponents('V, S');
    setDuration('Instantáneo');
    setDescription('');
    setSelectedClassesStr('Mago, Hechicero');
  };

  const handleDelete = (id: string) => {
    const target = spells.find(s => s.id === id);
    if (!target) return;
    if (!window.confirm(`¿Eliminar «${target.name}» del grimorio? Esta acción no se puede deshacer.`)) return;
    onUpdateSpells(spells.filter(s => s.id !== id));
    toast.success(`«${target.name}» eliminado del grimorio.`);
  };

  const getSchoolBadgeColor = (sch: string) => {
    switch (sch) {
      case 'Evocación': return 'bg-red-950 text-red-300 border-red-800';
      case 'Abjuración': return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'Nigromancia': return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'Encantamiento': return 'bg-pink-950 text-pink-300 border-pink-800';
      case 'Ilusión': return 'bg-indigo-950 text-indigo-300 border-indigo-800';
      case 'Transmutación': return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'Conjuración': return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Biblioteca y Grimorio de Hechizos</h2>
            <p className="text-xs text-slate-400">{spells.length} conjuros registrados</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar conjuro por nombre o efecto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input pl-9 pr-4 py-2"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedLevel}
            onChange={e => setSelectedLevel(e.target.value)}
            className="bg-dungeon-950 border border-dungeon-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
          >
            {LEVELS.map(l => (
              <option key={l.val} value={l.val}>{l.label}</option>
            ))}
          </select>

          <select
            value={selectedSchool}
            onChange={e => setSelectedSchool(e.target.value)}
            className="bg-dungeon-950 border border-dungeon-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
          >
            {SCHOOLS.map(s => (
              <option key={s} value={s}>Escuela: {s}</option>
            ))}
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Hechizo
          </button>
        </div>
      </div>

      {/* Grid of Spell Cards */}
      {filteredSpells.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={spells.length === 0 ? 'El grimorio está vacío' : 'Sin resultados'}
          description={
            spells.length === 0
              ? 'Aún no hay conjuros: revisa la conexión o crea el primero desde «Nuevo Hechizo».'
              : 'Ningún conjuro coincide con la búsqueda, el nivel o la escuela seleccionados.'
          }
          actionLabel="Limpiar filtros"
          onAction={() => {
            setSearchTerm('');
            setSelectedLevel('Todos');
            setSelectedSchool('Todas');
          }}
        />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleSpells.map(spell => (
          <div
            key={spell.id}
            className="card card-interactive hover:border-dungeon-700 space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="border-b border-dungeon-800 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 font-serif">{spell.name}</h3>
                  <p className="text-xs text-slate-400">
                    {spell.level === 0 ? 'Truco (Cantrip)' : `Nivel ${spell.level}`} • {spell.school}
                  </p>
                </div>
                <span className={`text-micro font-bold px-2 py-0.5 rounded border ${getSchoolBadgeColor(spell.school)}`}>
                  {spell.school}
                </span>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 my-3 bg-dungeon-950 p-2.5 rounded-lg border border-dungeon-800">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{spell.casting_time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  <span>{spell.range}</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2 text-slate-400">
                  <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Comp: <strong>{spell.components}</strong> | Duración: <strong>{spell.duration}</strong></span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed bg-dungeon-950/60 p-3 rounded-lg border border-dungeon-800">
                {spell.description}
              </p>
            </div>

            {/* Classes & Footer */}
            <div className="flex items-center justify-between border-t border-dungeon-800 pt-3 text-xs">
              <div className="flex flex-wrap gap-1">
                {spell.classes.map(cls => (
                  <span key={cls} className="bg-dungeon-950 text-slate-400 border border-dungeon-800 px-2 py-0.5 rounded text-micro">
                    {cls}
                  </span>
                ))}
              </div>

              <button
                onClick={() => handleDelete(spell.id)}
                className="btn btn-icon text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                title="Eliminar de la biblioteca" aria-label="Eliminar de la biblioteca"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Paginación: mostrar más conjuros del grimorio */}
      {filteredSpells.length > visibleSpells.length && (
        <div className="flex justify-center">
          <button
            onClick={() => setVisibleCount(c => c + 60)}
            className="btn flex items-center gap-2 bg-dungeon-900 hover:bg-dungeon-800 border border-dungeon-700 text-slate-300 hover:text-amber-400 text-sm px-5 py-2.5"
          >
            Mostrar más conjuros ({visibleSpells.length} de {filteredSpells.length})
          </button>
        </div>
      )}

      {/* Modal Add Spell */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 border-b border-dungeon-800 pb-2">
              Registrar Nuevo Hechizo / Conjuro
            </h3>

            <form onSubmit={handleSaveSpell} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nombre del Hechizo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Bola de Fuego"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Nivel (0 = Truco)</label>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    value={level}
                    onChange={e => setLevel(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Escuela de Magia</label>
                  <select
                    value={school}
                    onChange={e => setSchool(e.target.value)}
                    className="input"
                  >
                    {SCHOOLS.filter(s => s !== 'Todas').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Tiempo de Casteo</label>
                  <input
                    type="text"
                    value={castingTime}
                    onChange={e => setCastingTime(e.target.value)}
                    placeholder="1 Acción, 1 Reacción..."
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Alcance</label>
                  <input
                    type="text"
                    value={range}
                    onChange={e => setRange(e.target.value)}
                    placeholder="60 ft, Toque..."
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Componentes</label>
                  <input
                    type="text"
                    value={components}
                    onChange={e => setComponents(e.target.value)}
                    placeholder="V, S, M"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Duración</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="Instantáneo, 1 min..."
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Clases que pueden aprenderlo</label>
                <input
                  type="text"
                  value={selectedClassesStr}
                  onChange={e => setSelectedClassesStr(e.target.value)}
                  placeholder="Mago, Clérigo, Bardo..."
                  className="input"
                />
              </div>

              <div>
                <label className="label">Descripción Completa del Hechizo</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Efectos del conjuro, daño, dados de salvación..."
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
                  Crear Hechizo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
