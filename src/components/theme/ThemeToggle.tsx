'use client';

import React, { useEffect, useState } from 'react';
import { Moon, ScrollText } from 'lucide-react';

export type ThemeName = 'dungeon' | 'parchment';

export const THEME_STORAGE_KEY = 'dm-theme';

/** Aplica el tema al documento y lo recuerda en localStorage. */
export function applyTheme(theme: ThemeName): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage puede no estar disponible (modo privado); el tema sigue activo.
  }
}

export function readStoredTheme(): ThemeName {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'parchment' ? 'parchment' : 'dungeon';
  } catch {
    return 'dungeon';
  }
}

/**
 * Botón de cambio de tema (Dungeon oscuro <-> Pergamino antiguo).
 * El valor inicial lo escribe un script bloqueante en el layout, así que aquí
 * sólo se sincroniza el estado visual para evitar parpadeos (hydration).
 */
export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<ThemeName>('dungeon');

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as ThemeName) || readStoredTheme();
    setTheme(current === 'parchment' ? 'parchment' : 'dungeon');
  }, []);

  const toggle = () => {
    const next: ThemeName = theme === 'dungeon' ? 'parchment' : 'dungeon';
    applyTheme(next);
    setTheme(next);
  };

  const isParchment = theme === 'parchment';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isParchment}
      aria-label={isParchment ? 'Cambiar al tema Dungeon (oscuro)' : 'Cambiar al tema Pergamino'}
      title={isParchment ? 'Tema Pergamino activo' : 'Tema Dungeon activo'}
      className="flex items-center gap-1.5 text-xs bg-dungeon-800 text-slate-300 border border-dungeon-700 hover:text-slate-100 hover:bg-dungeon-700 px-3 py-1 rounded-full font-medium transition"
    >
      {isParchment ? (
        <Moon className="w-3.5 h-3.5 text-amber-400" />
      ) : (
        <ScrollText className="w-3.5 h-3.5 text-amber-400" />
      )}
      <span className="hidden sm:inline">{isParchment ? 'Pergamino' : 'Dungeon'}</span>
    </button>
  );
};
