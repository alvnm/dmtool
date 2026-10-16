/**
 * /api/notes — API de notas del DM con:
 *  - Autenticación obligatoria (cookie de sesión; RLS por campaña).
 *  - Validación de entradas y lista blanca de campos (anti-manipulación).
 *  - Cifrado AES-256-GCM del contenido en reposo.
 *  - Respuestas paginadas y limitadas.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient, serverSupabaseConfigured } from '@/lib/supabase/server';
import { decryptField, encryptField } from '@/lib/security/crypto';
import { escapeHtml } from '@/lib/security/sanitize';
import { invalid, isBool, isIntInRange, isPlainObject, isText, isUuid, pick } from '@/lib/security/validate';

export const runtime = 'nodejs';

const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;

const CATEGORIES = ['General', 'Lore', 'Misión', 'Sesión', 'Combate', 'NPCs'] as const;

async function requireUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(req: NextRequest) {
  if (!serverSupabaseConfigured()) {
    return NextResponse.json({ error: 'Base de datos no configurada.' }, { status: 503 });
  }
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const limitRaw = Number.parseInt(params.get('limit') ?? String(DEFAULT_PAGE_SIZE), 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
  const offsetRaw = Number.parseInt(params.get('offset') ?? '0', 10);
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

  const { data, error } = await supabase
    .from('dm_notes')
    .select('id, campaign_id, title, content, category, pinned, updated_at')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: 'Error al leer las notas.' }, { status: 500 });
  }

  const notes = (data ?? []).map((row) => ({
    ...row,
    content: decryptField(row.content ?? ''),
    // El HTML generado por usuarios se marca escapado en el servidor.
    title_html: escapeHtml(row.title),
  }));

  const res = NextResponse.json({ data: notes, count: notes.length, limit, offset });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export async function POST(req: NextRequest) {
  if (!serverSupabaseConfigured()) {
    return NextResponse.json({ error: 'Base de datos no configurada.' }, { status: 503 });
  }
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON inválido.' }, { status: 400 });
  }
  if (!isPlainObject(body)) return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 });

  const errors: string[] = [];
  if (!isUuid(body.campaign_id)) errors.push('campaign_id debe ser un UUID válido.');
  if (!isText(body.title, { min: 1, max: 200 })) errors.push('title debe tener entre 1 y 200 caracteres.');
  if (!isText(body.content, { max: 20000 })) errors.push('content supera el tamaño máximo.');
  if (body.category !== undefined && !(CATEGORIES as readonly string[]).includes(String(body.category))) {
    errors.push(`category debe ser uno de: ${CATEGORIES.join(', ')}.`);
  }
  if (body.pinned !== undefined && !isBool(body.pinned)) errors.push('pinned debe ser booleano.');
  if (errors.length) return NextResponse.json(invalid(errors), { status: 400 });

  // Lista blanca: id, created_at, campaign_id fijos y updated_at los pone el trigger.
  const payload = pick(body as Record<string, unknown>, ['campaign_id', 'title', 'content', 'category', 'pinned']);
  payload.content = encryptField(String(payload.content ?? ''));

  const { data, error } = await supabase
    .from('dm_notes')
    .insert(payload as never)
    .select('id, campaign_id, title, category, pinned, updated_at')
    .single();

  if (error) {
    // RLS devuelve filas vacías/errores sin filtrar datos ajenos.
    return NextResponse.json({ error: 'No se pudo crear la nota (¿campaña ajena?).' }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true, data }, { status: 201 });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
