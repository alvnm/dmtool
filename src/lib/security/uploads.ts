/**
 * Restricciones de carga de archivos.
 *
 * No existe subida de archivos en la app; este módulo (y la ruta /api/uploads)
 * fija las únicas condiciones en las que se aceptaría un archivo: tipo en
 * lista blanca validado por firma binaria, tamaño máximo y nombre aleatorio.
 */

export const MAX_UPLOAD_BYTES = 1_000_000; // 1 MB

export const ALLOWED_UPLOAD_TYPES: Record<string, { ext: string; magic: number[][] }> = {
  'image/jpeg': { ext: 'jpg', magic: [[0xff, 0xd8, 0xff]] },
  'image/png': { ext: 'png', magic: [[0x89, 0x50, 0x4e, 0x47]] },
  'image/webp': { ext: 'webp', magic: [[0x52, 0x49, 0x46, 0x46]] },
  'image/gif': { ext: 'gif', magic: [[0x47, 0x49, 0x46, 0x38]] },
};

export type UploadCheck =
  | { ok: true; ext: string; safeName: string }
  | { ok: false; reason: string };

function matchesMagic(bytes: Uint8Array, signatures: number[][]): boolean {
  return signatures.some((sig) => sig.every((b, i) => bytes[i] === b));
}

/** Valida tipo (por firma binaria), tamaño y genera un nombre aleatorio. */
export function checkUpload(params: {
  declaredType: string;
  filename: string;
  size: number;
  bytes: Uint8Array;
}): UploadCheck {
  const { declaredType, filename, size, bytes } = params;

  if (size <= 0 || size > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: `El archivo debe pesar entre 1 byte y ${MAX_UPLOAD_BYTES} bytes.` };
  }

  const allowed = ALLOWED_UPLOAD_TYPES[declaredType];
  if (!allowed) {
    return { ok: false, reason: `Tipo no permitido: ${declaredType || 'desconocido'}.` };
  }

  // La extensión declarada tampoco puede escapar del directorio destino.
  if (/[\\/]|^\.+$/.test(filename)) {
    return { ok: false, reason: 'Nombre de archivo inválido.' };
  }
  if (!matchesMagic(bytes, allowed.magic)) {
    return { ok: false, reason: 'El contenido del archivo no coincide con el tipo declarado.' };
  }

  const random = crypto.randomUUID().replace(/-/g, '');
  return { ok: true, ext: allowed.ext, safeName: `${random}.${allowed.ext}` };
}
