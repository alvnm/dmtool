'use client';

import React, { useRef, useState } from 'react';
import { NPC, NPC_DISPOSITIONS, StatBlock } from '@/types';
import { StatBlockFields, defaultStatBlock } from '@/components/statblock/StatBlockFields';
import { StatBlockCard } from '@/components/statblock/StatBlockCard';
import { exportNpc, parseCreatures, readFileText } from '@/lib/statblockJson';
import { useToast } from '@/components/Toast';
import { EmptyState } from '@/components/EmptyState';
import { 
  Users, Plus, Search, MapPin, Eye, EyeOff, 
  Trash2, Edit2, ShieldAlert, HeartHandshake, UserCheck, Flame,
  Download, Upload, Swords
} from 'lucide-react';

interface NpcManagerProps {
  npcs: NPC[];
  onUpdateNpcs: (npcs: NPC[]) => void;
}

export const NpcManager: React.FC<NpcManagerProps> = ({
  npcs,
  onUpdateNpcs,
}) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDisposition, setSelectedDisposition] = useState<string>('Todas');
  const [revealedSecrets, setRevealedSecrets] = useState<{ [id: string]: boolean }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNpc, setEditingNpc] = useState<NPC | null>(null);
  const [importMsg, setImportMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [alignment, setAlignment] = useState('Neutral');
  const [background, setBackground] = useState('');
  const [personality, setPersonality] = useState('');
  const [disposition, setDisposition] = useState<NPC['disposition']>('Neutral');
  const [location, setLocation] = useState('');
  const [secretNotes, setSecretNotes] = useState('');

  // Bloque de combate opcional del NPC (mismo editor que los monstruos)
  const [useSb, setUseSb] = useState(false);
  const [sb, setSb] = useState<StatBlock>(defaultStatBlock());

  // Eliltro de la lista se deriva de los valores tipados (no se desincroniza).
  const DISPOSITIONS = ['Todas', ...NPC_DISPOSITIONS];

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
    setUseSb(false);
    setSb(defaultStatBlock());
    setImportMsg(null);
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
    setSb(npc.statblock ?? defaultStatBlock());
    setUseSb(Boolean(npc.statblock));
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
        statblock: useSb ? sb : undefined,
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
        statblock: useSb ? sb : undefined,
      };
      onUpdateNpcs([...npcs, newNpc]);
    }

    setIsModalOpen(false);
    toast.success(editingNpc ? `NPC «${name}» actualizado.` : `NPC «${name}» creado.`);
  };

  /** Importa NPCs desde un JSON (objeto suelto, envoltorio o array). */
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await readFileText(file);
      const result = parseCreatures(text, 'npc');
      if (!result.ok) {
        setImportMsg({ kind: 'error', text: result.error });
        return;
      }
      onUpdateNpcs([...npcs, ...result.items]);
      setImportMsg({ kind: 'ok', text: `Importados ${result.items.length} NPC(s) desde JSON.` });
    } catch (err) {
      setImportMsg({ kind: 'error', text: err instanceof Error ? err.message : 'No se pudo leer el archivo.' });
    }
  };

  const handleDelete = (id: string) => {
    const target = npcs.find(n => n.id === id);
    if (!target) return;
    if (!window.confirm(`¿Eliminar al NPC «${target.name}»? Esta acción no se puede deshacer.`)) return;
    onUpdateNpcs(npcs.filter(n => n.id !== id));
    toast.success(`NPC «${target.name}» eliminado.`);
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
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Users className="w-6 h-6 text-purple-400" />
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
              className="input pl-9 pr-4 py-2"
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
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="btn btn-secondary flex items-center gap-2 hover:text-amber-400 px-3 py-2 text-sm"
            title="Importar NPCs desde un fichero JSON"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importar JSON</span>
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Seleccionar fichero JSON con NPCs"
            onChange={handleImportFile}
          />

          <button
            onClick={handleOpenAdd}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear NPC
          </button>
        </div>
      </div>

      {importMsg && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-xs border ${
            importMsg.kind === 'ok'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-red-950/60 border-red-800 text-red-300'
          }`}
        >
          <span>{importMsg.text}</span>
          <button
            type="button"
            onClick={() => setImportMsg(null)}
            aria-label="Cerrar aviso de importación"
            className="btn px-1 hover:opacity-70"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid of NPC Cards */}
      {filteredNpcs.length === 0 ? (
        <EmptyState
          icon={Users}
          title={npcs.length === 0 ? 'Aún no hay NPCs' : 'Sin resultados'}
          description={
            npcs.length === 0
              ? 'Crea a los mercaderes, informadores y villanos de tu campaña, con sus secretos.'
              : 'Ningún NPC coincide con la búsqueda o la disposición seleccionada.'
          }
          actionLabel={npcs.length === 0 ? 'Crear NPC' : 'Limpiar filtros'}
          onAction={
            npcs.length === 0
              ? handleOpenAdd
              : () => {
                  setSearchTerm('');
                  setSelectedDisposition('Todas');
                }
          }
        />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNpcs.map(npc => {
          const dispBadge = getDispositionBadge(npc.disposition);
          const IconComponent = dispBadge.icon;
          const isSecretRevealed = !!revealedSecrets[npc.id];

          return (
            <div
              key={npc.id}
              className="card card-interactive hover:border-dungeon-700 space-y-4 flex flex-col justify-between"
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
                  <span className={`text-micro font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${dispBadge.color}`}>
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
                      <span className="text-slate-500 font-semibold block uppercase text-micro">Trasfondo:</span>
                      <p className="text-slate-300">{npc.background}</p>
                    </div>
                  )}

                  {npc.personality && (
                    <div>
                      <span className="text-slate-500 font-semibold block uppercase text-micro">Personalidad:</span>
                      <p className="text-slate-300 italic">{npc.personality}</p>
                    </div>
                  )}
                </div>

                {/* Bloque de combate opcional */}
                {npc.statblock && (
                  <div className="mt-3 pt-3 border-t border-dungeon-800 space-y-2">
                    <span className="text-micro text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Swords className="w-3 h-3 text-amber-400" /> Bloque de combate
                    </span>
                    <div className="grid grid-cols-4 gap-2 text-center bg-dungeon-950 border border-dungeon-800 rounded-lg p-2 text-xs">
                      <div>
                        <span className="text-micro text-slate-500 uppercase block">CA</span>
                        <strong className="text-slate-200">{npc.statblock.ac}</strong>
                      </div>
                      <div>
                        <span className="text-micro text-slate-500 uppercase block">PV</span>
                        <strong className="text-red-400">{npc.statblock.hp_max}</strong>
                      </div>
                      <div>
                        <span className="text-micro text-slate-500 uppercase block">Vel.</span>
                        <strong className="text-slate-300">{npc.statblock.speed}</strong>
                      </div>
                      <div>
                        <span className="text-micro text-slate-500 uppercase block">CR</span>
                        <strong className="text-amber-400">{npc.statblock.cr}</strong>
                      </div>
                    </div>
                    <div className="grid grid-cols-6 gap-1 text-center">
                      {Object.entries(npc.statblock.stats).map(([k, v]) => (
                        <div key={k}>
                          <span className="text-[9px] uppercase font-bold text-amber-400 block">{k}</span>
                          <span className="text-xs font-bold text-slate-200">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DM Secret Notes Section */}
                <div className="mt-4 pt-3 border-t border-dungeon-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-micro font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      🔒 Notas Secretas del DM
                    </span>
                    <button
                      onClick={() => toggleSecret(npc.id)}
                      className="btn text-slate-400 hover:text-purple-300 flex items-center gap-1"
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
                  onClick={() => exportNpc(npc)}
                  className="btn btn-icon text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                  title="Exportar NPC en JSON" aria-label="Exportar NPC en JSON"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(npc)}
                  className="btn btn-icon text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                  title="Editar NPC" aria-label="Editar NPC"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(npc.id)}
                  className="btn btn-icon text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  title="Eliminar NPC" aria-label="Eliminar NPC"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modal Add/Edit NPC */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 max-w-4xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 border-b border-dungeon-800 pb-2">
              {editingNpc ? 'Editar Ficha de NPC' : 'Crear Nuevo NPC'}
            </h3>

            <form onSubmit={handleSaveNpc} className="space-y-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none w-fit">
                <input
                  type="checkbox"
                  checked={useSb}
                  onChange={e => setUseSb(e.target.checked)}
                  className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                />
                Añadir bloque de combate (CA, PV, atributos, rasgos y acciones)
              </label>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-4 items-start">
              <div className="space-y-3 min-w-0">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nombre</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Eladrin Vaelen"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Raza</label>
                  <input
                    type="text"
                    required
                    value={race}
                    onChange={e => setRace(e.target.value)}
                    placeholder="Alto Elfo, Enano, Humano..."
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Afecto hacia la Party</label>
                  <select
                    value={disposition}
                    onChange={e => setDisposition(e.target.value as NPC['disposition'])}
                    className="input"
                  >
                    {NPC_DISPOSITIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Ubicación</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Ej: Taverna del Dragón"
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Alineamiento</label>
                  <input
                    type="text"
                    value={alignment}
                    onChange={e => setAlignment(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Trasfondo / Profesión</label>
                  <input
                    type="text"
                    value={background}
                    onChange={e => setBackground(e.target.value)}
                    placeholder="Erudito, Herrero, Alquimista..."
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Personalidad & Rasgos</label>
                <textarea
                  rows={2}
                  value={personality}
                  onChange={e => setPersonality(e.target.value)}
                  placeholder="Forma de hablar, tics, motivaciones..."
                  className="input resize-none"
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

                {useSb && (
                  <div className="pt-3 border-t border-dungeon-800">
                    <StatBlockFields value={sb} onChange={setSb} />
                  </div>
                )}
              </div>

              {useSb && (
                <div className="hidden lg:block sticky top-0">
                  <StatBlockCard
                    preview
                    data={{
                      name: name || editingNpc?.name || 'NPC',
                      type: 'Personaje no jugador',
                      alignment,
                      cr: sb.cr,
                      ac: sb.ac,
                      hp_max: sb.hp_max,
                      speed: sb.speed,
                      stats: sb.stats,
                      traits: sb.traits,
                      actions: sb.actions,
                      legendary: sb.legendary,
                    }}
                  />
                </div>
              )}
              </div>

              {useSb && (
                <div className="lg:hidden">
                  <StatBlockCard
                    preview
                    data={{
                      name: name || editingNpc?.name || 'NPC',
                      type: 'Personaje no jugador',
                      alignment,
                      cr: sb.cr,
                      ac: sb.ac,
                      hp_max: sb.hp_max,
                      speed: sb.speed,
                      stats: sb.stats,
                      traits: sb.traits,
                      actions: sb.actions,
                      legendary: sb.legendary,
                    }}
                  />
                </div>
              )}

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
