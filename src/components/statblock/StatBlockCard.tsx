'use client';

import React from 'react';
import { MonsterStats, MonsterTraitAction } from '@/types';
import { formatMod } from '@/lib/combat';
import { Shield, Heart, Zap } from 'lucide-react';

export interface StatBlockCardData {
  name: string;
  size?: string;
  type?: string;
  alignment?: string;
  cr?: string;
  ac: number;
  hp_max: number;
  speed: string;
  stats: MonsterStats;
  traits: MonsterTraitAction[];
  actions: MonsterTraitAction[];
  legendary?: MonsterTraitAction[];
}

interface StatBlockCardProps {
  data: StatBlockCardData;
  /** Marca la tarjeta como previsualización en vivo (etiqueta superior). */
  preview?: boolean;
  /** Cuántas acciones mostrar antes de recortar (la preview muestra todas). */
  maxActions?: number;
}

/**
 * Ficha de estadísticas al estilo 5e: misma estética que las tarjetas del
 * bestiario, reutilizada como vista previa en vivo en los formularios.
 */
export const StatBlockCard: React.FC<StatBlockCardProps> = ({
  data,
  preview = false,
  maxActions = 6,
}) => {
  const subtitle = [data.size, data.type, data.alignment].filter(Boolean).join(' ');
  const shownActions = data.actions.slice(0, maxActions);

  return (
    <div className="bg-dungeon-950 border border-amber-500/30 rounded-xl p-4 shadow-inner space-y-3">
      {preview && (
        <span className="inline-block text-micro font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-2 py-0.5">
          Vista previa
        </span>
      )}

      <div className="border-b border-dungeon-800 pb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-base font-bold text-amber-400 font-serif truncate">
            {data.name || 'Sin nombre'}
          </h4>
          {subtitle && <p className="text-micro text-slate-400 italic">{subtitle}</p>}
        </div>
        {data.cr !== undefined && (
          <span className="bg-red-950 text-red-300 border border-red-800 font-bold text-micro px-2 py-0.5 rounded shrink-0">
            CR {data.cr}
          </span>
        )}
      </div>

      <div className="card grid grid-cols-3 gap-2 text-center p-2">
        <div>
          <span className="text-micro text-slate-500 uppercase font-semibold block">CA</span>
          <span className="text-sm font-bold text-slate-200 flex items-center justify-center gap-1">
            <Shield className="w-3.5 h-3.5 text-amber-400" /> {data.ac || '—'}
          </span>
        </div>
        <div>
          <span className="text-micro text-slate-500 uppercase font-semibold block">PV</span>
          <span className="text-sm font-bold text-red-400 flex items-center justify-center gap-1">
            <Heart className="w-3.5 h-3.5" /> {data.hp_max || '—'}
          </span>
        </div>
        <div>
          <span className="text-micro text-slate-500 uppercase font-semibold block">Vel.</span>
          <span className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1">
            <Zap className="w-3.5 h-3.5 text-blue-400" /> {data.speed || '—'}
          </span>
        </div>
      </div>

      <div className="card grid grid-cols-6 gap-1 text-center p-2">
        {Object.entries(data.stats).map(([key, val]) => (
          <div key={key}>
            <span className="text-[9px] uppercase font-bold text-amber-400">{key}</span>
            <p className="text-xs font-bold text-slate-200">{val}</p>
            <span className="text-micro text-slate-400">{formatMod(val)}</span>
          </div>
        ))}
      </div>

      {data.traits.length > 0 && (
        <div className="space-y-1.5 text-xs">
          <h4 className="font-bold text-amber-400 uppercase tracking-wider text-micro border-b border-dungeon-800 pb-1">
            Rasgos
          </h4>
          {data.traits.map((trait, idx) => (
            <p key={idx} className="leading-snug text-slate-300">
              <span className="font-bold text-slate-100 italic">{trait.name}. </span>
              <span className="text-slate-400">{trait.desc}</span>
            </p>
          ))}
        </div>
      )}

      <div className="space-y-1.5 text-xs">
        <h4 className="font-bold text-amber-400 uppercase tracking-wider text-micro border-b border-dungeon-800 pb-1">
          Acciones
        </h4>
        {shownActions.length > 0 ? (
          shownActions.map((act, idx) => (
            <p key={idx} className="leading-snug text-slate-300">
              <span className="font-bold text-slate-100 italic">{act.name}. </span>
              <span className="text-slate-400">{act.desc}</span>
            </p>
          ))
        ) : (
          <p className="text-slate-500 italic">Sin acciones todavía.</p>
        )}
        {data.actions.length > shownActions.length && (
          <p className="text-slate-500 italic">
            +{data.actions.length - shownActions.length} acciones más…
          </p>
        )}
      </div>

      {(data.legendary?.length ?? 0) > 0 && (
        <div className="space-y-1.5 text-xs">
          <h4 className="font-bold text-purple-400 uppercase tracking-wider text-micro border-b border-dungeon-800 pb-1">
            Acciones legendarias
          </h4>
          {data.legendary!.map((act, idx) => (
            <p key={idx} className="leading-snug text-slate-300">
              <span className="font-bold text-slate-100 italic">{act.name}. </span>
              <span className="text-slate-400">{act.desc}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatBlockCard;
