# LetsWork Alpha

> Gestor de proyectos y tareas para equipos — estética *tinta electrónica* / minimal pro.
> Construido sobre Next.js 15, Drizzle/PostgreSQL y un sistema de tiempo real con **SSE + Postgres LISTEN/NOTIFY**.

## Características

- **Espacios · Proyectos · Tareas** (CRUD completo, multiusuario, roles)
- **Tablero Kanban arrastrable** (dnd-kit, 5 columnas, reordenamiento)
- **Vista Lista** paginada y **vista Calendario** mensual
- **Command palette** global (⌘K) con búsqueda de espacios, proyectos y tareas
- **Drawer de detalle** de tarea con edición inline, etiquetas, asignación y **comentarios**
- **Etiquetas** (labels) por workspace
- **Filtros** por proyecto, asignado, texto
- **27 presets cromáticos** en 5 categorías, modo **Dual-Ink**, modo **Compacto** — todo con transiciones 0ms (estética e-ink)
- **Real-time collaboration**:
  - Sincronización en vivo entre usuarios (otro cliente ve el cambio al instante)
  - **Presencia** (quién está en línea en cada espacio)
  - **Notificaciones in-app** con badge
  - **Activity log** por espacio
- **Autenticación** JWT en cookies httpOnly, hashing **scrypt** nativo (sin dependencias nativas)
- **Responsive**: sidebar colapsable en desktop, drawer móvil

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, Server Actions) |
| UI | React 19, Tailwind CSS 3, lucide-react, cmdk, sonner |
| DnD | @dnd-kit |
| ORM | Drizzle ORM (drizzle-orm) |
| DB local | **PGlite** (PostgreSQL embebido en WASM, sin servidor) |
| DB prod | **PostgreSQL** (node-postgres, sin compilación nativa) |
| Auth | `jose` (JWT) + `node:crypto` scrypt |
| Real-time | Server-Sent Events + Postgres `LISTEN`/`NOTIFY` |

> **PGlite en local, Postgres en prod.** Mismo schema, mismas migraciones SQL idempotentes. Cambia con una sola variable de entorno (`DATABASE_URL`). Sin compilación nativa en Alpine/musl.

## Empezar (local)

Requisitos: Node.js 20+.

```bash
npm install
npm run dev          # dev con HMR en http://localhost:3000
# o producción:
npm run build && npm run start
```

La primera vez crea automáticamente la base de datos local (`.pglite/`), corre las migraciones y siembra con:

- usuario: **`admin`** / **`admin123`**
- 3 espacios, 2 proyectos, tareas de ejemplo

## Variables de entorno

Copia `.env.example` a `.env` y ajusta:

```env
# Vacío = usa PGlite local. Para Postgres (Railway) pon la URL de Railway:
DATABASE_URL=postgresql://user:pass@host:port/db

JWT_SECRET=un-secreto-largo-y-aleatorio
NODE_ENV=development
```

## Deploy en Railway

El repo incluye `Dockerfile` y `railway.json` listos. En Railway:

1. Crea un nuevo proyecto desde el repo de GitHub
2. Añade el plugin **PostgreSQL** (Railway crea `DATABASE_URL` automáticamente)
3. Setea las variables: `JWT_SECRET` (obligatorio en prod)
4. Deploy. La app migra y siembra al arrancar.

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (HMR) |
| `npm run build` | Build de producción |
| `npm run start` | Inicia el servidor de producción |
| `npm run typecheck` | TypeScript sin emitir |
| `npm run db:generate` | Genera SQL desde el schema (Drizzle Kit) |
| `npm run db:migrate` | Aplica migraciones manualmente (PGlite/Postgres) |
| `./run.sh` | Inicia el servidor de producción con Node del PATH persistente |
| `./run-tunnel.sh` | Expone el puerto 3000 con `localtunnel` |
| `./publish.sh <user/repo>` | Prepara el primer commit para GitHub |

## Estructura

```
src/
├── app/
│   ├── (auth)/              login, register
│   ├── (dashboard)/         home + /r/[id] (workspace)
│   ├── api/
│   │   ├── realtime/        SSE (LISTEN/NOTIFY → cliente)
│   │   └── presence/        Heartbeat de presencia
│   ├── actions.ts           Server Actions (CRUD + actividad)
│   ├── data-actions.ts      Server Actions de lectura
│   ├── layout.tsx           Root layout (tema server-side)
│   └── globals.css          27 presets, tipografía dual, 0ms
├── components/              UI (sidebar, kanban, list, calendar, drawer, palette, bell…)
├── db/
│   ├── schema.ts            Drizzle schema (10 tablas)
│   └── migrations.ts        DDL idempotente
└── lib/
    ├── db.ts                PGlite/Postgres dual driver
    ├── realtime.ts          subscribe/notify (multiplexado)
    ├── presence.ts          Presencia en memoria
    ├── activity.ts          Activity log + notificaciones
    ├── auth.ts              JWT + getCurrentUser
    ├── password.ts          scrypt (sin deps nativas)
    ├── presets.ts           27 presets cromáticos
    ├── dither.ts            Bayer 4x4 dithering
    └── utils.ts
```

## Diseño

Lenguaje visual heredado y elevado: tipografía dual (Noto Sans editorial + JetBrains Mono técnica), layouts bento, barras de progreso textuales (`█░`), "números héroes / etiquetas susurros", transiciones 0ms, scrollbars de tinta, avatares monograma. Los 27 presets cubren 5 categorías (Dual-Ink, Sustratos clásicos, Orgánicos, Alto contraste, Nocturnos).

## Licencia

Privado / interno.
