# AGENTS.md — La Biblioteca de Gaby

Punto de entrada para agentes de IA y devs. Resume lo esencial y apunta a los documentos de detalle en `doc/context-ai/`.

## 1. Qué es
PWA personal de catálogo y registro de lectura de libros ("BiblioGaby"). Una sola entidad (`Book`, tabla `libros`), CRUD + import/export CSV, filtros, estadísticas, TTS y dictado por voz. UI y dominio en español.

**Stack**: React 19 + Vite 6 + Tailwind v4 + `vite-plugin-pwa` · Express 4 · PostgreSQL en Neon vía `pg` · Vercel (free) · Node 22.14.0.

## 2. Documentos de contexto — cuándo leer cada uno
| Archivo | Leer cuando… |
|---|---|
| [doc/context-ai/arq.md](doc/context-ai/arq.md) | Necesitás ubicar código, entender el flujo cliente → API → DB, los endpoints o qué **no** existe (auth, tests, migraciones). Leer primero en cualquier tarea nueva. |
| [doc/context-ai/conventions.md](doc/context-ai/conventions.md) | Vas a escribir código: naming (DB snake_case / cliente camelCase), patrón de componentes, estilos, manejo de errores, commits. |
| [doc/context-ai/decisions.md](doc/context-ai/decisions.md) | Vas a cambiar algo estructural (servidor, driver de DB, fechas, offline, campos `*Raw`): revisá por qué está así y qué se descartó. |
| [doc/context-ai/glosary.md](doc/context-ai/glosary.md) | Aparece un término del dominio (`estadoKindle`, `no_leidos`, `descargadoRaw`, seed, replace/merge) o columnas del CSV. |
| [doc/context-ai/workflow.md](doc/context-ai/workflow.md) | Vas a hacer un cambio, cerrarlo (checklist de "terminado") o desplegar. |
| [doc/context-ai/known-errors.md](doc/context-ai/known-errors.md) | Antes de tocar API, import CSV, fechas o toggles de la UI; y al investigar un bug (puede estar ya documentado). |

Si cambiás arquitectura, convenciones o descubrís un gotcha, **actualizá el doc correspondiente**.

## 3. Arquitectura en 30 segundos
```
server/app.ts     App Express con todas las rutas (router en /api y /), sin listen
server/db.ts      pg.Pool, helpers, seed CSV, ensureDatabase (CREATE TABLE IF NOT EXISTS + seed)
server.ts         Local/contenedor: Vite middleware (dev) o dist/ (prod) + listen :3000
server-entry.ts   Handler Vercel → esbuild → api/index.js (GENERADO, se commitea)
src/App.tsx       Todo el estado y los handlers; componentes reciben props
```

## 4. Comandos
- `npm run dev` — app completa en `http://localhost:3000`.
- `npm run lint` — `tsc --noEmit` (única verificación automática; no hay tests).
- `npm run build` — `dist/` + `api/index.js` + `dist/server.cjs`.
- `npm run db:import [csv]` — **reemplaza** toda la tabla `libros`.

## 5. Reglas para agentes
1. **Después de tocar `server/`**: correr `npm run build` y commitear `api/index.js`, si no Vercel despliega la API vieja.
2. **Cambios de modelo**: tocar juntos `src/types.ts`, `server/db.ts` (`mapRowToBook`, schema), SQL en `server/app.ts`, `src/utils/csvHelper.ts` y `scripts/import_books.ts`.
3. **SQL siempre parametrizado** (`$1..$n`). Respuestas de error `{ error, details }` con status HTTP acorde.
4. **Textos de UI en español** y respetando los 3 tamaños de texto (`textSize`).
5. **No tocar** `server.hmr` / `watch` en `vite.config.ts` (AI Studio) ni el puerto 3000.
6. **No commitear** `.env*`, `data/`, `public/libros_iniciales.csv`, `.codegraph/` (salvo su `.gitignore`).
7. Operaciones destructivas sobre la DB (`seed`, `batch replace`, `db:import`): confirmar con el usuario antes.

## 6. Herramientas (MCP)
- **CodeGraph** (`.mcp.json`, índice en `.codegraph/`): usar `codegraph_explore` antes de grep/lecturas para ubicar símbolos y call paths. Tras cambios grandes: `codegraph sync`.
