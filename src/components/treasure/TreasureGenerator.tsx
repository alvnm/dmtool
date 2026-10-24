'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Sparkles, Gift, Send, Gem } from 'lucide-react';
import { generateTreasure, type TreasureResult, type TreasureTier } from '@/lib/treasure';
import { InventoryItem } from '@/types';

interface TreasureGeneratorProps {
  onUpdateItems: (updater: (prev: InventoryItem[]) => InventoryItem[]) => void;
  onGoToInventory: () => void;
}

const TIERS: Array<{ id: TreasureTier; label: string; hint: string }> = [
  { id: 1, label: 'Nivel 1-4', hint: 'Primeras mazmorras' },
  { id: 2, label: 'Nivel 5-10', hint: 'Facciones y ciudades' },
  { id: 3, label: 'Nivel 11-16', hint: 'Reinos y planes' },
  { id: 4, label: 'Nivel 17+', hint: 'Dioses y dragones' },
];

/**
 * Generador instantáneo de tesoros: un clic produce un botín creíble para el
 * encuentro que el DM acaba de resolver, y se puede volcar al inventario.
 */
export const TreasureGenerator: React.FC<TreasureGeneratorProps> = ({
  onUpdateItems,
  onGoToInventory,
}) => {
  const [tier, setTier] = useState<TreasureTier>(1);
  const [lucky, setLucky] = useState(false);
  const [result, setResult] = useState<TreasureResult | null>(null);
  const [sent, setSent] = useState(false);

  const handleGenerate = () => {
    setResult(generateTreasure(tier, lucky));
    setSent(false);
  };

  const handleSendToInventory = () => {
    if (!result || sent) return;
    const stamp = Date.now();
    const newItems: InventoryItem[] = result.lines.map((line, index) => ({
      id: `loot-${stamp}-${index}`,
      name: line.label.replace('✨ ', ''),
      type: 'Tesoro',
      rarity: line.rarity ?? 'Común',
      weight: line.rarity ? 0.5 : 0.1,
      value_gp: line.gp,
      assigned_to: `Botín · ${result.title}`,
      description: `Generado para ${result.title.toLowerCase()} (tier ${result.tier}).`,
    }));
    onUpdateItems(prev => [...prev, ...newItems]);
    setSent(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Gift className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Generador de Tesoros</h2>
            <p className="text-xs text-slate-400">
              Recompensas al vuelo cuando el grupo abre ese cofre que no estaba en tus notas
            </p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="card space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TIERS.map(t => (
            <button
              key={t.id}
              onClick={() => setTier(t.id)}
              className={`text-left px-3 py-2.5 rounded-lg border text-sm transition min-h-[46px] ${
                tier === t.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-dungeon-950 text-slate-300 border-dungeon-700 hover:border-amber-500/50'
              }`}
            >
              <span className="block text-xs font-bold">{t.label}</span>
              <span className={`block text-micro ${tier === t.id ? 'text-slate-950/70' : 'text-slate-500'}`}>
                {t.hint}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lucky}
              onChange={e => setLucky(e.target.checked)}
              className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
            />
            Botín generoso (para recompensas de hito)
          </label>

          <button
            onClick={handleGenerate}
            className="btn btn-primary flex items-center gap-2 text-sm py-2.5 min-h-[44px]"
          >
            <Sparkles className="w-4 h-4" /> Generar botín
          </button>
        </div>
      </div>

      {/* Resultado */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={`${result.tier}-${result.lines.length}-${result.totalGp}-${result.title}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-dungeon-900 border border-dungeon-800 rounded-xl p-5 shadow-lg space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dungeon-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <Gem className="w-5 h-5 text-yellow-400" /> {result.title}
                </h3>
                <p className="text-xs text-slate-400">{result.lines.length} piezas de botín</p>
              </div>
              <div className="flex items-center gap-2 text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-lg">
                <Coins className="w-4 h-4" />
                <span className="font-black">{result.totalGp.toLocaleString()} PO</span>
              </div>
            </div>

            <ul className="space-y-2">
              {result.lines.map((line, i) => (
                <motion.li
                  key={`${line.label}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.18 }}
                  className="flex items-center justify-between gap-3 bg-dungeon-950 border border-dungeon-800 rounded-lg px-3 py-2.5 text-sm"
                >
                  <span className="text-slate-200 flex items-center gap-2 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${line.gp > 0 ? 'bg-yellow-400' : 'bg-purple-400'}`} />
                    <span className="truncate">{line.label}</span>
                    {line.rarity && (
                      <span className="text-micro uppercase tracking-wide text-purple-300 bg-purple-950 border border-purple-900 px-1.5 py-0.5 rounded shrink-0">
                        {line.rarity}
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-yellow-400 shrink-0">
                    {line.gp > 0 ? `${line.gp.toLocaleString()} PO` : '—'}
                  </span>
                </motion.li>
              ))}
            </ul>

            <button
              onClick={handleSendToInventory}
              disabled={sent}
              className="btn flex items-center gap-2 bg-dungeon-800 hover:bg-dungeon-700 text-amber-300 text-sm px-4 py-2.5 disabled:opacity-60 min-h-[44px]"
            >
              <Send className="w-4 h-4" />
              {sent ? 'Añadido al inventario' : 'Añadir todo al inventario'}
            </button>
            {sent && (
              <button
                onClick={onGoToInventory}
                className="btn text-amber-400 hover:underline"
              >
                Ver en el inventario →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
