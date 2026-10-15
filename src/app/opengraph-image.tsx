import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'DM Companion — Asistente de Dungeon Master para D&D 5e';

const TITLE = 'DM Companion';
const SUBTITLE = 'Asistente de Dungeon Master para D&D 5e';
const FEATURES = ['Iniciativa', 'Inventario', 'Bestiario SRD', 'NPCs', 'Grimorio', 'Dados'];

async function loadFonts() {
  const dir = join(process.cwd(), 'src/app/fonts');
  const [cinzel, inter, interBold] = await Promise.all([
    readFile(join(dir, 'Cinzel-Bold.ttf')),
    readFile(join(dir, 'Inter-Regular.ttf')),
    readFile(join(dir, 'Inter-Bold.ttf')),
  ]);
  return [
    { name: 'Cinzel', data: cinzel, weight: 700 as const, style: 'normal' as const },
    { name: 'Inter', data: inter, weight: 400 as const, style: 'normal' as const },
    { name: 'Inter', data: interBold, weight: 700 as const, style: 'normal' as const },
  ];
}

export default async function OpengraphImage() {
  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          backgroundColor: '#0b0c10',
          backgroundImage:
            'radial-gradient(circle at 82% 18%, rgba(245,158,11,0.20), transparent 55%), radial-gradient(circle at 10% 90%, rgba(217,119,6,0.16), transparent 50%)',
          color: '#f1f5f9',
          fontFamily: 'Inter',
        }}
      >
        {/* Marca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 22,
              background: 'linear-gradient(135deg, #f59e0b, #b45309)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0b0c10',
              fontSize: 44,
              fontWeight: 700,
              fontFamily: 'Cinzel',
            }}
          >
            d20
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 62,
                fontWeight: 700,
                fontFamily: 'Cinzel',
                color: '#fbbf24',
                letterSpacing: 1,
              }}
            >
              {TITLE}
            </div>
            <div style={{ fontSize: 26, color: '#cbd5e1', marginTop: 4 }}>{SUBTITLE}</div>
          </div>
        </div>

        {/* Módulos */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {FEATURES.map(f => (
            <div
              key={f}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 20px',
                borderRadius: 999,
                backgroundColor: 'rgba(245,158,11,0.12)',
                border: '2px solid rgba(245,158,11,0.45)',
                color: '#fcd34d',
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {f}
            </div>
          ))}
        </div>

        {/* Pie */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 24, color: '#94a3b8' }}>
            Combate, notas y tesoro guardados en tu dispositivo · Funciona offline
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#f59e0b',
              borderBottom: '3px solid rgba(245,158,11,0.5)',
              paddingBottom: 4,
            }}
          >
            Instálalo en tu tablet de DM
          </div>
        </div>
      </div>
    ),
    { fonts, ...size }
  );
}
