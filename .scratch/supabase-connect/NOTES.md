# Conexión a Supabase — verificación (2026-10-20)

Proyecto: `qpnvdantkcudqdecqggr` (dmtool / DM Companion)

## Credenciales
- API: `NEXT_PUBLIC_SUPABASE_URL=https://qpnvdantkcudqdecqggr.supabase.co` + clave
  publishable `sb_publishable_…` — ya estaban en `.env.local` (sin cambios).
- Postgres directo (5432): usuario `postgres`, contraseña nueva `xexoanaL1_q`
  (la antigua `xexoanaL1` fue rechazada: 28P01). TLS con
  `ssl: { rejectUnauthorized: false }` (cadena autofirmada de Supabase).
  La URI vive en `.env.local` como `SUPABASE_DB_URL` (archivo gitignored); los
  scripts la leen vía `conn.mjs` y no contienen credenciales.

## Estado del esquema remoto
- 8 tablas en `public` (campaigns, monsters, spells, npcs, items, encounters,
  initiative_combatants, dm_notes): creadas, RLS ENABLE+FORCE, 32 policies
  (4 por tabla), funciones y triggers de schema.sql aplicados.
- Grants: `anon` sin acceso; `authenticated`/`service_role` con CRUD.
- Datos seed presentes (1 campaña, 2 monstruos, 2 objetos, 2 hechizos,
  1 encuentro, 1 usuario en auth.users).
- Bucket `uploads` de Storage: APLICADO el 2026-10-20 desde
  `supabase/schema.sql` (sección STORAGE) — privado, 1 MB,
  mime jpeg/png/webp/gif + policies uploads_*_own.

## Verificación end-to-end (usuario de prueba temporal, ya eliminado)
- signup → password grant (email confirmado vía SQL) → sesión OK.
- `POST /storage/v1/object/uploads/<uid>/_test/conexion.png` → 200.
- `GET` del objeto como dueño → 200. `DELETE` como dueño → 200.
- Upload con `text/plain` → 415 invalid_mime_type (la lista blanca funciona).
- El usuario de prueba y su objeto se borraron; `auth.users` volvió a 1.

## Curiosidad (no bloqueante)
`GET /storage/v1/bucket/uploads` (ruta de metadatos) devuelve 404
"Bucket not found" con clave anon e incluso con sesión de usuario, porque
`storage.buckets` tiene RLS activo y sin policies para esos roles. La app no
usa esa ruta (solo hace `storage.from(BUCKET).upload(...)`), y las rutas de
objetos resuelven el bucket correctamente.

## Scripts
- `conn.mjs` — carga `.env.local` y exporta `DB_URL` (sin secretos en scripts).
- `check-api.mjs` — probes REST (auth/health, rest, storage).
- `check-db.mjs` — inventario completo del esquema remoto vía `pg`.
- `apply-storage.mjs` — aplica la sección STORAGE de schema.sql (idempotente).
- `test-final.mjs` — prueba end-to-end de upload/download/delete autenticado.
