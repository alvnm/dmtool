'use client';

import React, { useRef, useState } from 'react';
import { Monster, StatBlock } from '@/types';
import { formatMod } from '@/lib/combat';
import { StatBlockFields, defaultStatBlock } from '@/components/statblock/StatBlockFields';
import { StatBlockCard } from '@/components/statblock/StatBlockCard';
import { exportMonster, parseCreatures, readFileText } from '@/lib/statblockJson';
import { useToast } from '@/components/Toast';
import { EmptyState } from '@/components/EmptyState';
import { 
  Skull, Plus, Search, Shield, Heart, Zap, 
  Swords, Trash2, Download, Upload
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
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCr, setSelectedCr] = useState<string>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonsterForView, setSelectedMonsterForView] = useState<Monster | null>(null);
  // Con el bestiario SRD completo (cientos de fichas) se muestran de 60 en 60
  // para no montar cientos de tarjetas de golpe.
  const [visibleCount, setVisibleCount] = useState(60);

  // Form State (identidad de la criatura + bloque de estadísticas completo)
  const [name, setName] = useState('');
  const [size, setSize] = useState('Mediano');
  const [type, setType] = useState('Humanoide');
  const [alignment, setAlignment] = useState('Neutral Malvado');
  const [sb, setSb] = useState<StatBlock>(defaultStatBlock());
  const [importMsg, setImportMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const CR_OPTIONS = ['Todos', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'];

  const isCustomMonster = (m: Monster) => Boolean(m.isCustom || m.id.startsWith('mon-') || m.id.startsWith('custom-'));

  const filteredMonsters = monsters
    .filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCr = selectedCr === 'Todos' || m.cr === selectedCr;
      return matchesSearch && matchesCr;
    })
    .sort((a, b) => {
      const aCustom = isCustomMonster(a);
      const bCustom = isCustomMonster(b);
      if (aCustom && !bCustom) return -1;
      if (!aCustom && bCustom) return 1;
      return a.name.localeCompare(b.name);
    });
  const visibleMonsters = filteredMonsters.slice(0, visibleCount);

  // El cambio de filtros restaura la paginación visible.
  React.useEffect(() => { setVisibleCount(60); }, [searchTerm, selectedCr]);

  const handleSaveMonster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMonster: Monster = {
      id: `mon-${Date.now()}`,
      name,
      size,
      type,
      alignment,
      ac: sb.ac,
      hp_max: sb.hp_max,
      speed: sb.speed,
      stats: sb.stats,
      cr: sb.cr,
      traits: sb.traits,
      isCustom: true,
      legendary: sb.legendary,
      actions: sb.actions.length > 0 ? sb.actions : [
        { name: 'Ataque con Garrote', desc: '+3 al ataque, alcance 5 ft. Daño: 4 (1d6 + 1) contundente.' }
      ]
    };

    onUpdateMonsters([...monsters, newMonster]);
    setIsModalOpen(false);
    toast.success(`Monstruo «${name}» creado.`);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setSize('Mediano');
    setType('Humanoide');
    setAlignment('Neutral Malvado');
    setSb(defaultStatBlock());
    setImportMsg(null);
  };

  /** Importa criaturas desde un JSON (objeto suelto, envoltorio o array). */
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reimportar el mismo archivo
    if (!file) return;
    try {
      const text = await readFileText(file);
      const result = parseCreatures(text, 'monster');
      if (!result.ok) {
        setImportMsg({ kind: 'error', text: result.error });
        return;
      }
      onUpdateMonsters([...monsters, ...result.items]);
      setImportMsg({ kind: 'ok', text: `Importadas ${result.items.length} criatura(s) desde JSON.` });
    } catch (err) {
      setImportMsg({ kind: 'error', text: err instanceof Error ? err.message : 'No se pudo leer el archivo.' });
    }
  };

  const handleDelete = (id: string) => {
    const target = monsters.find(m => m.id === id);
    if (!target) return;
    if (!window.confirm(`¿Eliminar a «${target.name}» del bestiario? Esta acción no se puede deshacer.`)) return;
    onUpdateMonsters(monsters.filter(m => m.id !== id));
    toast.success(`«${target.name}» eliminado del bestiario.`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Skull className="w-6 h-6 text-red-400" />
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
              className="input pl-9 pr-4 py-2"
            />
          </div>
        </div>          <div className="flex items-center gap-2">
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
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="btn btn-secondary flex items-center gap-2 hover:text-amber-400 px-3 py-2 text-sm"
            title="Importar criaturas desde un fichero JSON"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importar JSON</span>
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Seleccionar fichero JSON con criaturas"
            onChange={handleImportFile}
          />

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Monstruo
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

      {/* Grid of Monster Statblock Cards */}
      {filteredMonsters.length === 0 ? (
        <EmptyState
          icon={Skull}
          title={monsters.length === 0 ? 'El bestiario está vacío' : 'Sin resultados'}
          description={
            monsters.length === 0
              ? 'El compendio aún no se ha cargado: crea una criatura a medida o revisa la conexión.'
              : 'Ninguna criatura coincide con la búsqueda o el CR seleccionado.'
          }
          actionLabel={monsters.length === 0 ? 'Crear monstruo' : 'Limpiar filtros'}
          onAction={
            monsters.length === 0
              ? () => {
                  resetForm();
                  setIsModalOpen(true);
                }
              : () => {
                  setSearchTerm('');
                  setSelectedCr('Todos');
                }
          }
        />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleMonsters.map(m => (
          <div
            key={m.id}
            className="card card-interactive hover:border-amber-500/40 space-y-4 flex flex-col justify-between"
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
                  <span className="text-micro text-slate-500 uppercase font-semibold block">Armadura</span>
                  <span className="text-sm font-bold text-slate-200 flex items-center justify-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-400" /> {m.ac}
                  </span>
                </div>
                <div>
                  <span className="text-micro text-slate-500 uppercase font-semibold block">Puntos de Vida</span>
                  <span className="text-sm font-bold text-red-400 flex items-center justify-center gap-1">
                    <Heart className="w-3.5 h-3.5" /> {m.hp_max}
                  </span>
                </div>
                <div>
                  <span className="text-micro text-slate-500 uppercase font-semibold block">Velocidad</span>
                  <span className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-blue-400" /> {m.speed}
                  </span>
                </div>
              </div>

              {/* Attributes Row */}
              <div className="grid grid-cols-6 gap-1 text-center bg-dungeon-950 p-2 rounded-lg border border-dungeon-800 my-3">
                {Object.entries(m.stats).map(([statKey, val]) => (
                  <div key={statKey}>
                    <span className="text-[9px] uppercase font-bold text-amber-400">{statKey}</span>
                    <p className="text-xs font-bold text-slate-200">{val}</p>
                    <span className="text-micro text-slate-400">{formatMod(val)}</span>
                  </div>
                ))}
              </div>

              {/* Actions Preview */}
              <div className="space-y-2 mt-3 text-xs text-slate-300">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-micro border-b border-dungeon-800 pb-1">
                  Rasgos
                </h4>
                {m.traits.length > 0 ? (
                  m.traits.map((trait, idx) => (
                    <div key={idx} className="leading-snug">
                      <span className="font-bold text-slate-100 italic">{trait.name}. </span>
                      <span className="text-slate-400">{trait.desc}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic">Sin rasgos especiales.</p>
                )}
              </div>

              <div className="space-y-2 mt-3 text-xs text-slate-300">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-micro border-b border-dungeon-800 pb-1">
                  Acciones
                </h4>
                {m.actions.slice(0, 2).map((act, idx) => (
                  <div key={idx} className="leading-snug">
                    <span className="font-bold text-slate-100 italic">{act.name}. </span>
                    <span className="text-slate-400">{act.desc}</span>
                  </div>
                ))}
              </div>

              {(m.legendary?.length ?? 0) > 0 && (
                <div className="space-y-2 mt-3 text-xs text-slate-300">
                  <h4 className="font-bold text-purple-400 uppercase tracking-wider text-micro border-b border-dungeon-800 pb-1">
                    Acciones legendarias
                  </h4>
                  {m.legendary!.map((act, idx) => (
                    <div key={idx} className="leading-snug">
                      <span className="font-bold text-slate-100 italic">{act.name}. </span>
                      <span className="text-slate-400">{act.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-dungeon-800 pt-3">
              <button
                onClick={() => onSendToCombat(m)}
                className="btn flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 px-3 py-1.5"
              >
                <Swords className="w-3.5 h-3.5" />
                Llevar al Combate
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => exportMonster(m)}
                  className="btn btn-icon text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                  title="Exportar ficha en JSON" aria-label="Exportar ficha en JSON"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="btn btn-icon text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  title="Eliminar de la lista" aria-label="Eliminar de la lista"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Paginación: mostrar más fichas del bestiario */}
      {filteredMonsters.length > visibleMonsters.length && (
        <div className="flex justify-center">
          <button
            onClick={() => setVisibleCount(c => c + 60)}
            className="btn flex items-center gap-2 bg-dungeon-900 hover:bg-dungeon-800 border border-dungeon-700 text-slate-300 hover:text-amber-400 text-sm px-5 py-2.5"
          >
            Mostrar más criaturas ({visibleMonsters.length} de {filteredMonsters.length})
          </button>
        </div>
      )}

      {/* Modal: Create Monster Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 max-w-4xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 border-b border-dungeon-800 pb-2">
              Crear Nueva Criatura / Monstruo Personalizado
            </h3>

            <form onSubmit={handleSaveMonster} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-4 items-start">
              <div className="space-y-4 min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Nombre</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Beholder / Minotauro del Abismo"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Tipo de Criatura</label>
                  <input
                    type="text"
                    value={type}
                    onChange={e => setType(e.target.value)}
                    placeholder="Humanoide, Bestia, Aberración..."
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tamaño</label>
                  <select
                    value={size}
                    onChange={e => setSize(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="Pequeño">Pequeño</option>
                    <option value="Mediano">Mediano</option>
                    <option value="Grande">Grande</option>
                    <option value="Enorme">Enorme</option>
                    <option value="Gargantuesco">Gargantuesco</option>
                  </select>
                </div>
                <div>
                  <label className="label">Alineación</label>
                  <input
                    type="text"
                    value={alignment}
                    onChange={e => setAlignment(e.target.value)}
                    placeholder="Neutral Malvado"
                    className="input"
                  />
                </div>
              </div>

              {/* Bloque de estadísticas completo: atributos, CA/PV/vel/CR, rasgos,
                  acciones y acciones legendarias (compartido con los NPCs). */}
              <StatBlockFields value={sb} onChange={setSb} />

              </div>

              {/* Vista previa en vivo de la ficha (escritorio) */}
              <div className="hidden lg:block sticky top-0">
                <StatBlockCard
                  preview
                  data={{
                    name,
                    size,
                    type,
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
              </div>

              {/* Vista previa en vivo de la ficha (móvil/tablet) */}
              <div className="lg:hidden">
                <StatBlockCard
                  preview
                  data={{
                    name,
                    size,
                    type,
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

              <div className="flex justify-end gap-2 pt-3 border-t border-dungeon-800">
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
