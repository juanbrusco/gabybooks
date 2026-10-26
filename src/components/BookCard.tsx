import React from 'react';
import { Star, MapPin, Calendar, BookCheck, Search, Volume2, Edit3 } from 'lucide-react';
import { Book, TextSizeMode } from '../types';

interface BookCardProps {
  book: Book;
  onSelect?: (book: Book) => void;
  onEdit: (book: Book) => void;
  onMarkLeidoModal?: (book: Book) => void;
  isNoLeidosSection?: boolean;
  onToggleKindle?: (book: Book) => void;
  onPlayTTS: (text: string) => void;
  textSize: TextSizeMode;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onSelect,
  onEdit,
  onMarkLeidoModal,
  isNoLeidosSection = false,
  onPlayTTS,
  textSize,
}) => {
  const titleSize =
    textSize === 'extra'
      ? 'text-2xl sm:text-3xl'
      : textSize === 'grande'
      ? 'text-xl sm:text-2xl'
      : 'text-lg sm:text-xl';

  const authorSize =
    textSize === 'extra'
      ? 'text-lg sm:text-xl'
      : textSize === 'grande'
      ? 'text-base sm:text-lg'
      : 'text-sm sm:text-base';

  const commentSize =
    textSize === 'extra'
      ? 'text-base sm:text-lg leading-relaxed'
      : textSize === 'grande'
      ? 'text-sm sm:text-base leading-relaxed'
      : 'text-xs sm:text-sm leading-normal';

  const actionButtonSize =
    textSize === 'extra'
      ? 'text-base sm:text-lg font-black'
      : textSize === 'grande'
      ? 'text-sm sm:text-base font-black'
      : 'text-sm sm:text-base font-extrabold';

  const isPorConseguir = book.estadoKindle === 'por_conseguir';

  return (
    <article
      id={`card-book-${book.id}`}
      className="bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
    >
      <div className="p-5 flex-1 flex flex-col">
        {/* Status badges header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {book.leido ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs md:text-sm font-black bg-emerald-100 text-emerald-800 border-2 border-emerald-300">
                <BookCheck className="w-4 h-4 text-[#2ECC71]" />
                Leído
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs md:text-sm font-bold bg-gray-100 text-gray-700 border-2 border-gray-300">
                Pendiente
              </span>
            )}

            {isPorConseguir && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs md:text-sm font-black bg-orange-100 text-orange-900 border-2 border-orange-300">
                <Search className="w-3.5 h-3.5 text-[#E67E22]" />
                Por conseguir
              </span>
            )}
          </div>
        </div>

        {/* Title & Author */}
        <h2
          onClick={() => onEdit(book)}
          className={`font-black text-[#2C3E50] group-hover:text-[#3498DB] cursor-pointer transition-colors leading-tight mb-1 tracking-tight ${titleSize}`}
        >
          {book.titulo}
        </h2>

        <p className={`font-semibold text-gray-600 mb-3 ${authorSize}`}>
          Autor: <span className="text-[#1A1A1A] font-extrabold">{book.autor}</span>
        </p>

        {/* Details: Place, Date & Rating */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm mb-3.5">
          {book.lugar && (
            <span className="inline-flex items-center gap-1.5 bg-[#ECF0F1] px-2.5 py-1 rounded-lg font-bold text-[#2C3E50] border-l-4 border-[#3498DB]">
              <MapPin className="w-3.5 h-3.5 text-[#3498DB]" />
              {book.lugar}
            </span>
          )}

          {book.fecha && (
            <span className="inline-flex items-center gap-1 text-gray-500 font-semibold bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {book.fecha}
            </span>
          )}

          {(book.calificacionRaw || book.ratingStars > 0) && (
            <span className="inline-flex items-center gap-1 text-[#E67E22] font-bold text-xs bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
              <Star className="w-3.5 h-3.5 fill-[#E67E22] text-[#E67E22]" />
              <span>{book.calificacionRaw || `${book.ratingStars}/5`}</span>
            </span>
          )}
        </div>

        {/* Comment / Review Box */}
        {book.comentario ? (
          <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-gray-200 mt-1 relative flex-1 flex flex-col justify-between">
            <p className={`text-gray-800 font-medium line-clamp-4 ${commentSize}`}>
              "{book.comentario}"
            </p>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-200">
              <button
                type="button"
                id={`btn-escuchar-${book.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayTTS(`${book.titulo} de ${book.autor}. ${book.comentario}`);
                }}
                className="text-xs sm:text-sm font-bold text-[#3498DB] hover:text-[#2980B9] inline-flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                title="Escuchar este resumen en voz alta"
              >
                <Volume2 className="w-4 h-4 text-[#3498DB]" />
                <span>Leer en voz alta</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-3 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-500 italic mt-1">
            Sin notas registradas todavía. ¡Toca editar para añadir tu comentario!
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="bg-[#F4F6F7] px-4 py-3 border-t-2 border-gray-200">
        {isNoLeidosSection ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <button
              type="button"
              id={`btn-marcar-leido-${book.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onMarkLeidoModal?.(book);
              }}
              className={`py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl bg-[#2E7D52] border-2 border-[#225E3D] hover:bg-[#246642] text-white shadow-xs flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer leading-tight transition-all text-center ${actionButtonSize}`}
              title="Marcar como leído y calificar"
            >
              <BookCheck className="w-5 h-5 text-white shrink-0" />
              <span>Marca como leído</span>
            </button>

            <button
              type="button"
              id={`btn-ver-editar-${book.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(book);
              }}
              className={`py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl bg-white border-2 border-gray-300 text-[#2C3E50] hover:bg-gray-100 hover:border-gray-400 shadow-xs flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer leading-tight transition-all text-center ${actionButtonSize}`}
              title="Ver y editar libro"
            >
              <Edit3 className="w-5 h-5 text-[#3498DB] shrink-0" />
              <span>Ver/Editar</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            id={`btn-ver-editar-${book.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(book);
            }}
            className={`w-full py-2.5 sm:py-3 px-4 rounded-xl bg-white border-2 border-gray-300 text-[#2C3E50] hover:bg-gray-100 hover:border-gray-400 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${actionButtonSize}`}
            title="Ver y editar libro"
          >
            <Edit3 className="w-5 h-5 text-[#3498DB]" />
            <span>Ver/Editar</span>
          </button>
        )}
      </div>
    </article>
  );
};
