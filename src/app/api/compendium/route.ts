/**
 * /api/compendium — sirve el bestiario y el grimorio SRD generados por
 * `node scripts/build-compendium.mjs` (ficheros de data/compendium/).
 *
 *  - Lista blanca de tipos: el cliente solo puede elegir "monsters" | "spells"
 *    (nunca una ruta), así no hay inyección de path.
 *  - Lectura cacheada en memoria invalidada por mtime (regenerar el compendio
 *    se refleja sin reiniciar el servidor).
 *  - Datos públicos del SRD (OGL), sin datos de usuario: no necesita sesión.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';

const FILES: Record<string, string> = {
  monsters: 'monsters.app.json',
  spells: 'spells.app.json',
};

type Entry = { mtimeMs: number; data: unknown[] };
const cache = new Map<string, Entry>();

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get('kind') ?? 'monsters';
  const file = FILES[kind];
  if (!file) {
    return NextResponse.json(
      { error: 'Parámetro "kind" inválido. Usa "monsters" o "spells".' },
      { status: 400 }
    );
  }

  const fullPath = path.join(process.cwd(), 'data', 'compendium', file);
  try {
    const stat = await fs.stat(fullPath);
    let entry = cache.get(kind);
    if (!entry || entry.mtimeMs !== stat.mtimeMs) {
      const parsed: unknown = JSON.parse(await fs.readFile(fullPath, 'utf8'));
      if (!Array.isArray(parsed)) throw new Error('Formato inesperado en ' + file);
      entry = { mtimeMs: stat.mtimeMs, data: parsed };
      cache.set(kind, entry);
    }
    const res = NextResponse.json({ kind, count: entry.data.length, data: entry.data });
    res.headers.set('Cache-Control', 'public, max-age=300');
    return res;
  } catch {
    return NextResponse.json(
      { error: 'Compendio no disponible. Ejecuta `node scripts/build-compendium.mjs`.' },
      { status: 404 }
    );
  }
}
