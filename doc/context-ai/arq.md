# Arquitectura — La Biblioteca de Gaby

App personal de catálogo y registro de lectura de libros (PWA), con un backend Express sobre PostgreSQL (Neon).

## Stack
- **Frontend**: React 19 + Vite 6 + Tailwind CSS v4 (`@tailwindcss/vite`), `motion`, `lucide-react`.
- **PWA**: `vite-plugin-pwa` (autoUpdate, workbox, cache de Google Fonts).
- **Backend**: Express 4. App en `server/app.ts` (sin `listen`), DB en `server/db.ts`. En dev corre con `tsx`.
- **DB**: PostgreSQL en Neon vía `pg` (Pool, SSL). Tabla única `libros`.
- **CSV**: `papaparse` (en cliente y en servidor).
- **Runtime**: Node `22.14.0` (`.nvmrc`). TypeScript ~5.8.
- **Hosting**: Vercel (free), NeonDB (free). Desarrollo inicial en Google AI Studio.

## Mapa de carpetas
```
server/app.ts          App Express + rutas (router montado en /api y /)
server/db.ts           Pool pg, helpers (safeDate, safeStars, mapRowToBook), seed, ensureDatabase
server.ts              Servidor standalone: (dev) middleware de Vite / (prod) estáticos + listen
server-entry.ts        Handler de Vercel; esbuild lo empaqueta en api/index.js
api/index.js           GENERADO por `npm run build`, se commitea (Vercel lo necesita)
src/
  App.tsx              Estado global, handlers CRUD, filtros, paginación (PAGE_SIZE=12)
  types.ts             Book, TabType, TextSizeMode, BookStats
  services/api.ts      Cliente fetch de /api/*
  utils/csvHelper.ts   Parseo/exportación CSV en el cliente
  components/          Modales, tarjetas, filtros, header, tabs, stats
  hooks/               useOnlineStatus, usePWAInstall
scripts/
  import_books.ts      `npm run db:import`: carga CSV a la DB (transaccional)
  generate_pwa_icons.ts Genera PNG de iconos desde SVG con sharp
public/                Iconos PWA. `libros_iniciales.csv` vive aquí pero está gitignored
data/                  CSV locales (gitignored). Default de db:import: data/books.csv
```

## Flujo de datos
1. `App.tsx` llama `fetchBooks()` → `GET /api/books` → `SELECT * FROM libros ORDER BY created_at DESC`.
2. El servidor mapea filas snake_case → `Book` camelCase (`mapRowToBook`).
3. El cliente guarda copia en `localStorage` (`mis_libros_lectura_v1`); si la API falla, carga desde ahí y marca `dbConnected=false`.
4. Escrituras: update optimista en el estado → `POST/PUT/DELETE /api/books[/:id]`.
5. Import CSV: el cliente parsea (`parseCSVToBooks`) → `POST /api/books/batch` (`replace`|`merge`) → recarga lista.
6. En la primera request a la API (`ensureDatabase`, una vez por proceso/cold start): `CREATE TABLE IF NOT EXISTS libros` y, si está vacía, seed desde `public/libros_iniciales.csv`.

### Endpoints
`GET /api/health` · `GET /api/books` · `POST /api/books` · `PUT /api/books/:id` · `DELETE /api/books/:id` · `POST /api/books/batch` · `POST /api/books/seed`

## Qué NO existe
- Autenticación / autorización: la API está abierta (incluye borrar todo vía `seed` o `batch replace`).
- Tests de ningún tipo, ni linter/formatter (solo `npm run lint` = `tsc --noEmit`).
- Migraciones. El schema de `libros` está deducido del código en `ensureDatabase` (`server/db.ts`); `schema.sql` real está en `.gitignore`.
- Router en el cliente (una sola vista con tabs y modales).
- Librería de estado (todo es `useState` en `App.tsx`).
- Integración real con Gemini: `GEMINI_API_KEY` aparece en `.env.example`/README pero no se usa en el código.
- `@neondatabase/serverless`: lo menciona el README, pero el código usa `pg`.
- CI/CD propio (no hay `.github/`). [PENDIENTE: confirmar si Vercel despliega por push]
