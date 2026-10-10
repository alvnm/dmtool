# DM Companion 🎲

Aplicación web para Dungeon Masters: panel global con acceso rápido a Rastreador de Iniciativa, Inventario y Tesoro, Compendio de Monstruos, Gestor de NPCs y Grimorio de Hechizos de D&D 5e.

## Stack

- **Next.js 14** (App Router) + **React 18**
- **Tailwind CSS 3**
- **Supabase** (opcional: sincronización en la nube; sin configurar funciona en modo local con datos demo)

## Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Conectar Supabase (opcional)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ejecuta el contenido de `supabase/schema.sql` en el SQL Editor de tu proyecto.
3. Copia `.env.local.example` a `.env.local` y completa:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU-ANON-KEY
```

Sin estas variables, la app arranca en **Modo Local (Demo)** con datos de ejemplo en memoria.

## Despliegue en Vercel

1. Sube este repositorio a GitHub.
2. En [vercel.com](https://vercel.com), importa el repositorio (Vercel detecta Next.js automáticamente).
3. Configura las variables de entorno (opcional, para Supabase):

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon/public de Supabase |

4. Despliega. Cada `git push` a `main` genera un nuevo despliegue de producción.

## Estructura

```
src/
├── app/            # Layout y página principal (App Router)
├── components/     # UI por módulo (dashboard, iniciativa, inventario, monstruos, NPCs, hechizos)
├── lib/            # Cliente de Supabase y datos de ejemplo
└── types/          # Tipos de dominio (D&D 5e)
supabase/schema.sql # Esquema de base de datos con RLS y datos seed
```
