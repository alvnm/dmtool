'use client';

import React, { useState } from 'react';
import { NPC } from '@/types';
import { 
  Users, Plus, Search, MapPin, Eye, EyeOff, 
  Trash2, Edit2, ShieldAlert, HeartHandshake, UserCheck, Flame
} from 'lucide-react';

interface NpcManagerProps {
  npcs: NPC[];
  onUpdateNpcs: (npcs: NPC[]) => void;
}

export const NpcManager: React.FC<NpcManagerProps> = ({
  npcs,
  onUpdateNpcs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDisposition, setSelectedDisposition] = useState<string>('Todas');
  const [revealedSecrets, setRevealedSecrets] = useState<{ [id: string]: boolean }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNpc, setEditingNpc] = useState<NPC | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [alignment, setAlignment] = useState('Neutral');
  const [background, setBackground] = useState('');
  const [personality, setPersonality] = useState('');
  const [disposition, setDisposition] = useState<NPC['disposition']>('Neutral');
  const [location, setLocation] = useState('');
  const [secretNotes, setSecretNotes] = useState('');

  const DISPOSITIONS = ['Todas', 'Aliado', 'Amigable', 'Neutral', 'Hostil', 'Enemigo'];

  const toggleSecret = (id: string) => {
    setRevealedSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredNpcs = npcs.filter(n => {
    const matchesSearch = n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          n.race.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (n.location && n.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDisp = selectedDisposition === 'Todas' || n.disposition === selectedDisposition;
    return matchesSearch && matchesDisp;
  });

  const handleOpenAdd = () => {
    setEditingNpc(null);
    setName('');
    setRace('Humano');
    setAlignment('Neutral');
    setBackground('Comerciante');
    setPersonality('');
    setDisposition('Neutral');
    setLocation('Taverna Local');
    setSecretNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (npc: NPC) => {
    setEditingNpc(npc);
    setName(npc.name);
    setRace(npc.race);
    setAlignment(npc.alignment);
    setBackground(npc.background || '');
    setPersonality(npc.personality || '');
    setDisposition(npc.disposition);
    setLocation(npc.location || '');
    setSecretNotes(npc.secret_notes || '');
    setIsModalOpen(true);
  };

  const handleSaveNpc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingNpc) {
      const updated = npcs.map(n => n.id === editingNpc.id ? {
        ...n,
        name,
        race,
        alignment,
        background,
        personality,
        disposition,
        location,
        secret_notes: secretNotes,
      } : n);
      onUpdateNpcs(updated);
    } else {
      const newNpc: NPC = {
        id: `npc-${Date.now()}`,
        name,
        race,
        alignment,
        background,
        personality,
        disposition,
        location,
        secret_notes: secretNotes,
      };
      onUpdateNpcs([...npcs, newNpc]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    onUpdateNpcs(npcs.filter(n => n.id !== id));
  };

  const getDispositionBadge = (disp: NPC['disposition']) => {
    switch (disp) {
      case 'Aliado': return { label: 'Aliado', color: 'bg-emerald-950 text-emerald-300 border-emerald-800', icon: UserCheck };
      case 'Amigable': return { label: 'Amigable', color: 'bg-blue-950 text-blue-300 border-blue-800', icon: HeartHandshake };
      case 'Neutral': return { label: 'Neutral', color: 'bg-slate-800 text-slate-300 border-slate-700', icon: Users };
      case 'Hostil': return { label: 'Hostil', color: 'bg-amber-950 text-amber-300 border-amber-800', icon: ShieldAlert };
      case 'Enemigo': return { label: 'Enemigo', color: 'bg-rose-950 text-rose-300 border-rose-800', icon: Flame };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Filters */}
      <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Gestor de NPCs y Aliados</h2>
            <p className="text-xs text-slate-400">{npcs.length} personajes no jugadores registrados</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar NPC por nombre, raza o ubicación..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDisposition}
            onChange={e => setSelectedDisposition(e.target.value)}
            className="bg-dungeon-950 border border-dungeon-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
          >
            {DISPOSITIONS.map(d => (
              <option key={d} value={d}>Afecto: {d}</option>
            ))}
          </select>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Crear NPC
          </button>
        </div>
      </div>

      {/* Grid of NPC Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNpcs.map(npc => {
          const dispBadge = getDispositionBadge(npc.disposition);
          const IconComponent = dispBadge.icon;
          const isSecretRevealed = !!revealedSecrets[npc.id];

          return (
            <div
              key={npc.id}
              className="bg-dungeon-900 border border-dungeon-800 hover:border-dungeon-700 rounded-xl p-5 shadow-lg space-y-4 flex flex-col justify-between transition"
            >
              <div>
                {/* Header */}
                <div className="border-b border-dungeon-800 pb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{npc.name}</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {npc.race} • {npc.alignment}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${dispBadge.color}`}>
                    <IconComponent className="w-3 h-3" />
                    {dispBadge.label}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mt-3 text-xs text-slate-300">
                  {npc.location && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ubicación: <strong className="text-slate-200">{npc.location}</strong></span>
                    </div>
                  )}

                  {npc.background && (
                    <div>
                      <span className="text-slate-500 font-semibold block uppercase text-[10px]">Trasfondo:</span>
                      <p className="text-slate-300">{npc.background}</p>
                    </div>
                  )}

                  {npc.personality && (
                    <div>
                      <span className="text-slate-500 font-semibold block uppercase text-[10px]">Personalidad:</span>
                      <p className="text-slate-300 italic">{npc.personality}</p>
                    </div>
                  )}
                </div>

                {/* DM Secret Notes Section */}
                <div className="mt-4 pt-3 border-t border-dungeon-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      🔒 Notas Secretas del DM
                    </span>
                    <button
                      onClick={() => toggleSecret(npc.id)}
                      className="text-slate-400 hover:text-purple-300 text-xs flex items-center gap-1"
                    >
                      {isSecretRevealed ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Revelar
                        </>
                      )}
                    </button>
                  </div>

                  <div className={`p-2.5 rounded-lg border text-xs leading-relaxed transition ${
                    isSecretRevealed
                      ? 'bg-purple-950/40 border-purple-800 text-purple-200'
                      : 'bg-dungeon-950 border-dungeon-800 text-slate-600 blur-[3px] select-none pointer-events-none'
                  }`}>
                    {npc.secret_notes || 'Sin notas secretas registradas.'}
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="flex items-center justify-end gap-1 border-t border-dungeon-800 pt-3">
                <button
                  onClick={() => handleOpenEdit(npc)}
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded transition"
                  title="Editar NPC"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(npc.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                  title="Eliminar NPC"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit NPC */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dungeon-900 border border-dungeon-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 border-b border-dungeon-800 pb-2">
              {editingNpc ? 'Editar Ficha de NPC' : 'Crear Nuevo NPC'}
            </h3>

            <form onSubmit={handleSaveNpc} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Eladrin Vaelen"
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Raza</label>
                  <input
                    type="text"
                    required
                    value={race}
                    onChange={e => setRace(e.target.value)}
                    placeholder="Alto Elfo, Enano, Humano..."
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Afecto hacia la Party</label>
                  <select
                    value={disposition}
                    onChange={e => setDisposition(e.target.value as any)}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  >
                    {DISPOSITIONS.filter(d => d !== 'Todas').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Ubicación</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Ej: Taverna del Dragón"
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Alineamiento</label>
                  <input
                    type="text"
                    value={alignment}
                    onChange={e => setAlignment(e.target.value)}
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Trasfondo / Profesión</label>
                  <input
                    type="text"
                    value={background}
                    onChange={e => setBackground(e.target.value)}
                    placeholder="Erudito, Herrero, Alquimista..."
                    className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Personalidad & Rasgos</label>
                <textarea
                  rows={2}
                  value={personality}
                  onChange={e => setPersonality(e.target.value)}
                  placeholder="Forma de hablar, tics, motivaciones..."
                  className="w-full bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-400 mb-1">🔒 Notas Secretas del DM (Solo tú las verás)</label>
                <textarea
                  rows={3}
                  value={secretNotes}
                  onChange={e => setSecretNotes(e.target.value)}
                  placeholder="Secretos de la trama, verdaderas intenciones, inventario oculto..."
                  className="w-full bg-dungeon-950 border border-purple-800/60 rounded-lg p-2 text-sm text-slate-200 focus:border-purple-500 focus:outline-none resize-none"
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
                  {editingNpc ? 'Guardar Cambios' : 'Crear NPC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
