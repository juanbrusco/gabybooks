// Loaded here (not in app.ts) because the pool reads DATABASE_URL at import time
import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import pg from 'pg';
import Papa from 'papaparse';

// Ensure date strings from Postgres are not shifted by timezone
pg.types.setTypeParser(1082, (val: string) => val);

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Helper for dates in PostgreSQL DATE column with Spanish format support
export function safeDate(val?: string | null): string | null {
  if (!val || typeof val !== 'string' || !val.trim()) return null;
  const s = val.trim().replace(/[Oo]/g, '0');
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const m = s.match(/(?:(\d{1,2})[-–])?(\d{1,3})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
  if (m) {
    const [, , dayStr, monthStr, yearStr] = m;
    let day = parseInt(dayStr, 10);
    let month = parseInt(monthStr, 10);
    let year = parseInt(yearStr, 10);

    if (year < 100) year += 2000;
    else if (year < 1000) year = 2023;

    if (day > 31 && (dayStr.startsWith('111') || dayStr.startsWith('11'))) day = 11;
    if (month > 12) month = 12;

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1990 && year <= 2035) {
      const y = String(year).padStart(4, '0');
      const mo = String(month).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      return `${y}-${mo}-${d}`;
    }
  }

  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return null;
}

// Helper for rating stars 1-5
export function safeStars(val?: number | string | null): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = Number(val);
  if (!isNaN(num) && num >= 1 && num <= 5) {
    return Math.round(num);
  }
  return null;
}

// Map PostgreSQL row to client Book model
export function mapRowToBook(row: any) {
  let fechaStr = '';
  if (row.fecha) {
    if (typeof row.fecha === 'string') {
      fechaStr = row.fecha.substring(0, 10);
    } else if (row.fecha instanceof Date) {
      fechaStr = row.fecha.toISOString().split('T')[0];
    }
  }

  let estadoKindle: 'en_kindle' | 'por_conseguir' | 'no_descargado' = 'no_descargado';
  if (row.estado_kindle === 'en_kindle') {
    estadoKindle = 'en_kindle';
  } else if (row.estado_kindle === 'por_conseguir') {
    estadoKindle = 'por_conseguir';
  }

  return {
    id: String(row.id),
    titulo: row.titulo || '',
    autor: row.autor || '',
    leido: Boolean(row.leido),
    calificacionRaw: row.calificacion_raw || '',
    ratingStars: row.calificacion_estrellas ? Number(row.calificacion_estrellas) : 0,
    comentario: row.comentario || '',
    fecha: fechaStr,
    lugar: row.lugar || '',
    descargadoRaw: row.descargado_raw || '',
    estadoKindle,
  };
}

// Seed helper from initial CSV
export async function seedInitialBooksFromCSV() {
  const csvPath = path.join(process.cwd(), 'public', 'libros_iniciales.csv');
  if (!fs.existsSync(csvPath)) return [];

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const insertedBooks = [];
  for (const row of parsed.data) {
    const autor = row['AUTOR'] || row['autor'] || '';
    const titulo = row['TÍTULO'] || row['TITULO'] || row['titulo'] || '';
    if (!titulo && !autor) continue;

    const descargadoRaw = (row['DESCARGADO'] || row['descargado'] || '').trim();
    const leidoRaw = (row['LEÍDO'] || row['leido'] || '').trim();
    const descargadoLower = descargadoRaw.toLowerCase();
    const leidoLower = leidoRaw.toLowerCase();

    // Business rule: si "DESCARGADO" es "si" y "LEIDO" no tiene info o es null o es vacio, quiere decir que es NO LEIDO
    let leido = false;
    if (
      (descargadoLower === 'si' || descargadoLower === 'sí') &&
      (!leidoRaw || leidoLower === 'null' || leidoLower === 'undefined' || leidoLower === 'no')
    ) {
      leido = false;
    } else if (leidoLower === 'si' || leidoLower === 'sí' || leidoLower === 'true') {
      leido = true;
    } else {
      leido = false;
    }

    let estadoKindle = 'no_descargado';
    if (descargadoLower === 'si' || descargadoLower === 'sí') {
      estadoKindle = 'en_kindle';
    } else if (
      descargadoLower.includes('no conseguido') ||
      descargadoLower.includes('por conseguir')
    ) {
      estadoKindle = 'por_conseguir';
    }

    const califRaw = (row['CALIFICACIÓN'] || row['calificacion'] || '').trim();
    let ratingStars = 0;
    const match = califRaw.match(/([1-5])/);
    if (match) ratingStars = parseInt(match[1], 10);

    const comentario = (row['COMENTARIO'] || row['comentario'] || '').trim();
    const fecha = safeDate(row['FECHA'] || row['fecha'] || '');
    const lugar = (row['LUGAR'] || row['lugar'] || '').trim();

    const res = await pool.query(
      `INSERT INTO libros (
        titulo, autor, leido, calificacion_estrellas, calificacion_raw,
        comentario, fecha, lugar, estado_kindle, descargado_raw
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        titulo,
        autor,
        leido,
        safeStars(ratingStars),
        califRaw,
        comentario,
        fecha,
        lugar,
        estadoKindle,
        descargadoRaw,
      ]
    );
    insertedBooks.push(mapRowToBook(res.rows[0]));
  }
  return insertedBooks;
}

let initPromise: Promise<void> | null = null;

// Create table if missing and seed if empty. Runs once per process (cold start in serverless).
export function ensureDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      // Schema deduced from the queries in this file; no-op if the table already exists.
      await pool.query(`
        CREATE TABLE IF NOT EXISTS libros (
          id SERIAL PRIMARY KEY,
          titulo TEXT NOT NULL DEFAULT '',
          autor TEXT NOT NULL DEFAULT '',
          leido BOOLEAN NOT NULL DEFAULT FALSE,
          calificacion_estrellas INTEGER,
          calificacion_raw TEXT NOT NULL DEFAULT '',
          comentario TEXT NOT NULL DEFAULT '',
          fecha DATE,
          lugar TEXT NOT NULL DEFAULT '',
          estado_kindle TEXT NOT NULL DEFAULT 'no_descargado',
          descargado_raw TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      const res = await pool.query('SELECT COUNT(*) FROM libros');
      const count = parseInt(res.rows[0].count, 10);
      console.log(`[NeonDB] Conectado exitosamente. Total de libros actuales: ${count}`);

      if (count === 0) {
        console.log('[NeonDB] Tabla vacía. Sembrando catálogo inicial desde libros_iniciales.csv...');
        const seeded = await seedInitialBooksFromCSV();
        console.log(`[NeonDB] Se insertaron ${seeded.length} libros iniciales.`);
      }
    })().catch((err) => {
      // Allow retry on next request
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}
