import express from 'express';
import {
  pool,
  safeDate,
  safeStars,
  mapRowToBook,
  seedInitialBooksFromCSV,
  ensureDatabase,
} from './db';

/**
 * Express app with all /api routes and no app.listen(), so it runs both
 * as a standalone server (server.ts) and as a Vercel function (server-entry.ts).
 */
export const app = express();

app.use(express.json({ limit: '10mb' }));

const apiRouter = express.Router();

// Create/seed the table before any query (once per cold start)
apiRouter.use(['/health', '/books'], async (_req, res, next) => {
  try {
    await ensureDatabase();
    next();
  } catch (err: any) {
    console.error('[NeonDB] Error al inicializar base de datos:', err);
    res.status(500).json({ error: 'Error al conectar con NeonDB', details: err.message });
  }
});

// 1. Health & Status
apiRouter.get('/health', async (_req, res) => {
  try {
    const countRes = await pool.query('SELECT COUNT(*) FROM libros');
    res.json({
      status: 'ok',
      db: 'connected',
      count: parseInt(countRes.rows[0].count, 10),
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// 2. Get all books
apiRouter.get('/books', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM libros ORDER BY created_at DESC, id DESC'
    );
    const books = result.rows.map(mapRowToBook);
    res.json({ books });
  } catch (err: any) {
    console.error('Error in GET /api/books:', err);
    res.status(500).json({ error: 'Error al consultar libros en NeonDB', details: err.message });
  }
});

// 3. Create a book
apiRouter.post('/books', async (req, res) => {
  try {
    const {
      titulo,
      autor,
      leido,
      calificacionRaw,
      ratingStars,
      comentario,
      fecha,
      lugar,
      estadoKindle,
      descargadoRaw,
    } = req.body;

    if (!titulo && !autor) {
      res.status(400).json({ error: 'El libro debe tener al menos título o autor' });
      return;
    }

    const parsedFecha = safeDate(fecha);
    const parsedStars = safeStars(ratingStars);

    const result = await pool.query(
      `INSERT INTO libros (
        titulo, autor, leido, calificacion_estrellas, calificacion_raw,
        comentario, fecha, lugar, estado_kindle, descargado_raw
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        titulo || '',
        autor || '',
        Boolean(leido),
        parsedStars,
        calificacionRaw || '',
        comentario || '',
        parsedFecha,
        lugar || '',
        estadoKindle || 'no',
        descargadoRaw || '',
      ]
    );

    res.status(201).json({ book: mapRowToBook(result.rows[0]) });
  } catch (err: any) {
    console.error('Error in POST /api/books:', err);
    res.status(500).json({ error: 'Error al crear libro', details: err.message });
  }
});

// 4. Update a book (partial: fields missing from the body keep their current value)
apiRouter.put('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const current = await pool.query('SELECT * FROM libros WHERE id = $1', [id]);
    if (current.rowCount === 0) {
      res.status(404).json({ error: 'Libro no encontrado' });
      return;
    }

    const {
      titulo,
      autor,
      leido,
      calificacionRaw,
      ratingStars,
      comentario,
      fecha,
      lugar,
      estadoKindle,
      descargadoRaw,
    } = { ...mapRowToBook(current.rows[0]), ...req.body };

    const parsedFecha = safeDate(fecha);
    const parsedStars = safeStars(ratingStars);

    const result = await pool.query(
      `UPDATE libros SET
        titulo = $1,
        autor = $2,
        leido = $3,
        calificacion_estrellas = $4,
        calificacion_raw = $5,
        comentario = $6,
        fecha = $7,
        lugar = $8,
        estado_kindle = $9,
        descargado_raw = $10
      WHERE id = $11
      RETURNING *`,
      [
        titulo || '',
        autor || '',
        Boolean(leido),
        parsedStars,
        calificacionRaw || '',
        comentario || '',
        parsedFecha,
        lugar || '',
        estadoKindle || 'no',
        descargadoRaw || '',
        id,
      ]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Libro no encontrado' });
      return;
    }

    res.json({ book: mapRowToBook(result.rows[0]) });
  } catch (err: any) {
    console.error('Error in PUT /api/books/:id:', err);
    res.status(500).json({ error: 'Error al actualizar libro', details: err.message });
  }
});

// 5. Delete a book
apiRouter.delete('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM libros WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Libro no encontrado' });
      return;
    }

    res.json({ success: true, message: 'Libro eliminado de la base de datos' });
  } catch (err: any) {
    console.error('Error in DELETE /api/books/:id:', err);
    res.status(500).json({ error: 'Error al eliminar libro', details: err.message });
  }
});

// 6. Batch import (CSV upload)
apiRouter.post('/books/batch', async (req, res) => {
  try {
    const { books, mode } = req.body;

    if (!Array.isArray(books)) {
      res.status(400).json({ error: 'Formato inválido: se esperaba un arreglo de libros' });
      return;
    }

    if (mode === 'replace') {
      await pool.query('DELETE FROM libros');
    }

    const insertedList = [];
    for (const b of books) {
      const titulo = b.titulo || '';
      const autor = b.autor || '';
      if (!titulo && !autor) continue;

      const parsedFecha = safeDate(b.fecha);
      const parsedStars = safeStars(b.ratingStars);

      const r = await pool.query(
        `INSERT INTO libros (
          titulo, autor, leido, calificacion_estrellas, calificacion_raw,
          comentario, fecha, lugar, estado_kindle, descargado_raw
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          titulo,
          autor,
          Boolean(b.leido),
          parsedStars,
          b.calificacionRaw || '',
          b.comentario || '',
          parsedFecha,
          b.lugar || '',
          b.estadoKindle || 'no',
          b.descargadoRaw || '',
        ]
      );
      insertedList.push(mapRowToBook(r.rows[0]));
    }

    res.json({
      success: true,
      count: insertedList.length,
      mode,
    });
  } catch (err: any) {
    console.error('Error in POST /api/books/batch:', err);
    res.status(500).json({ error: 'Error al procesar lote de libros', details: err.message });
  }
});

// 7. Re-seed to original dataset
apiRouter.post('/books/seed', async (_req, res) => {
  try {
    await pool.query('DELETE FROM libros');
    const seeded = await seedInitialBooksFromCSV();
    res.json({ success: true, count: seeded.length, books: seeded });
  } catch (err: any) {
    console.error('Error in POST /api/books/seed:', err);
    res.status(500).json({ error: 'Error al reiniciar catálogo', details: err.message });
  }
});

// Mounted on both '/api' and '/' for compatibility with Vercel rewrites and local calls
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
