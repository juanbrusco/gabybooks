import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';
import Papa from 'papaparse';

dotenv.config();


const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// Robust date parser for Spanish dates (DD/MM/YYYY, etc.)
function parseSpanishDate(val?: string | null): string | null {
  if (!val || typeof val !== 'string' || !val.trim()) return null;
  const s = val.trim().replace(/[Oo]/g, '0');
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const m = s.match(/(?:(\d{1,2})[-–])?(\d{1,3})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
  if (!m) return null;

  const [, , dayStr, monthStr, yearStr] = m;
  let day = parseInt(dayStr, 10);
  let month = parseInt(monthStr, 10);
  let year = parseInt(yearStr, 10);

  if (year < 100) year += 2000;
  else if (year < 1000) year = 2023; // Handles typos like 0203 -> 2023

  if (day > 31 && (dayStr.startsWith('111') || dayStr.startsWith('11'))) day = 11;
  if (month > 12) month = 12;

  if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1990 && year <= 2035) {
    const y = String(year).padStart(4, '0');
    const mo = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }
  return null;
}

// Helper for rating stars 1-5
function parseRatingStars(val?: string | null): number | null {
  if (!val || typeof val !== 'string' || !val.trim()) return null;
  const match = val.match(/([0-5])/);
  if (match) {
    const num = parseInt(match[1], 10);
    return num >= 1 && num <= 5 ? num : null;
  }
  return null;
}

interface CSVRow {
  AUTOR?: string;
  autor?: string;
  TÍTULO?: string;
  TITULO?: string;
  titulo?: string;
  LEÍDO?: string;
  leido?: string;
  CALIFICACIÓN?: string;
  calificacion?: string;
  COMENTARIO?: string;
  comentario?: string;
  FECHA?: string;
  fecha?: string;
  LUGAR?: string;
  lugar?: string;
  DESCARGADO?: string;
  descargado?: string;
}

export async function importBooksFromCSV(filePath?: string, replaceAll: boolean = true) {
  const targetPath = filePath || path.join(process.cwd(), 'data', 'books.csv');

  console.log(`\n========================================`);
  console.log(` Iniciando importación de libros a NeonDB `);
  console.log(`========================================`);
  console.log(`Archivo CSV: ${targetPath}`);

  if (!fs.existsSync(targetPath)) {
    throw new Error(`El archivo CSV no existe en la ruta: ${targetPath}`);
  }

  const csvContent = fs.readFileSync(targetPath, 'utf8');
  const parsed = Papa.parse<CSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    console.warn(`Advertencias al parsear CSV:`, parsed.errors.slice(0, 3));
  }

  console.log(`Total de filas detectadas en CSV: ${parsed.data.length}`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (replaceAll) {
      console.log('Modo reemplazo activado: limpiando registros anteriores en tabla "libros"...');
      await client.query('DELETE FROM libros');
    }

    let insertedCount = 0;
    let leidosCount = 0;
    let noLeidosCount = 0;
    let enKindleCount = 0;

    // Process rows
    for (const row of parsed.data) {
      const autor = (row['AUTOR'] || row['autor'] || '').trim();
      const titulo = (row['TÍTULO'] || row['TITULO'] || row['titulo'] || '').trim();

      if (!titulo && !autor) continue;

      const descargadoRaw = (row['DESCARGADO'] || row['descargado'] || '').trim();
      const leidoRaw = (row['LEÍDO'] || row['leido'] || '').trim();
      const descargadoLower = descargadoRaw.toLowerCase();
      const leidoLower = leidoRaw.toLowerCase();

      // Regla de negocio solicitada por el usuario:
      // "si 'DESCARGADO' es 'si' y 'LEIDO' no tiene info o es null o es vacio, quiere decir que es NO LEIDO"
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

      if (leido) {
        leidosCount++;
      } else {
        noLeidosCount++;
      }

      // Estado Kindle
      let estadoKindle = 'no_descargado';
      if (descargadoLower === 'si' || descargadoLower === 'sí') {
        estadoKindle = 'en_kindle';
        enKindleCount++;
      } else if (
        descargadoLower.includes('no conseguido') ||
        descargadoLower.includes('por conseguir')
      ) {
        estadoKindle = 'por_conseguir';
      }

      const califRaw = (row['CALIFICACIÓN'] || row['calificacion'] || '').trim();
      const ratingStars = parseRatingStars(califRaw);
      const comentario = (row['COMENTARIO'] || row['comentario'] || '').trim();
      const fecha = parseSpanishDate(row['FECHA'] || row['fecha'] || '');
      const lugar = (row['LUGAR'] || row['lugar'] || '').trim();

      await client.query(
        `INSERT INTO libros (
          titulo, autor, leido, calificacion_estrellas, calificacion_raw,
          comentario, fecha, lugar, estado_kindle, descargado_raw
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          titulo,
          autor,
          leido,
          ratingStars,
          califRaw,
          comentario,
          fecha,
          lugar,
          estadoKindle,
          descargadoRaw,
        ]
      );

      insertedCount++;
    }

    await client.query('COMMIT');

    console.log(`\n Importación completada con éxito:`);
    console.log(`  - Total insertados: ${insertedCount}`);
    console.log(`  - Leídos: ${leidosCount}`);
    console.log(`  - No Leídos: ${noLeidosCount}`);
    console.log(`  - En Kindle: ${enKindleCount}`);

    return {
      success: true,
      insertedCount,
      leidosCount,
      noLeidosCount,
      enKindleCount,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error durante la transacción de importación:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run directly when executed via tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  const filePathArg = process.argv[2];
  importBooksFromCSV(filePathArg)
    .then(() => {
      console.log('Finalizado correctamente.\n');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fallo en script de importación:', err);
      process.exit(1);
    });
}
