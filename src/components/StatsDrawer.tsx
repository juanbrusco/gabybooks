import React from 'react';
import { X, BookCheck, Tablet, Search, Star, MapPin, User, Award, Library } from 'lucide-react';
import { Book, TextSizeMode } from '../types';

interface StatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onSelectAuthor: (author: string) => void;
  onSelectPlace: (place: string) => void;
  textSize: TextSizeMode;
}

export const StatsDrawer: React.FC<StatsDrawerProps> = ({
  isOpen,
  onClose,
  books,
  onSelectAuthor,
  onSelectPlace,
  textSize,
}) => {
  if (!isOpen) return null;

  const total = books.length;
  const leidos = books.filter((b) => b.leido).length;
  const enKindle = books.filter((b) => b.estadoKindle === 'en_kindle').length;
  const porConseguir = books.filter((b) => b.estadoKindle === 'por_conseguir').length;
  const favoritos = books.filter((b) => b.ratingStars === 5 || b.calificacionRaw.includes('5')).length;

  // Author frequency
  const authorCounts: Record<string, number> = {};
  books.forEach((b) => {
    if (b.autor && b.autor !== 'Autor Desconocido') {
      authorCounts[b.autor] = (authorCounts[b.autor] || 0) + 1;
    }
  });

  const topAuthors = Object.entries(authorCounts)
    .map(([autor, count]) => ({ autor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Places frequency
  const placeCounts: Record<string, number> = {};
  books.forEach((b) => {
    if (b.lugar) {
      // Split by comma or slash if multiple
      const places = b.lugar.split(/[\/,]/).map((p) => p.trim());
      places.forEach((p) => {
        if (p.length > 1) {
          placeCounts[p] = (placeCounts[p] || 0) + 1;
        }
      });
    }
  });

  const topPlaces = Object.entries(placeCounts)
    .map(([lugar, count]) => ({ lugar, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="modal-resumen-estadisticas"
        className="bg-white rounded-3xl border-2 sm:border-4 border-[#2C3E50] shadow-2xl max-w-2xl w-full overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-[#2D3E50] text-white px-5 sm:px-7 py-4 border-b-4 border-[#1A252F] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="w-6 h-6 text-[#E67E22]" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Tu Resumen de Lectura
            </h2>
          </div>

          <button
            type="button"
            id="btn-cerrar-modal-resumen"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
          {/* High level metrics cards: only Libros Leídos and Total con 5 Estrellas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-[#F8F9FA] p-5 rounded-2xl border-2 border-gray-200 border-t-4 border-[#2ECC71] text-center shadow-xs">
              <BookCheck className="w-7 h-7 text-[#2ECC71] mx-auto mb-2" />
              <span className="text-3xl sm:text-4xl font-black text-[#2C3E50] block mb-1">
                {leidos}
              </span>
              <span className="text-sm sm:text-base font-bold text-gray-700">
                Libros Leídos
              </span>
            </div>

            <div className="bg-[#F8F9FA] p-5 rounded-2xl border-2 border-gray-200 border-t-4 border-[#F39C12] text-center shadow-xs">
              <Star className="w-7 h-7 text-[#F39C12] fill-[#F39C12] mx-auto mb-2" />
              <span className="text-3xl sm:text-4xl font-black text-[#2C3E50] block mb-1">
                {favoritos}
              </span>
              <span className="text-sm sm:text-base font-bold text-gray-700">
                Total con 5 Estrellas
              </span>
            </div>
          </div>

          {/* Autores favoritos */}
          <div className="bg-[#F8F9FA] p-5 rounded-2xl border-2 border-gray-200 shadow-xs">
            <h3 className="text-lg font-black text-[#2C3E50] mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-[#3498DB]" />
              <span>Tus Autores y Autoras Más Leídos</span>
            </h3>
            <p className="text-xs text-gray-500 font-semibold mb-3">
              Toca el nombre de cualquier autor para ver todos sus libros directamente:
            </p>

            <div className="flex flex-wrap gap-2">
              {topAuthors.map((item) => (
                <button
                  key={item.autor}
                  type="button"
                  onClick={() => {
                    onSelectAuthor(item.autor);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border-2 border-gray-300 text-sm font-bold text-[#2C3E50] flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <span>{item.autor}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#2C3E50] text-xs font-black text-white">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Lugares donde transcurren las historias */}
          <div className="bg-[#F8F9FA] p-5 rounded-2xl border-2 border-gray-200 shadow-xs">
            <h3 className="text-lg font-black text-[#2C3E50] mb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#E67E22]" />
              <span>Lugares Favoritos de tus Historias</span>
            </h3>
            <p className="text-xs text-gray-500 font-semibold mb-3">
              Toca un lugar para filtrar los libros ambientados allí:
            </p>

            <div className="flex flex-wrap gap-2">
              {topPlaces.map((item) => (
                <button
                  key={item.lugar}
                  type="button"
                  onClick={() => {
                    onSelectPlace(item.lugar);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border-2 border-gray-300 text-sm font-bold text-[#2C3E50] flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#E67E22]" />
                  <span>{item.lugar}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#2C3E50] text-xs font-black text-white">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F4F6F7] px-5 sm:px-7 py-4 border-t-2 border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-[#2C3E50] hover:bg-[#1A252F] text-white font-black transition-colors cursor-pointer text-base shadow-sm border-b-4 border-[#1A252F]"
          >
            Cerrar Resumen
          </button>
        </div>
      </div>
    </div>
  );
};
