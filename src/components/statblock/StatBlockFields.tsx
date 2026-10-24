'use client';

import React, { useState } from 'react';
import { MonsterStats, MonsterTraitAction, StatBlock } from '@/types';
import { formatMod } from '@/lib/combat';
import { Plus, Trash2 } from 'lucide-react';

/** Bloque vacío con valores por defecto razonables para empezar a editar. */
export const defaultStatBlock = (): StatBlock => ({
  stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  ac: 12,
  hp_max: 20,
  speed: '30 ft.',
  cr: '1',
  traits: [],
  actions: [],
  legendary: [],
});

const STAT_KEYS: (keyof MonsterStats)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

/**
 * ¿Tiene pinta de bloque de estadísticas válido para importarlo desde JSON?
 * Solo exige lo irrenovable (atributos, CA y PV); velocidad y CR ausentes se
 * rellenan con valores por defecto en `normalizeStatBlock`, para que un fichero
 * escrito a mano a medias siga siendo importable.
 */
export function isStatBlock(value: unknown): value is StatBlock {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  const stats = v.stats as Record<string, unknown> | undefined;
  if (!stats || typeof stats !== 'object') return false;
  return (
    STAT_KEYS.every(k => typeof stats[k] === 'number') &&
    typeof v.ac === 'number' &&
    typeof v.hp_max === 'number'
  );
}

/** Normaliza datos externos (JSON importado) y rellena lo que falte. */
export function normalizeStatBlock(value: unknown): StatBlock {
  const raw = (value ?? {}) as Record<string, unknown>;
  const rawStats = (raw.stats ?? {}) as Record<string, unknown>;
  const list = (input: unknown): MonsterTraitAction[] =>
    Array.isArray(input)
      ? input
          .filter(
            (item): item is MonsterTraitAction =>
              !!item && typeof item === 'object' && typeof (item as MonsterTraitAction).name === 'string'
          )
          .map(item => ({ name: String(item.name), desc: String(item.desc ?? '') }))
      : [];
  return {
    stats: STAT_KEYS.reduce(
      (acc, key) => ({ ...acc, [key]: Number(rawStats[key]) || 10 }),
      {} as MonsterStats
    ),
    ac: Number(raw.ac) || 10,
    hp_max: Number(raw.hp_max) || 10,
    speed: typeof raw.speed === 'string' ? raw.speed : '30 ft.',
    cr: typeof raw.cr === 'string' ? raw.cr : '0',
    traits: list(raw.traits),
    actions: list(raw.actions),
    legendary: list(raw.legendary),
  };
}

interface ListEditorProps {
  title: string;
  nameLabel: string;
  descPlaceholder: string;
  items: MonsterTraitAction[];
  onChange: (items: MonsterTraitAction[]) => void;
}

/** Editor reutilizable de listas nombre + descripción (rasgos/acciones/legendarias). */
const ListEditor: React.FC<ListEditorProps> = ({
  title,
  nameLabel,
  descPlaceholder,
  items,
  onChange,
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleAdd = () => {
    if (!name.trim() || !desc.trim()) return;
    onChange([...items, { name: name.trim(), desc: desc.trim() }]);
    setName('');
    setDesc('');
  };

  return (
    <div className="bg-dungeon-950 p-3 rounded-lg border border-dungeon-800 space-y-2">
      <label className="block text-xs font-bold text-amber-400 uppercase">{title}</label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          type="text"
          placeholder={nameLabel}
          value={name}
          onChange={e => setName(e.target.value)}
          className="input bg-dungeon-900 text-xs"
        />
        <input
          type="text"
          placeholder={descPlaceholder}
          value={desc}
          onChange={e => setDesc(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          className="input bg-dungeon-900 text-xs md:col-span-2"
        />
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="btn bg-dungeon-800 text-amber-300 hover:bg-dungeon-700 px-3 py-1"
      >
        + Añadir
      </button>

      {items.length > 0 && (
        <div className="pt-2 space-y-1">
          {items.map((item, i) => (
            <div
              key={i}
              className="text-xs bg-dungeon-900 p-2 rounded border border-dungeon-800 text-slate-300 flex items-start justify-between gap-2"
            >
              <p className="leading-snug">
                <strong className="text-amber-400">{item.name}:</strong> {item.desc}
              </p>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                aria-label={`Quitar ${item.name}`}
                title={`Quitar ${item.name}`}
                className="btn text-slate-500 hover:text-red-400 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface StatBlockFieldsProps {
  value: StatBlock;
  onChange: (next: StatBlock) => void;
}

/** Formulario completo del bloque de estadísticas (controlado). */
export const StatBlockFields: React.FC<StatBlockFieldsProps> = ({ value, onChange }) => {
  const setStat = (key: keyof MonsterStats, v: number) =>
    onChange({ ...value, stats: { ...value.stats, [key]: v } });

  const numInput = (
    label: string,
    current: number,
    apply: (v: number) => void
  ) => (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        value={current}
        onChange={e => apply(Number(e.target.value))}
        className="input"
      />
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {numInput('Clase de Armadura (CA)', value.ac, v => onChange({ ...value, ac: v }))}
        {numInput('Puntos de Vida máx.', value.hp_max, v => onChange({ ...value, hp_max: v }))}
        <div>
          <label className="label">Velocidad</label>
          <input
            type="text"
            value={value.speed}
            onChange={e => onChange({ ...value, speed: e.target.value })}
            placeholder="30 ft."
            className="input"
          />
        </div>
        <div>
          <label className="label">Desafío (CR)</label>
          <input
            type="text"
            value={value.cr}
            onChange={e => onChange({ ...value, cr: e.target.value })}
            placeholder="1/2"
            className="input"
          />
        </div>
      </div>

      <div className="bg-dungeon-950 p-3 rounded-lg border border-dungeon-800">
        <label className="block text-xs font-bold text-amber-400 mb-2 uppercase">
          Atributos
        </label>
        <div className="grid grid-cols-6 gap-2">
          {STAT_KEYS.map(key => (
            <div key={key}>
              <span className="text-micro text-slate-400 block text-center uppercase">
                {key}
              </span>
              <input
                type="number"
                aria-label={`Atributo ${key.toUpperCase()}`}
                value={value.stats[key]}
                onChange={e => setStat(key, Number(e.target.value))}
                className="input bg-dungeon-900 text-center text-xs py-1"
              />
              <span className="text-micro text-slate-500 block text-center">
                {formatMod(value.stats[key])}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ListEditor
        title="Rasgos"
        nameLabel="Nombre (ej: Visión en la oscuridad)"
        descPlaceholder="Descripción del rasgo pasivo..."
        items={value.traits}
        onChange={traits => onChange({ ...value, traits })}
      />
      <ListEditor
        title="Acciones"
        nameLabel="Nombre acción (ej: Garra)"
        descPlaceholder="+5 al ataque, alcance 5 ft. Daño: 1d6+3..."
        items={value.actions}
        onChange={actions => onChange({ ...value, actions })}
      />
      <ListEditor
        title="Acciones legendarias (opcional)"
        nameLabel="Nombre (ej: Mordida)"
        descPlaceholder="Se usa 3/tirada leyenda. +7 al ataque..."
        items={value.legendary}
        onChange={legendary => onChange({ ...value, legendary })}
      />
    </div>
  );
};

export default StatBlockFields;
