# Convenciones

## Idioma
- **Dominio y UI en español**: campos (`titulo`, `autor`, `leido`, `lugar`), tabs (`libros`, `no_leidos`), mensajes de toast/errores y logs (`[NeonDB] ...`).
- Comentarios de código: mezcla inglés/español.

## Naming
| Ámbito | Estilo | Ejemplo |
|---|---|---|
| Columnas DB | snake_case | `calificacion_estrellas`, `estado_kindle`, `descargado_raw` |
| Modelo cliente (`Book`) | camelCase | `ratingStars`, `estadoKindle`, `descargadoRaw` |
| Valores enumerados | snake_case string | `'en_kindle' \| 'por_conseguir' \| 'no_descargado'` |
| Componentes | PascalCase, 1 por archivo | `BookCard.tsx` |
| Hooks | `useXxx` en `src/hooks/` | `useOnlineStatus` |
| Handlers en App | `handleXxx` | `handleToggleLeido` |
| Props de callback | `onXxx` | `onRestoreOriginal` |
| `id` de elementos DOM | kebab-case en español | `btn-restaurar-originales`, `modal-importar-exportar-csv` |
| Campos `*Raw` | valor original del CSV sin normalizar | `calificacionRaw`, `descargadoRaw` |

## Patrones en uso
- Componentes: `export const X: React.FC<XProps> = (...)` con `interface XProps` arriba. Export nombrado (solo `App` es default).
- Estado centralizado en `App.tsx`; los componentes reciben datos y callbacks por props.
- `textSize: TextSizeMode` se pasa a casi todos los componentes; cada uno resuelve sus clases con ternarios `extra`/`grande`/normal.
- Estilos: clases Tailwind inline con colores hex arbitrarios (`bg-[#2D3E50]`). Sin archivos CSS por componente.
- Updates optimistas + toast (`showToast`) como feedback.
- Servicio API: cada función hace `fetch`, y si `!res.ok` lanza `Error(errorData.error || 'mensaje (status)')`.
- Servidor: cada endpoint en `try/catch`, errores como `{ error, details }` con status 4xx/5xx. SQL parametrizado (`$1..$n`).
- Normalización de entrada en servidor con `safeDate` / `safeStars` antes de insertar.
- Acceso a APIs del navegador opcionales con feature detection (`'speechSynthesis' in window`, `webkitSpeechRecognition`).

## Prohibidos / a evitar
- Concatenar valores en SQL (siempre parámetros).
- Tocar la config `server.hmr` / `watch` en `vite.config.ts` (comentario: "Do not modify", lo usa AI Studio vía `DISABLE_HMR`).
- [PENDIENTE: no hay reglas explícitas de lo prohibido en el repo; confirmar con el equipo]

## Tests
- No existen tests ni framework de testing. Verificación actual: `npm run lint` (`tsc --noEmit`). [PENDIENTE: estrategia de tests]

## Commits
- Historial corto, mensajes breves en minúscula sin prefijo (`init`, `structure v0`, `pkg`). [PENDIENTE: convención acordada, p.ej. Conventional Commits]
