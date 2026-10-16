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

export const STORAGE_ERROR_EVENT = 'dm-companion:storage-error';

export function writeStorage(key: string, value: unknown): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (err) {
    // Cuota excedida o almacenamiento bloqueado: emitimos un evento para advertir al DM
    if (typeof window !== 'undefined' && 'dispatchEvent' in window) {
      window.dispatchEvent(
        new CustomEvent(STORAGE_ERROR_EVENT, {
          detail: {
            key,
            message: 'No se pudo guardar en almacenamiento local (posible cuota excedida o modo privado). Se recomienda descargar un respaldo JSON de la campaña.',
          },
        })
      );
    }
    return false;
  }
}

/** Borra una entrada persistida (si existe). */
export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Almacenamiento bloqueado: no hay nada que limpiar.
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
