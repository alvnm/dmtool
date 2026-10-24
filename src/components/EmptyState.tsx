'use client';

import React from 'react';

/**
 * Estado vacío compartido: icono, título, descripción y una única acción.
 * Sirve tanto para "aún no hay nada" como para "tu filtro no dio resultados".
 */
export const EmptyState: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="text-center py-16 bg-dungeon-900/50 border border-dashed border-dungeon-800 rounded-xl">
    <Icon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
    <h3 className="text-lg font-semibold text-slate-300">{title}</h3>
    <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{description}</p>
    {actionLabel && onAction && (
      <button type="button" onClick={onAction} className="btn btn-primary mt-4 text-sm">
        {actionLabel}
      </button>
    )}
  </div>
);
