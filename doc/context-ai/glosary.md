# Glosario

## Entidad principal: `Book` (tabla `libros`)
| Campo cliente | Columna DB | Significado |
|---|---|---|
| `id` | `id` | Id de la DB (string en cliente). |
| `titulo` / `autor` | `titulo` / `autor` | Al menos uno es obligatorio. |
| `leido` | `leido` | Si Gaby ya lo leyó. |
| `ratingStars` | `calificacion_estrellas` | 1–5 (0 en cliente = sin calificar; `NULL` en DB). |
| `calificacionRaw` | `calificacion_raw` | Texto original de calificación del CSV. |
| `comentario` | `comentario` | Opinión libre. |
| `fecha` | `fecha` (DATE) | Fecha de lectura, `YYYY-MM-DD`. |
| `lugar` | `lugar` | Origen/país/ciudad; puede venir múltiple separado por `/` o `,`. |
| `estadoKindle` | `estado_kindle` | Disponibilidad en Kindle (ver abajo). |
| `descargadoRaw` | `descargado_raw` | Texto original de la columna DESCARGADO. |
| — | `created_at` | Orden por defecto ("recientes"). |

## Estados Kindle
- **`en_kindle`**: descargado en el Kindle (`DESCARGADO = si`).
- **`por_conseguir`**: buscado pero no conseguido (`no conseguido` / `por conseguir`).
- **`no_descargado`**: resto.

## Términos de UI
- **Tab "Libros" (`libros`)**: libros leídos.
- **Tab "No leídos" (`no_leidos`)**: en Kindle y aún no leídos (pendientes de lectura).
- **Catálogo inicial / restaurar**: el dataset de `libros_iniciales.csv`; "restaurar" borra todo y lo re-siembra.
- **Importar modo `replace` / `merge`**: reemplazar toda la tabla vs. agregar al final (sin deduplicar).
- **Tamaño de texto (`TextSizeMode`)**: `normal` | `grande` | `extra`.
- **Stats / Estadísticas**: drawer con totales, favoritos, top autores y lugares.
- **"Autor Desconocido" / "Sin Título"**: placeholders que pone el parser CSV del cliente.

## Columnas del CSV de origen
`AUTOR`, `TÍTULO`, `LEÍDO`, `CALIFICACIÓN`, `COMENTARIO`, `FECHA`, `LUGAR`, `DESCARGADO` (el parser del cliente acepta además sinónimos en español/inglés).

## Siglas / nombres internos
- **Gaby**: dueña/usuaria del catálogo ("La Biblioteca de Gaby", `BiblioGaby`).
- **NeonDB**: el Postgres serverless (Neon) usado como DB.
- **TTS**: lectura en voz alta (`speechSynthesis`).
- **PWA**: app instalable con service worker.
- **AI Studio**: Google AI Studio, entorno donde se generó la app inicialmente.
