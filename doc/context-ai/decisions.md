# Decisiones técnicas (inferidas del código)

> Ninguna está documentada explícitamente; el "porqué" se deduce de comentarios y código. Lo no deducible queda como [PENDIENTE].

### 1. Serverless monolith (patrón copiado del proyecto `soydt!`)
- **Qué**: `server/app.ts` exporta la app Express sin `listen`. `server.ts` la levanta en local/contenedor; `server-entry.ts` se empaqueta con esbuild a `api/index.js` (ESM) para Vercel. Router montado en `/api` y `/` por compatibilidad con los rewrites.
- **Por qué**: mismo código en dev y en Vercel, sin cargar `vite` dentro de la función.
- **Se mantiene**: build Node CJS (`dist/server.cjs`, `npm start`) para contenedor.

### 2. PostgreSQL en Neon con `pg` (no ORM)
- **Qué**: SQL a mano con `pg.Pool`, SSL `rejectUnauthorized: false`.
- **Por qué**: [PENDIENTE]. Plan free de Neon (README).
- **Descartado (por ahora)**: `@neondatabase/serverless` (lo usa `soydt!`); se decidió mantener `pg`.

### 3. Fechas como string `YYYY-MM-DD`
- **Qué**: `pg.types.setTypeParser(1082, val => val)`.
- **Por qué**: comentario: evitar que las fechas `DATE` se corran por zona horaria.

### 4. Guardar el valor crudo del CSV junto al normalizado
- **Qué**: `calificacion_raw` + `calificacion_estrellas`, `descargado_raw` + `estado_kindle`.
- **Por qué**: el CSV original es texto libre en español; se conserva para exportar sin perder info.

### 5. Regla de negocio de "leído"
- Comentario en código: *"si DESCARGADO es 'si' y LEIDO está vacío/null, es NO LEÍDO"* (pedida por el usuario).
- En la UI: marcar como leído o crear un libro nuevo ⇒ `estadoKindle = 'en_kindle'`, `descargadoRaw = 'si'`.

### 6. Offline-first ligero (PWA + localStorage)
- **Qué**: service worker con autoUpdate + copia del catálogo en `localStorage` como fallback de lectura.
- **Descartado**: cola de escrituras offline / sync (no existe).

### 7. Accesibilidad para lectura cómoda
- 3 tamaños de texto persistidos en `localStorage`, TTS (`speechSynthesis`, `es-ES`), dictado por voz en búsqueda y formulario.
- **Por qué**: [PENDIENTE: público objetivo; se intuye usuaria final no técnica]

### 8. Seed automático desde CSV
- Si la tabla está vacía al arrancar, se siembra desde `public/libros_iniciales.csv` (archivo no versionado, datos personales).

### 9. Gestor de paquetes
- Conviven `bun.lock` y `package-lock.json` (último commit `pkg` agrega el de npm; README dice `npm install`). [PENDIENTE: elegir uno]
