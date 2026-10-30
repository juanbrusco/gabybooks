# Workflow

## Setup local
1. Node `22.14.0` (`nvm use`).
2. `npm install`.
3. Crear `.env` con `DATABASE_URL` (Neon). `dotenv` lee `.env` (el README dice `.env.local`: no coincide).
4. `npm run dev` → `http://localhost:3000` (Express + Vite en middleware, mismo puerto).
5. (Opcional) Cargar datos: `npm run db:import [ruta.csv]` (default `data/books.csv`, **reemplaza** toda la tabla).

## Hacer un cambio
1. Crear rama desde `main`. [PENDIENTE: política de ramas/PR; hoy se commitea directo a `main`]
2. Cambios de UI → `src/components/` + handlers en `src/App.tsx`.
3. Cambios de API → `server/app.ts` (rutas) / `server/db.ts` + cliente en `src/services/api.ts`. Luego `npm run build` y commitear `api/index.js`.
4. Cambios de modelo → actualizar en conjunto: `src/types.ts`, `mapRowToBook`/schema en `server/db.ts`, SQL en `server/app.ts`, `csvHelper.ts`, `scripts/import_books.ts` y la tabla en Neon (sin migraciones: `CREATE TABLE IF NOT EXISTS` no altera tablas existentes).
5. Cambios en reglas de parseo CSV/fechas → hay lógica duplicada en 3 lugares (ver `known-errors.md`).

## Checklist de "terminado"
- [ ] `npm run lint` (`tsc --noEmit`) sin errores.
- [ ] `npm run build` OK y `api/index.js` regenerado y commiteado.
- [ ] Probado a mano en `npm run dev`: listar, crear, editar, borrar, toggles leído/Kindle, import/export CSV.
- [ ] Probado en mobile/PWA si toca UI (app pensada para uso en celular, `portrait-primary`).
- [ ] Textos nuevos en español y respetando los 3 tamaños de texto.
- [ ] No se commitean `.env*`, `data/`, `public/libros_iniciales.csv`.
- [ ] [PENDIENTE: tests automáticos — no existen]

## Deploy
- **Vercel** (`vercel.json`): `npm run build` → `dist/` estático + `api/index.js`; `/api/*` → función `api/index`; resto → `index.html` (los archivos estáticos como `sw.js` o el manifest tienen prioridad sobre el rewrite).
- Variables en Vercel: `DATABASE_URL`. [PENDIENTE: confirmar otras variables]
- Disparador: [PENDIENTE: ¿deploy automático por push a `main`?]
- Alternativa contenedor: `npm run build` + `NODE_ENV=production npm start` (sirve `dist/` + API en puerto 3000).
- Iconos PWA: si cambian los SVG, `npx tsx scripts/generate_pwa_icons.ts` (no hay script npm).
