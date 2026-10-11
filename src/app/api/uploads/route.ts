/**
 * /api/uploads — Única ruta que admite archivos y con lista blanca estricta:
 *  - Solo imágenes (jpeg/png/webp/gif) validadas por firma binaria.
 *  - Máximo 1 MB; nombre aleatorio (sin ruta ni extensión del cliente).
 *  - Se guardan en Supabase Storage bajo el UID del usuario autenticado.
 * El middleware bloquea multipart/form-data en cualquier otra ruta.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient, serverSupabaseConfigured } from '@/lib/supabase/server';
import { MAX_UPLOAD_BYTES, checkUpload } from '@/lib/security/uploads';

export const runtime = 'nodejs';

const BUCKET = 'uploads';

export async function POST(req: NextRequest) {
  if (!serverSupabaseConfigured()) {
    return NextResponse.json({ error: 'Base de datos no configurada.' }, { status: 503 });
  }

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'Se esperaba multipart/form-data.' }, { status: 415 });
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Formulario inválido.' }, { status: 400 });

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Falta el archivo "file".' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: `El archivo supera el máximo de ${MAX_UPLOAD_BYTES} bytes.` }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkUpload({
    declaredType: file.type,
    filename: file.name,
    size: file.size,
    bytes,
  });
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 415 });
  }

  const path = `${user.id}/${check.safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false, // nunca sobrescribir (evita colisión con nombres adivinados)
  });

  if (error) {
    return NextResponse.json(
      { error: `No se pudo guardar en el bucket "${BUCKET}". ¿Existe y es privado?` },
      { status: 503 }
    );
  }

  const res = NextResponse.json({ ok: true, path }, { status: 201 });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
