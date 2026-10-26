export interface Book {
  id: string;
  autor: string;
  titulo: string;
  leido: boolean;
  calificacionRaw: string;
  ratingStars: number; // 0 to 5
  comentario: string;
  fecha: string;
  lugar: string;
  descargadoRaw: string;
  estadoKindle: 'en_kindle' | 'por_conseguir' | 'no_descargado';
}

export type TabType = 'libros' | 'no_leidos';

export type TextSizeMode = 'normal' | 'grande' | 'extra';

export interface BookStats {
  total: number;
  leidos: number;
  enKindle: number;
  porConseguir: number;
  favoritos: number;
  topAutores: { autor: string; count: number }[];
  lugaresPopulares: { lugar: string; count: number }[];
}
