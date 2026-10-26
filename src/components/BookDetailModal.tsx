import React, { useState } from 'react';
import { X, Star, MapPin, Calendar, Tablet, BookCheck, Search, Volume2, Square, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import { Book, TextSizeMode } from '../types';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
  onToggleLeido: (book: Book) => void;
  onSetEstadoKindle: (book: Book, estado: 'en_kindle' | 'por_conseguir' | 'no_descargado') => void;
  textSize: TextSizeMode;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  onClose,
  onEdit,
  onDelete,
  onToggleLeido,
  onSetEstadoKindle,
  textSize,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!book) return null;

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Tu navegador no cuenta con síntesis de voz.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();

    const textToRead = `${book.titulo}, escrito por ${book.autor}. ${
      book.lugar ? `Ambientado en ${book.lugar}.` : ''
    } ${
      book.calificacionRaw ? `Calificación: ${book.calificacionRaw}.` : ''
    } ${book.comentario ? `Comentario y resumen: ${book.comentario}` : 'No tiene comentario guardado.'}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95; // slightly relaxed reading pace for seniors

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopAudioAndClose = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    onClose();
  };

  const titleSize =
    textSize === 'extra'
      ? 'text-3xl sm:text-4xl'
      : textSize === 'grande'
      ? 'text-2xl sm:text-3xl'
      : 'text-xl sm:text-2xl';

  const authorSize =
    textSize === 'extra'
      ? 'text-xl sm:text-2xl'
      : textSize === 'grande'
      ? 'text-lg sm:text-xl'
      : 'text-base sm:text-lg';

  const bodySize =
    textSize === 'extra'
      ? 'text-xl sm:text-2xl leading-relaxed'
      : textSize === 'grande'
      ? 'text-lg sm:text-xl leading-relaxed'
      : 'text-base sm:text-lg leading-relaxed';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="modal-ficha-libro"
        className="bg-white rounded-3xl border-2 sm:border-4 border-[#2C3E50] shadow-2xl max-w-3xl w-full overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top bar with back/close */}
        <div className="bg-[#2D3E50] text-white px-5 sm:px-7 py-4 border-b-4 border-[#1A252F] flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-extrabold text-base sm:text-lg">
            <span className="w-3 h-3 rounded-full bg-[#3498DB]"></span>
            <span>Ficha Técnica del Libro</span>
          </div>

          <button
            type="button"
            id="btn-cerrar-modal-detalle"
            onClick={handleStopAudioAndClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold transition-colors cursor-pointer text-sm sm:text-base shadow-xs"
          >
            <X className="w-5 h-5 text-white" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
          {/* Header Info */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {book.leido ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black bg-emerald-100 text-emerald-900 border-2 border-emerald-300">
                  <BookCheck className="w-4 h-4 text-[#2ECC71]" />
                  Libro Leído
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 border-2 border-gray-300">
                  Pendiente de leer
                </span>
              )}

              {book.estadoKindle === 'en_kindle' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black bg-blue-100 text-blue-900 border-2 border-blue-300">
                  <Tablet className="w-4 h-4 text-[#3498DB]" />
                  Descargado en Kindle
                </span>
              )}

              {book.estadoKindle === 'por_conseguir' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black bg-orange-100 text-orange-900 border-2 border-orange-300">
                  <Search className="w-4 h-4 text-[#E67E22]" />
                  Por Conseguir (No conseguido)
                </span>
              )}
            </div>

            <h1 className={`font-black text-[#2C3E50] leading-tight mb-2 tracking-tight ${titleSize}`}>
              {book.titulo}
            </h1>

            <p className={`font-bold text-gray-600 ${authorSize}`}>
              Autor / Autora: <span className="text-[#1A1A1A] font-black">{book.autor}</span>
            </p>
          </div>

          {/* Quick metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#F8F9FA] p-4.5 rounded-2xl border-2 border-gray-200">
            <div>
              <span className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
                Lugar del Libro
              </span>
              <p className="font-bold text-[#2C3E50] flex items-center gap-1.5 text-base">
                <MapPin className="w-4 h-4 text-[#3498DB] shrink-0" />
                <span>{book.lugar || 'No especificado'}</span>
              </p>
            </div>

            <div>
              <span className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
                Fecha de Lectura
              </span>
              <p className="font-bold text-[#2C3E50] flex items-center gap-1.5 text-base">
                <Calendar className="w-4 h-4 text-[#3498DB] shrink-0" />
                <span>{book.fecha || 'Sin fecha'}</span>
              </p>
            </div>

            <div>
              <span className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
                Puntuación
              </span>
              <div className="flex items-center gap-2">
                {book.ratingStars > 0 && (
                  <div className="flex text-[#F1C40F]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < book.ratingStars
                            ? 'fill-[#F1C40F] text-[#F1C40F]'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
                <span className="font-extrabold text-[#2C3E50] text-sm">
                  {book.calificacionRaw || (book.ratingStars ? `${book.ratingStars}/5` : 'Sin calificar')}
                </span>
              </div>
            </div>
          </div>

          {/* Audio Reader banner */}
          <div className="bg-[#ECF0F1] p-4 rounded-2xl border-l-8 border-[#3498DB] border-2 border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="text-center sm:text-left">
              <span className="font-black text-[#2C3E50] block text-base sm:text-lg">
                Lectura en voz alta
              </span>
              <span className="text-xs sm:text-sm text-gray-600 font-semibold">
                Escucha el título, autor y tu comentario sin cansar la vista
              </span>
            </div>

            <button
              type="button"
              id="btn-lectura-audio-completa"
              onClick={handleSpeak}
              className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                isPlayingAudio
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-[#3498DB] hover:bg-[#2980B9] text-white'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Square className="w-5 h-5 fill-white" />
                  <span>Detener lectura</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5" />
                  <span>Escuchar ahora</span>
                </>
              )}
            </button>
          </div>

          {/* Comment / Review Section */}
          <div className="bg-[#FDFCFB] p-5 sm:p-6 rounded-2xl border-2 border-gray-200 border-l-8 border-[#E67E22] shadow-xs">
            <h2 className="font-black text-[#2C3E50] text-lg sm:text-xl mb-3 flex items-center gap-2">
              <span>Opinión y Resumen del Libro:</span>
            </h2>

            {book.comentario ? (
              <p className={`text-gray-800 font-medium whitespace-pre-wrap ${bodySize}`}>
                {book.comentario}
              </p>
            ) : (
              <p className="text-gray-500 italic text-base">
                No hay anotaciones ni comentarios para este libro todavía.
              </p>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions - ONLY single button: Marcar como no leído (rojizo) o Marcar como leído (verde) */}
        <div className="bg-[#F4F6F7] px-5 sm:px-7 py-4 border-t-2 border-gray-200 flex items-center justify-center">
          {book.leido ? (
            <button
              type="button"
              id="btn-modal-toggle-no-leido"
              onClick={() => onToggleLeido(book)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#E74C3C] hover:bg-[#C0392B] text-white font-black text-base sm:text-lg shadow-md border-b-4 border-[#962D22] active:translate-y-0.5 active:border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Marcar como no leído</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-modal-toggle-leido"
              onClick={() => onToggleLeido(book)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#2E7D52] hover:bg-[#246642] text-white font-black text-base sm:text-lg shadow-md border-b-4 border-[#1B4D31] active:translate-y-0.5 active:border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Marcar como leído</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
