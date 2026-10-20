import fs from 'node:fs';

const path = 'src/components/initiative/InitiativeTracker.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Agregar Search a los imports de lucide-react si no está
if (!content.includes('Search,')) {
  content = content.replace('RotateCcw, Sparkles,', 'RotateCcw, Sparkles, Search,');
}

// 2. Modificar el modal de importación para incluir el input de búsqueda y el filtrado
const searchBlock = `            <div className="flex items-center justify-between border-b border-dungeon-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Importar al Combate desde la Base de Datos
              </h3>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportSearchTerm('');
                }}
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Buscador de monstruos y NPCs */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={importSearchTerm}
                onChange={e => setImportSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, tipo, raza o CR..."
                className="w-full bg-dungeon-950 border border-dungeon-800 focus:border-amber-500/50 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition"
                autoFocus
              />
              {importSearchTerm && (
                <button
                  type="button"
                  onClick={() => setImportSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
                >
                  ✕
                </button>
              )}
            </div>`;

content = content.replace(
  /<div className="flex items-center justify-between border-b border-dungeon-800 pb-3">[\s\S]*?<\/div>/,
  (match) => {
    if (match.includes('Importar al Combate')) {
      return searchBlock;
    }
    return match;
  }
);

// 3. Filtrar monstruos y npcs según importSearchTerm y colocar los custom al principio
const filterLogic = `            {(() => {
              const term = importSearchTerm.trim().toLowerCase();
              const isCustomMon = (m: Monster) => Boolean(m.isCustom || m.id.startsWith('mon-') || m.id.startsWith('custom-'));
              const filteredMonsters = monsters
                .filter(m => !term || m.name.toLowerCase().includes(term) || m.type.toLowerCase().includes(term) || m.cr.toLowerCase().includes(term))
                .sort((a, b) => {
                  const aC = isCustomMon(a);
                  const bC = isCustomMon(b);
                  if (aC && !bC) return -1;
                  if (!aC && bC) return 1;
                  return a.name.localeCompare(b.name);
                });
              const filteredNpcs = npcs.filter(n => !term || n.name.toLowerCase().includes(term) || n.race.toLowerCase().includes(term) || n.disposition.toLowerCase().includes(term));

              return (
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider flex items-center justify-between">
                  <span>Monstruos Disponibles ({filteredMonsters.length})</span>
                </h4>
                <div className="space-y-2">
                  {filteredMonsters.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2 italic text-center">No se encontraron monstruos con esa búsqueda.</p>
                  ) : (
                    filteredMonsters.map(m => (
                    <div
                      key={m.id}
                      className="bg-dungeon-950 border border-dungeon-800 hover:border-amber-500/50 rounded-lg p-3 flex items-center justify-between gap-2 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 text-sm truncate block">{m.name}</span>
                          {isCustomMon(m) && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded font-semibold">
                              Creado
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                          <span>CR: {m.cr}</span>
                          <span>AC: {m.ac}</span>
                          <span>HP: {m.hp_max}</span>
                          <span className="text-amber-400">
                            DEST {m.stats.dex} ({formatMod(m.stats.dex)})
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleImportMonster(m)}
                        className="bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-semibold px-3 py-1.5 rounded transition shrink-0"
                      >
                        + Añadir al Combate
                      </button>
                    </div>
                  )))}
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider flex items-center justify-between">
                  <span>NPCs Registrados ({filteredNpcs.length})</span>
                </h4>
                <div className="space-y-2">
                  {filteredNpcs.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2 italic text-center">No se encontraron NPCs con esa búsqueda.</p>
                  ) : (
                    filteredNpcs.map(n => (
                    <div
                      key={n.id}
                      className="bg-dungeon-950 border border-dungeon-800 hover:border-amber-500/50 rounded-lg p-3 flex items-center justify-between gap-2 transition"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-slate-200 text-sm truncate block">{n.name}</span>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {n.race} • {n.disposition}
                        </div>
                      </div>
                      <button
                        onClick={() => handleImportNpc(n)}
                        className="bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-semibold px-3 py-1.5 rounded transition shrink-0"
                      >
                        + Añadir al Combate
                      </button>
                    </div>
                  )))}
                </div>
              </div>
            </div>
              );
            })()}`;

const oldBodyRegex = /<div className="overflow-y-auto space-y-4 pr-1 flex-1">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}\s*\{\/\* MODAL 3/;
content = content.replace(
  oldBodyRegex,
  filterLogic + '\n          </div>\n        </div>\n      )}\n\n      {/* MODAL 3'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Update finished successfully.');
