import fs from 'node:fs';

const path = 'src/components/initiative/InitiativeTracker.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `<div className="overflow-y-auto space-y-4 pr-1 flex-1">
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">
                  Monstruos Disponibles ({monsters.length})
                </h4>
                <div className="space-y-2">
                  {monsters.map(m => (
                    <div
                      key={m.id}
                      className="bg-dungeon-950 border border-dungeon-800 hover:border-amber-500/50 rounded-lg p-3 flex items-center justify-between gap-2 transition"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-slate-200 text-sm truncate block">{m.name}</span>
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
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">
                  NPCs Registrados ({npcs.length})
                </h4>
                <div className="space-y-2">
                  {npcs.map(n => (
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
                  ))}
                </div>
              </div>
            </div>`;

const replacement = `{(() => {
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
                <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">
                  Monstruos Disponibles ({filteredMonsters.length})
                </h4>
                <div className="space-y-2">
                  {filteredMonsters.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 italic text-center">No se encontraron monstruos con esa búsqueda.</p>
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
                <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">
                  NPCs Registrados ({filteredNpcs.length})
                </h4>
                <div className="space-y-2">
                  {filteredNpcs.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 italic text-center">No se encontraron NPCs con esa búsqueda.</p>
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

// Reemplazar normalizando saltos de línea
const normContent = content.replace(/\r\n/g, '\n');
const normTarget = target.replace(/\r\n/g, '\n');

if (!normContent.includes(normTarget)) {
  console.error('Target not found in content!');
  process.exit(1);
}

const updated = normContent.replace(normTarget, replacement);
fs.writeFileSync(path, updated.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully replaced body!');
