import Papa from 'papaparse';
import { Book } from '../types';

export function extractRatingStars(calificacion: string): number {
  if (!calificacion) return 0;
  const match = calificacion.trim().match(/^([0-5])/);
  if (match) {
    return parseInt(match[1], 10);
  }
  const anyMatch = calificacion.match(/\b([0-5])\b/);
  if (anyMatch) {
    return parseInt(anyMatch[1], 10);
  }
  return 0;
}

function getField(row: Record<string, string>, possibleHeaders: string[]): string {
  for (const h of possibleHeaders) {
    if (row[h] !== undefined && row[h] !== null && row[h] !== '') {
      return row[h].trim();
    }
  }
  const keys = Object.keys(row);
  for (const h of possibleHeaders) {
    const normalizedH = h.toUpperCase().trim();
    const foundKey = keys.find((k) => k.toUpperCase().trim() === normalizedH);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
      return row[foundKey].trim();
    }
  }
  return '';
}

export function parseCSVToBooks(csvContent: string): Book[] {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().toUpperCase(),
  });

  const books: Book[] = [];

  (result.data as Record<string, string>[]).forEach((row, index) => {
    const autor = getField(row, ['AUTOR', 'AUTORA', 'AUTORES', 'AUTHOR', 'ESCRITOR']);
    const titulo = getField(row, ['TÍTULO', 'TITULO', 'LIBRO', 'NOMBRE', 'OBRA', 'TITLE', 'BOOK']);

    // Skip empty lines that have no title and no author
    if (!autor && !titulo) return;

    const leidoRaw = getField(row, ['LEÍDO', 'LEIDO', 'LEÍDOS', 'LEIDOS', 'READ', 'ESTADO', 'STATUS']).toLowerCase();
    const calificacion = getField(row, [
      'CALIFICACIÓN',
      'CALIFICACION',
      'PUNTAJE',
      'NOTA',
      'PUNTUACIÓN',
      'PUNTUACION',
      'ESTRELLAS',
      'RATING',
      'SCORE',
    ]);
    const comentario = getField(row, [
      'COMENTARIO',
      'COMENTARIOS',
      'OPINIÓN',
      'OPINION',
      'NOTAS',
      'RESUMEN',
      'REVIEW',
      'COMMENT',
    ]);
    const fecha = getField(row, [
      'FECHA',
      'FECHA LECTURA',
      'FECHA DE LECTURA',
      'LEÍDO EN',
      'LEIDO EN',
      'AÑO',
      'MES',
      'DATE',
    ]);
    const lugar = getField(row, [
      'LUGAR',
      'ORIGEN',
      'PAÍS',
      'PAIS',
      'CIUDAD',
      'NACIONALIDAD',
      'LOCATION',
      'COUNTRY',
    ]);
    const descargado = getField(row, ['DESCARGADO', 'DESCARGADOS', 'KINDLE', 'EN KINDLE', 'DOWNLOADED']).toLowerCase();

    const isNoConseguido =
      descargado.includes('no conseguido') ||
      calificacion.toLowerCase().includes('no conseguido') ||
      leidoRaw.includes('no conseguido');

    let estadoKindle: 'en_kindle' | 'por_conseguir' | 'no_descargado' = 'no_descargado';
    if (isNoConseguido) {
      estadoKindle = 'por_conseguir';
    } else if (descargado === 'si' || descargado === 'sí') {
      estadoKindle = 'en_kindle';
    }

    const leido =
      leidoRaw === 'si' ||
      leidoRaw === 'sí' ||
      Boolean(calificacion && !isNoConseguido) ||
      Boolean(fecha && !isNoConseguido);

    const stars = extractRatingStars(calificacion);

    books.push({
      id: `book-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      autor: autor || 'Autor Desconocido',
      titulo: titulo || 'Sin Título',
      leido,
      calificacionRaw: calificacion,
      ratingStars: stars,
      comentario,
      fecha,
      lugar,
      descargadoRaw: descargado,
      estadoKindle,
    });
  });

  return books;
}

export function exportBooksToCSV(books: Book[]): string {
  const data = books.map((b) => {
    let descargadoVal = '';
    if (b.estadoKindle === 'por_conseguir') {
      descargadoVal = 'no conseguido';
    } else if (b.estadoKindle === 'en_kindle') {
      descargadoVal = 'si';
    } else {
      descargadoVal = b.descargadoRaw || 'no';
    }

    return {
      AUTOR: b.autor,
      TÍTULO: b.titulo,
      LEÍDO: b.leido ? 'si' : 'no',
      CALIFICACIÓN: b.calificacionRaw || (b.ratingStars > 0 ? `${b.ratingStars} estrellas` : ''),
      COMENTARIO: b.comentario,
      FECHA: b.fecha,
      LUGAR: b.lugar,
      DESCARGADO: descargadoVal,
    };
  });

  return Papa.unparse(data, {
    quotes: true,
    header: true,
  });
}

export function downloadCSVFile(content: string, filename = 'mis_libros_lectura.csv') {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

