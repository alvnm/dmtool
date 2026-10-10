'use client';

import React, { useState } from 'react';
import { Spell } from '@/types';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('Todos');
  const [selectedSchool, setSelectedSchool] = useState<string>('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const filteredSpells = spells.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'Todos' || 
                         (selectedLevel === '6+' ? s.level >= 6 : s.level.toString() === selectedLevel);
    const matchesSchool = selectedSchool === 'Todas' || s.school === selectedSchool;
    return matchesSearch && matchesLevel && matchesSchool;
  });

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
    };

    onUpdateSpells([...spells, newSpell]);
    setIsModalOpen(false);
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
    onUpdateSpells(spells.filter(s => s.id !== id));
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
      <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <BookOpen className="w-6 h-6" />
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
              className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
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
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Nuevo Hechizo
          </button>
        </div>
      </div>

      {/* Grid of Spell Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpells.map(spell => (
          <div
            key={spell.id}
            className="bg-dungeon-900 border border-dungeon-800 hover:border-dungeon-700 rounded-xl p-5 shadow-lg space-y-4 flex flex-col justify-between transition"
          >
            <div>
              <div className="border-b border-dungeon-800 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 font-serif">{spell.name}</h3>
                  <p className="text-xs text-slate-400">
                    {spell.level === 0 ? 'Truco (Cantrip)' : `Nivel ${spell.level}`} • {spell.school}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSchoolBadgeColor(spell.school)}`}>
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
                  <span key={cls} className="bg-dungeon-950 text-slate-400 border border-dungeon-800 px-2 py-0.5 rounded text-[10px]">
                    {cls}
                  </span>
                ))}
              </div>

              <button
                onClick={() => handleDelete(spell.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                title="Eliminar de la biblioteca"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Spell */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 border-b border-dungeon-800 pb-2">
              Registrar Nuevo Hechizo / Conjuro
            </h3>

            <form onSubmit={handleSaveSpell} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre del Hechizo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Bola de Fuego"
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nivel (0 = Truco)</label>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    value={level}
                    onChange={e => setLevel(Number(e.target.value))}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Escuela de Magia</label>
                  <select
                    value={school}
                    onChange={e => setSchool(e.target.value)}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200"
                  >
                    {SCHOOLS.filter(s => s !== 'Todas').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tiempo de Casteo</label>
                  <input
                    type="text"
                    value={castingTime}
                    onChange={e => setCastingTime(e.target.value)}
                    placeholder="1 Acción, 1 Reacción..."
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Alcance</label>
                  <input
                    type="text"
                    value={range}
                    onChange={e => setRange(e.target.value)}
                    placeholder="60 ft, Toque..."
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Componentes</label>
                  <input
                    type="text"
                    value={components}
                    onChange={e => setComponents(e.target.value)}
                    placeholder="V, S, M"
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Duración</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="Instantáneo, 1 min..."
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Clases que pueden aprenderlo</label>
                <input
                  type="text"
                  value={selectedClassesStr}
                  onChange={e => setSelectedClassesStr(e.target.value)}
                  placeholder="Mago, Clérigo, Bardo..."
                  className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Descripción Completa del Hechizo</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Efectos del conjuro, daño, dados de salvación..."
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
