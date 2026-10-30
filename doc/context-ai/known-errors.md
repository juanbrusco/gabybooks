# Errores conocidos y gotchas

> Deducidos de la lectura del código; no verificados en runtime. No hay tests que los cubran.

## Datos / API
1. ~~PUT parcial borraba campos~~ — corregido: `PUT /api/books/:id` ahora mezcla el body con la fila actual. Mandar `''` explícito sigue vaciando el campo.
2. ~~Toggles sin rollback~~ — corregido: los toggles pasan por `patchBook` en `App.tsx`, que revierte los campos y muestra toast de error si falla la API.
3. **`seed` borra antes de sembrar**: `POST /api/books/seed` hace `DELETE FROM libros` y luego lee `public/libros_iniciales.csv`. Ese archivo está en `.gitignore` ⇒ en Vercel probablemente no existe y "Restaurar catálogo" deja la tabla **vacía**.
4. **`batch` sin transacción**: con `mode=replace` borra todo y luego inserta fila a fila; un error a mitad deja la tabla parcial. (El script `db:import` sí usa `BEGIN/COMMIT`).
5. **`merge` no deduplica**: reimportar el mismo CSV duplica libros.
6. **Default `estadoKindle || 'no'`** en el servidor: `'no'` no es un valor válido del tipo; al leer, `mapRowToBook` lo convierte a `no_descargado`.
7. **API sin autenticación**: cualquiera con la URL puede borrar todo.
8. **SSL con `rejectUnauthorized: false`** en el pool.
9. **`ensureDatabase()` corre en cada cold start** (`CREATE TABLE IF NOT EXISTS` + `COUNT` + posible seed). Si falla, se reintenta en la próxima request.
9b. **`api/index.js` es generado pero se commitea**: si cambiás `server/` y no corrés `npm run build`, Vercel despliega la API vieja.
9c. **`pg.Pool` en serverless**: cada instancia abre su pool; con mucho tráfico puede agotar conexiones de Neon (alternativa: `@neondatabase/serverless`).

## Parseo CSV / fechas (lógica triplicada y divergente)
10. Hay 3 parsers: `seedInitialBooksFromCSV` (server), `scripts/import_books.ts` y `src/utils/csvHelper.ts` (cliente). Difieren:
    - Cliente infiere `leido = true` si hay calificación o fecha; server/script solo si `LEÍDO = si`.
    - Rating: server seed `[1-5]`, script `[0-5]`→null si 0, cliente `0-5` (prioriza dígito inicial).
    - El cliente no normaliza fechas (manda texto libre; el server aplica `safeDate`).
11. **`safeDate` / `parseSpanishDate` tiene heurísticas "a medida"**: reemplaza `O`→`0`, año <100 ⇒ +2000, año 100–999 ⇒ **2023** fijo, día que empieza con `11` y >31 ⇒ 11, mes >12 ⇒ 12, solo acepta 1990–2035. Fuera de eso cae a `new Date()` (server) o `null` (script).

## UI
12. **Tab "No leídos" ignora búsqueda, autor y lugar** (el filtro hace `return` temprano).
13. Orden "recientes" devuelve `0`: depende del `ORDER BY created_at DESC` del servidor; libros recién creados se insertan al inicio en local, los importados dependen de la recarga.
14. Tab "Libros" no muestra lista hasta que haya un filtro activo o se pulse "Ver todo" (`shouldShowList`).
15. Offline: lectura desde `localStorage`, pero las escrituras fallan (no hay cola).
16. `PWAInstallButton` existe pero no se usa en ningún lado.

## Entorno / docs
17. README desactualizado: pide `GEMINI_API_KEY` en `.env.local` (no se usa; `dotenv` lee `.env`) y menciona `@neondatabase/serverless` (se usa `pg`).
18. Conviven `bun.lock` y `package-lock.json`.
19. `vite.config.ts`: no tocar `hmr`/`watch` (usado por AI Studio con `DISABLE_HMR`).
20. `package.json` se llama `react-example` (resto del template de AI Studio).
