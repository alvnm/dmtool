'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

const STORAGE_PREFIX = 'dm-companion:';

/** Lee una entrada de localStorage tolerando errores (modo privado, cuota llena...). */
export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    // Cuota excedida o almacenamiento bloqueado: la app sigue funcionando en memoria.
    return false;
  }
}

/**
 * useState con persistencia automática en localStorage.
 *
 * El estado arranca con el valor por defecto (para que el render del servidor y
 * el del cliente coincidan) y se rehidrata en el primer effect; cualquier cambio
 * posterior se guarda solo, de modo que un refresco accidental no pierde la
 * sesión del DM.
 */
export function usePersistentState<T>(
  key: string,
  initial: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  // 1) Recuperar lo guardado al montar (sólo en el navegador).
  useEffect(() => {
    const stored = readStorage<T | null>(key, null);
    if (stored !== null && stored !== undefined) setValue(stored);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 2) Guardar cada cambio (nunca antes de haber leído lo almacenado).
  useEffect(() => {
    if (!hydrated) return;
    writeStorage(key, value);
  }, [hydrated, key, value]);

  return [value, setValue];
}
