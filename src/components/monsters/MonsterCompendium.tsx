'use client';

import React, { useState } from 'react';
import { Monster, Combatant } from '@/types';
import { 
  Skull, Plus, Search, Shield, Heart, Zap, 
  Swords, Sparkles, Trash2, Edit2, Eye
} from 'lucide-react';

interface MonsterCompendiumProps {
  monsters: Monster[];
  onUpdateMonsters: (monsters: Monster[]) => void;
  onSendToCombat: (monster: Monster) => void;
}

export const MonsterCompendium: React.FC<MonsterCompendiumProps> = ({
  monsters,
  onUpdateMonsters,
  onSendToCombat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCr, setSelectedCr] = useState<string>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonsterForView, setSelectedMonsterForView] = useState<Monster | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [size, setSize] = useState('Mediano');
  const [type, setType] = useState('Humanoide');
  const [alignment, setAlignment] = useState('Neutral Malvado');
  const [ac, setAc] = useState(13);
  const [hpMax, setHpMax] = useState(15);
  const [speed, setSpeed] = useState('30 ft.');
  const [cr, setCr] = useState('1');
  const [str, setStr] = useState(10);
  const [dex, setDex] = useState(10);
  const [con, setCon] = useState(10);
  const [int, setInt] = useState(10);
  const [wis, setWis] = useState(10);
  const [cha, setCha] = useState(10);
  const [actionName, setActionName] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [actionsList, setActionsList] = useState<{ name: string; desc: string }[]>([]);

  const CR_OPTIONS = ['Todos', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'];

  const getMod = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const filteredMonsters = monsters.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCr = selectedCr === 'Todos' || m.cr === selectedCr;
    return matchesSearch && matchesCr;
  });

  const handleAddAction = () => {
    if (!actionName.trim() || !actionDesc.trim()) return;
    setActionsList([...actionsList, { name: actionName, desc: actionDesc }]);
    setActionName('');
    setActionDesc('');
  };

  const handleSaveMonster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMonster: Monster = {
      id: `mon-${Date.now()}`,
      name,
      size,
      type,
      alignment,
      ac: Number(ac),
      hp_max: Number(hpMax),
      speed,
      stats: { str, dex, con, int, wis, cha },
      cr,
      traits: [],
      actions: actionsList.length > 0 ? actionsList : [
        { name: 'Ataque con Garrote', desc: '+3 al ataque, alcance 5 ft. Daño: 4 (1d6 + 1) contundente.' }
      ]
    };

    onUpdateMonsters([...monsters, newMonster]);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setSize('Mediano');
    setType('Humanoide');
    setAlignment('Neutral Malvado');
    setAc(13);
    setHpMax(15);
    setSpeed('30 ft.');
    setCr('1');
    setStr(10);
    setDex(10);
    setCon(10);
    setInt(10);
    setWis(10);
    setCha(10);
    setActionsList([]);
  };

  const handleDelete = (id: string) => {
    onUpdateMonsters(monsters.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            <Skull className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Compendio de Monstruos y Bestiario</h2>
            <p className="text-xs text-slate-400">{monsters.length} criaturas registradas</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar criatura por nombre o tipo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCr}
            onChange={e => setSelectedCr(e.target.value)}
            className="bg-dungeon-950 border border-dungeon-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
          >
            {CR_OPTIONS.map(c => (
              <option key={c} value={c}>CR: {c}</option>
            ))}
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Crear Monstruo
          </button>
        </div>
      </div>

      {/* Grid of Monster Statblock Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMonsters.map(m => (
          <div
            key={m.id}
            className="bg-dungeon-900 border border-dungeon-800 hover:border-amber-500/40 rounded-xl p-5 shadow-lg space-y-4 flex flex-col justify-between transition"
          >
            <div>
              {/* Card Header */}
              <div className="border-b border-dungeon-800 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-amber-400 font-serif">{m.name}</h3>
                  <p className="text-xs text-slate-400 italic">
                    {m.size} {m.type}, {m.alignment}
                  </p>
                </div>
                <span className="bg-red-950 text-red-300 border border-red-800 font-bold text-xs px-2.5 py-1 rounded">
                  CR {m.cr}
                </span>
              </div>

              {/* Core Vitals: AC, HP, Speed */}
              <div className="grid grid-cols-3 gap-2 text-center my-3 bg-dungeon-950/80 p-2.5 rounded-lg border border-dungeon-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Armadura</span>
                  <span className="text-sm font-bold text-slate-200 flex items-center justify-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-400" /> {m.ac}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Puntos de Vida</span>
                  <span className="text-sm font-bold text-red-400 flex items-center justify-center gap-1">
                    <Heart className="w-3.5 h-3.5" /> {m.hp_max}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Velocidad</span>
                  <span className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-blue-400" /> {m.speed}
                  </span>
                </div>
              </div>

              {/* Attributes Row */}
              <div className="grid grid-cols-6 gap-1 text-center bg-dungeon-950 p-2 rounded-lg border border-dungeon-800 my-3">
                {Object.entries(m.stats).map(([statKey, val]) => (
                  <div key={statKey}>
                    <span className="text-[9px] uppercase font-bold text-amber-500/80">{statKey}</span>
                    <p className="text-xs font-bold text-slate-200">{val}</p>
                    <span className="text-[10px] text-slate-400">{getMod(val)}</span>
                  </div>
                ))}
              </div>

              {/* Actions Preview */}
              <div className="space-y-2 mt-3 text-xs text-slate-300">
                <h4 className="font-bold text-amber-400/90 uppercase tracking-wider text-[11px] border-b border-dungeon-800 pb-1">
                  Acciones
                </h4>
                {m.actions.slice(0, 2).map((act, idx) => (
                  <div key={idx} className="leading-snug">
                    <span className="font-bold text-slate-100 italic">{act.name}. </span>
                    <span className="text-slate-400">{act.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-dungeon-800 pt-3">
              <button
                onClick={() => onSendToCombat(m)}
                className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-semibold px-3 py-1.5 rounded transition"
              >
                <Swords className="w-3.5 h-3.5" />
                Llevar al Combate
              </button>

              <button
                onClick={() => handleDelete(m.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                title="Eliminar de la lista"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Monster Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 border-b border-dungeon-800 pb-2">
              Crear Nueva Criatura / Monstruo Personalizado
            </h3>

            <form onSubmit={handleSaveMonster} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Beholder / Minotauro del Abismo"
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tipo de Criatura</label>
                  <input
                    type="text"
                    value={type}
                    onChange={e => setType(e.target.value)}
                    placeholder="Humanoide, Bestia, Aberración..."
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tamaño</label>
                  <select
                    value={size}
                    onChange={e => setSize(e.target.value)}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-xs text-slate-200"
                  >
                    <option value="Pequeño">Pequeño</option>
                    <option value="Mediano">Mediano</option>
                    <option value="Grande">Grande</option>
                    <option value="Enorme">Enorme</option>
                    <option value="Gargantuesco">Gargantuesco</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Desafío (CR)</label>
                  <input
                    type="text"
                    value={cr}
                    onChange={e => setCr(e.target.value)}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">AC</label>
                  <input
                    type="number"
                    value={ac}
                    onChange={e => setAc(Number(e.target.value))}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">HP Máximo</label>
                  <input
                    type="number"
                    value={hpMax}
                    onChange={e => setHpMax(Number(e.target.value))}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200"
                  />
                </div>
              </div>

              {/* Attributes Input */}
              <div className="bg-dungeon-950 p-3 rounded-lg border border-dungeon-800">
                <label className="block text-xs font-bold text-amber-400 mb-2 uppercase">Atributos Principales</label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { label: 'STR', val: str, setter: setStr },
                    { label: 'DEX', val: dex, setter: setDex },
                    { label: 'CON', val: con, setter: setCon },
                    { label: 'INT', val: int, setter: setInt },
                    { label: 'WIS', val: wis, setter: setWis },
                    { label: 'CHA', val: cha, setter: setCha },
                  ].map(item => (
                    <div key={item.label}>
                      <span className="text-[10px] text-slate-400 block text-center">{item.label}</span>
                      <input
                        type="number"
                        value={item.val}
                        onChange={e => item.setter(Number(e.target.value))}
                        className="w-full bg-dungeon-900 border border-dungeon-800 rounded text-center text-xs text-slate-200 py-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Action Subform */}
              <div className="bg-dungeon-950 p-3 rounded-lg border border-dungeon-800 space-y-2">
                <label className="block text-xs font-bold text-amber-400 uppercase">Agregar Acciones de Ataque</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Nombre acción (ej: Garra)"
                    value={actionName}
                    onChange={e => setActionName(e.target.value)}
                    className="bg-dungeon-900 border border-dungeon-800 text-xs rounded p-2 text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="Descripción (+5 al ataque, 1d8+3 daño...)"
                    value={actionDesc}
                    onChange={e => setActionDesc(e.target.value)}
                    className="bg-dungeon-900 border border-dungeon-800 text-xs rounded p-2 text-slate-200 md:col-span-2"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAction}
                  className="bg-dungeon-800 text-amber-300 hover:bg-dungeon-700 text-xs px-3 py-1 rounded font-semibold transition"
                >
                  + Añadir Acción
                </button>

                {actionsList.length > 0 && (
                  <div className="pt-2 space-y-1">
                    {actionsList.map((act, i) => (
                      <div key={i} className="text-xs bg-dungeon-900 p-2 rounded border border-dungeon-800 text-slate-300">
                        <strong className="text-amber-400">{act.name}:</strong> {act.desc}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-dungeon-800">
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
                  Guardar Monstruo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
