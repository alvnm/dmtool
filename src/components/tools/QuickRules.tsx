'use client';

import React, { useMemo, useState } from 'react';
import { RULE_CATEGORIES, RuleCategory, searchRules } from '@/lib/rules';
import { Search } from 'lucide-react';

type Filter = RuleCategory | 'Todas';

/**
 * Referencia rápida de reglas: búsqueda instantánea (sin acentos ni
 * mayúsculas) y filtro por categoría, para consultas en plena sesión.
 */
export const QuickRules: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Filter>('Todas');

  const results = useMemo(() => searchRules(query, category), [query, category]);
  const filters: Filter[] = ['Todas', ...RULE_CATEGORIES];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar regla: concentración, cobertura, agarrado…"
          aria-label="Buscar en la referencia de reglas"
          className="input pl-9 pr-3 py-2 text-xs"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {filters.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setCategory(f)}
            aria-pressed={category === f}
            className={`text-micro font-bold px-2 py-1 rounded-full border transition ${
              category === f
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-dungeon-950 border-dungeon-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
        {results.length > 0 ? (
          results.map(rule => (
            <div key={rule.id} className="bg-dungeon-950 border border-dungeon-800 rounded-lg p-2.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-amber-400">{rule.title}</span>
                <span className="text-[9px] uppercase font-bold text-slate-500">{rule.category}</span>
              </div>
              <p className="text-micro leading-relaxed text-slate-300">{rule.text}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500 italic text-center py-4">
            Sin resultados para “{query}”.
          </p>
        )}
      </div>
    </div>
  );
};

export default QuickRules;
