import type { Metadata } from 'next';
import PlayerCombatView from '@/components/combat/PlayerCombatView';

/**
 * Vista pública de combate para jugadores.
 *
 * Ruta permitida en `middleware.ts` (los jugadores no tienen sesión Supabase);
 * llegan por un enlace compartido del DM con un token de canal Broadcast en
 * `?s=`. Todo el estado se recibe por Realtime en el navegador.
 */
export const metadata: Metadata = {
  title: 'Combate en vivo',
  description:
    'Vista en tiempo real del combate de D&D 5e compartida por el Dungeon Master: iniciativa, turno actual, condiciones y puntos de vida.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Combate en vivo | DM Companion',
    description:
      'Sigue la iniciativa, el turno y las condiciones del combate en tiempo real desde tu móvil.',
    type: 'website',
  },
};

export default function CombatPage() {
  return <PlayerCombatView />;
}
