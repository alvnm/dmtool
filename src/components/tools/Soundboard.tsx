'use client';

import React, { useEffect, useState } from 'react';
import { SOUND_LIBRARY, SoundHandle, playSound, stopAllSounds } from '@/lib/sounds';
import { Square } from 'lucide-react';

/**
 * Soundboard del DM: botones de efectos sintetizados (WebAudio, sin archivos).
 * Los bucles se comportan como interruptores; el panel se detiene al cerrarse.
 */
export const Soundboard: React.FC = () => {
  const [handles, setHandles] = useState<Record<string, SoundHandle | null>>({});

  // Al desmontar (cierre del panel) no queda nada sonando.
  useEffect(() => {
    return () => {
      stopAllSounds();
    };
  }, []);

  const anyActive = Object.values(handles).some(Boolean);

  const toggle = (id: string) => {
    const def = SOUND_LIBRARY.find(s => s.id === id);
    if (!def) return;

    if (handles[id]) {
      handles[id]?.stop();
      setHandles(prev => ({ ...prev, [id]: null }));
      return;
    }

    const handle = playSound(id);
    setHandles(prev => ({ ...prev, [id]: handle }));

    // Los efectos de un solo disparo se apagan solos: limpia el estado.
    if (!def.loop && handle) {
      setTimeout(() => {
        setHandles(prev => (prev[id] === handle ? { ...prev, [id]: null } : prev));
      }, 4000);
    }
  };

  const stopAll = () => {
    stopAllSounds();
    setHandles({});
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-micro text-slate-400">
          Efectos sintetizados al vuelo: sin archivos y funcionan offline.
        </p>
        <button
          type="button"
          onClick={stopAll}
          disabled={!anyActive}
          className="btn flex items-center gap-1.5 text-micro px-2.5 py-1.5 border border-red-800 text-red-300 bg-red-950/50 hover:bg-red-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Square className="w-3 h-3" />
          Detener todo
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {SOUND_LIBRARY.map(sound => {
          const active = Boolean(handles[sound.id]);
          return (
            <button
              key={sound.id}
              type="button"
              onClick={() => toggle(sound.id)}
              aria-pressed={active}
              aria-label={`${active ? 'Detener' : 'Reproducir'} ${sound.label}`}
              title={sound.loop ? `${sound.label} (bucle)` : sound.label}
              className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border text-micro font-semibold transition ${
                active
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-inner'
                  : 'bg-dungeon-950 border-dungeon-800 text-slate-300 hover:border-amber-500/40 hover:text-amber-300'
              }`}
            >
              <span className="text-lg leading-none">{sound.icon}</span>
              {sound.label}
              {sound.loop && (
                <span className={`text-[9px] ${active ? 'text-amber-400' : 'text-slate-500'}`}>
                  {active ? 'sonando…' : 'bucle'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Soundboard;
