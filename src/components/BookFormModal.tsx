import React, { useState, useEffect, useMemo } from 'react';
import { X, Star, MapPin, Calendar, Mic, MicOff, Check, AlertCircle, Trash2 } from 'lucide-react';
import { Book, TextSizeMode } from '../types';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookData: Omit<Book, 'id'>, id?: string) => void;
  onDelete?: (id: string) => void;
  editingBook?: Book | null;
  initialLeido?: boolean;
  existingAuthors?: string[];
  textSize: TextSizeMode;
}

const toDateInputValue = (str: string): string => {
  if (!str) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parts = str.split('/');
  if (parts.length >= 3) {
    const day = parts[0].trim().padStart(2, '0');
    const month = parts[1].trim().padStart(2, '0');
    const yearMatch = parts[2].match(/\d{4}/);
    if (yearMatch) {
      return `${yearMatch[0]}-${month}-${day}`;
    }
  }
  return '';
};

const fromDateInputValue = (isoStr: string): string => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
};

const COMMON_PLACES = [
  'Londres',
  'Madrid',
  'Escocia',
  'Texas',
  'NY',
  'París',
  'Roma',
  'California',
  'Irlanda',
  'Barcelona',
];

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingBook,
  initialLeido,
  existingAuthors = [],
  textSize,
}) => {
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [lugar, setLugar] = useState('');
  const [leido, setLeido] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [calificacionRaw, setCalificacionRaw] = useState('5 fabuloso');
  const [estadoKindle, setEstadoKindle] = useState<'en_kindle' | 'por_conseguir' | 'no_descargado'>('en_kindle');
  const [fecha, setFecha] = useState('');
  const [comentario, setComentario] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Suggestions for author based on user input
  const suggestedAuthors = useMemo(() => {
    const q = autor.trim().toLowerCase();
    if (!q || existingAuthors.length === 0) return [];
    return existingAuthors
      .filter((a) => a.toLowerCase().includes(q) && a.toLowerCase() !== q)
      .slice(0, 8);
  }, [autor, existingAuthors]);

  useEffect(() => {
    if (editingBook) {
      const isTargetLeido = initialLeido !== undefined ? initialLeido : editingBook.leido;
      setTitulo(editingBook.titulo);
      setAutor(editingBook.autor);
      setLugar(editingBook.lugar || '');
      setLeido(isTargetLeido);
      setRatingStars(editingBook.ratingStars || 5);
      setCalificacionRaw(editingBook.calificacionRaw || (editingBook.ratingStars ? `${editingBook.ratingStars} estrellas` : '5 fabuloso'));
      setEstadoKindle(isTargetLeido ? 'en_kindle' : editingBook.estadoKindle);
      if (isTargetLeido && !editingBook.fecha) {
        const today = new Date();
        const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
        setFecha(formattedDate);
      } else {
        setFecha(editingBook.fecha || '');
      }
      setComentario(editingBook.comentario || '');
    } else {
      setTitulo('');
      setAutor('');
      setLugar('');
      setLeido(initialLeido !== undefined ? initialLeido : false);
      setRatingStars(5);
      setCalificacionRaw('5 fabuloso');
      setEstadoKindle('en_kindle');
      // default current date in DD/MM/YYYY format
      const today = new Date();
      const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
      setFecha(formattedDate);
      setComentario('');
    }
    setErrorMessage('');
    setShowDeleteConfirm(false);
  }, [editingBook, isOpen, initialLeido]);

  if (!isOpen) return null;

  const handleStartDictation = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Tu navegador no soporta dictado por voz.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = true;

      setIsDictating(true);

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setComentario((prev) => (prev ? prev + ' ' + currentTranscript : currentTranscript));
      };

      recognition.onerror = () => {
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognition.start();
    } catch {
      setIsDictating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setErrorMessage('Por favor ingresa el título del libro.');
      return;
    }
    if (!autor.trim()) {
      setErrorMessage('Por favor ingresa el nombre del autor o autora.');
      return;
    }

    const isNew = !editingBook;
    const finalEstadoKindle = (isNew || leido) ? 'en_kindle' : (editingBook?.estadoKindle || 'en_kindle');
    const finalDescargadoRaw = finalEstadoKindle === 'en_kindle' ? 'si' : (editingBook?.descargadoRaw || 'no');

    onSave(
      {
        titulo: titulo.trim(),
        autor: autor.trim(),
        lugar: lugar.trim(),
        leido,
        ratingStars: leido ? ratingStars : 0,
        calificacionRaw: leido ? calificacionRaw : '',
        estadoKindle: finalEstadoKindle,
        fecha: fecha.trim(),
        comentario: comentario.trim(),
        descargadoRaw: finalDescargadoRaw,
      },
      editingBook ? editingBook.id : undefined
    );

    onClose();
  };

  const labelSize =
    textSize === 'extra' ? 'text-lg sm:text-xl font-bold' : textSize === 'grande' ? 'text-base sm:text-lg font-bold' : 'text-sm sm:text-base font-bold';

  const inputSize =
    textSize === 'extra' ? 'text-lg p-3.5' : textSize === 'grande' ? 'text-base p-3' : 'text-sm sm:text-base p-2.5';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="modal-formulario-libro"
        className="bg-white rounded-3xl border-2 sm:border-4 border-[#2C3E50] shadow-2xl max-w-2xl w-full overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-[#2D3E50] text-white px-5 sm:px-7 py-4 border-b-4 border-[#1A252F] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-[#E67E22]"></span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {editingBook ? 'Editar Ficha del Libro' : 'Añadir Nuevo Libro a tu Colección'}
            </h2>
          </div>

          <button
            type="button"
            id="btn-cerrar-modal-formulario"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-900 font-bold text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-700" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Título */}
          <div className="space-y-1.5">
            <label htmlFor="input-titulo" className={`text-[#2C3E50] font-black block ${labelSize}`}>
              1. Título del Libro <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="input-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Te esperaré toda mi vida"
              className={`w-full rounded-xl border-2 border-gray-300 bg-[#F8F9FA] text-[#1A1A1A] placeholder-gray-400 focus:border-[#3498DB] focus:bg-white focus:outline-none transition-all font-semibold ${inputSize}`}
              required
            />
          </div>

          {/* Autor */}
          <div className="space-y-1.5">
            <label htmlFor="input-autor" className={`text-[#2C3E50] font-black block ${labelSize}`}>
              2. Autor o Autora <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="input-autor"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              placeholder="Ej: Megan Maxwell, Alice Kellen..."
              className={`w-full rounded-xl border-2 border-gray-300 bg-[#F8F9FA] text-[#1A1A1A] placeholder-gray-400 focus:border-[#3498DB] focus:bg-white focus:outline-none transition-all font-semibold ${inputSize}`}
              required
            />
            {/* Quick chips for suggested authors */}
            {suggestedAuthors.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  Sugerencias:
                </span>
                {suggestedAuthors.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setAutor(sug)}
                    className="px-2.5 py-1 rounded-lg bg-[#ECF0F1] text-xs font-extrabold text-[#2C3E50] hover:bg-gray-200 border border-gray-300 transition-colors cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lugar */}
          <div className="space-y-1.5">
            <label htmlFor="input-lugar" className={`text-[#2C3E50] font-black block ${labelSize}`}>
              3. ¿Dónde transcurre la historia? (Lugar o País)
            </label>
            <input
              type="text"
              id="input-lugar"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              placeholder="Ej: Texas, Escocia, Londres, Madrid, París..."
              className={`w-full rounded-xl border-2 border-gray-300 bg-[#F8F9FA] text-[#1A1A1A] placeholder-gray-400 focus:border-[#3498DB] focus:bg-white focus:outline-none transition-all font-semibold ${inputSize}`}
            />
            {/* Quick chips for places */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Sugerencias:</span>
              {COMMON_PLACES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setLugar(p)}
                  className="px-2.5 py-1 rounded-lg bg-[#ECF0F1] text-xs font-extrabold text-[#2C3E50] hover:bg-gray-200 border border-gray-300 transition-colors cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* ¿Ya lo leíste? */}
          <div className="space-y-3 bg-[#F8F9FA] p-4.5 rounded-2xl border-2 border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`text-[#2C3E50] font-black block ${labelSize}`}>
                4. ¿Ya terminaste de leer este libro?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-leido-si"
                  onClick={() => setLeido(true)}
                  className={`px-4 py-2 rounded-xl font-black text-sm sm:text-base border-2 transition-colors cursor-pointer ${
                    leido
                      ? 'bg-[#2ECC71] border-[#27AE60] text-white shadow-xs'
                      : 'bg-white border-gray-300 text-[#2C3E50] hover:bg-gray-100'
                  }`}
                >
                  ✓ Sí, ya lo leí
                </button>
                <button
                  type="button"
                  id="btn-leido-no"
                  onClick={() => setLeido(false)}
                  className={`px-4 py-2 rounded-xl font-black text-sm sm:text-base border-2 transition-colors cursor-pointer ${
                    !leido
                      ? 'bg-[#2C3E50] border-[#1A252F] text-white shadow-xs'
                      : 'bg-white border-gray-300 text-[#2C3E50] hover:bg-gray-100'
                  }`}
                >
                  Aún no
                </button>
              </div>
            </div>

            {/* If leido: show rating & date */}
            {leido && (
              <div className="pt-3 border-t-2 border-gray-200 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-600 uppercase tracking-wider block">
                    Puntuación (estrellas):
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <button
                        key={stars}
                        type="button"
                        onClick={() => {
                          setRatingStars(stars);
                          const desc =
                            stars === 5
                              ? '5 fabuloso'
                              : stars === 4
                              ? '4 muy bueno'
                              : stars === 3
                              ? '3 lindo'
                              : '0 no me gusto';
                          setCalificacionRaw(desc);
                        }}
                        className={`flex items-center gap-1 px-3 py-2 rounded-xl border-2 font-black text-sm transition-all cursor-pointer ${
                          ratingStars === stars
                            ? 'bg-[#F39C12] border-[#D68910] text-white shadow-sm scale-105'
                            : 'bg-white border-gray-300 text-[#2C3E50] hover:bg-gray-100'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                        <span>{stars}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="input-calificacion-texto" className="text-xs font-bold text-gray-600">
                      Detalle de puntuación (ej: "5 fabuloso", "5 divino+++", "3 lindo"):
                    </label>
                    <input
                      type="text"
                      id="input-calificacion-texto"
                      value={calificacionRaw}
                      onChange={(e) => setCalificacionRaw(e.target.value)}
                      placeholder="5 divino+++"
                      className="w-full rounded-xl border-2 border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-[#1A1A1A] focus:border-[#3498DB] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="input-fecha" className="text-xs font-bold text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#3498DB]" />
                      <span>Fecha de lectura (abre calendario):</span>
                    </label>
                    <input
                      type="date"
                      id="input-fecha"
                      value={toDateInputValue(fecha)}
                      onChange={(e) => {
                        const iso = e.target.value;
                        if (iso) {
                          setFecha(fromDateInputValue(iso));
                        }
                      }}
                      className="w-full rounded-xl border-2 border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-[#1A1A1A] focus:border-[#3498DB] focus:outline-none cursor-pointer"
                    />
                    {fecha && (
                      <span className="text-xs font-semibold text-gray-500 block">
                        Fecha registrada: {fecha}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comentario / Opinión */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="textarea-comentario" className={`text-[#2C3E50] font-black block ${labelSize}`}>
                5. Tu Opinión o Resumen del Libro
              </label>

              <button
                type="button"
                id="btn-dictar-comentario"
                onClick={handleStartDictation}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  isDictating
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-[#ECF0F1] text-[#2C3E50] hover:bg-gray-200 border border-gray-300'
                }`}
                title="Dictar con el micrófono"
              >
                {isDictating ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#3498DB]" />}
                <span>{isDictating ? 'Escuchando...' : 'Hablar para dictar'}</span>
              </button>
            </div>

            <textarea
              id="textarea-comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={5}
              placeholder="Escribí o dictá de qué se trata el libro, qué personajes te gustaron, si lo recomiendas para volver a leer..."
              className="w-full rounded-2xl border-2 border-gray-300 bg-[#F8F9FA] text-[#1A1A1A] placeholder-gray-400 p-4 focus:border-[#3498DB] focus:bg-white focus:outline-none transition-all font-medium text-base leading-relaxed"
            />
          </div>

          {/* Action buttons: GUARDAR, CANCELAR, ELIMINAR (full width) */}
          <div className="pt-4 border-t-2 border-gray-200 w-full flex flex-col sm:flex-row items-stretch gap-2.5 sm:gap-3">
            {/* 1. GUARDAR */}
            <button
              type="submit"
              id="btn-guardar-libro"
              className="flex-1 w-full py-3.5 px-4 rounded-xl bg-[#E67E22] hover:bg-[#D35400] text-white font-black shadow-md border-b-4 border-[#A04000] active:translate-y-0.5 active:border-b-2 transition-all cursor-pointer text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Guardar</span>
            </button>

            {/* 2. CANCELAR */}
            <button
              type="button"
              id="btn-cancelar-formulario"
              onClick={onClose}
              className="flex-1 w-full py-3.5 px-4 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-black hover:bg-gray-100 transition-colors cursor-pointer text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4 text-gray-500" />
              <span>Cancelar</span>
            </button>

            {/* 3. ELIMINAR (only when editing an existing book) */}
            {editingBook && onDelete && (
              showDeleteConfirm ? (
                <div className="flex-1 w-full p-2 bg-red-50 border-2 border-red-300 rounded-xl flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-black text-red-700 pl-1">¿Eliminar?</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      id="btn-confirmar-eliminar"
                      onClick={() => {
                        onDelete(editingBook.id);
                        setShowDeleteConfirm(false);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm rounded-lg transition-colors cursor-pointer"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  id="btn-eliminar-libro-modal"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 w-full py-3.5 px-4 rounded-xl border-2 border-red-300 bg-red-50 text-red-700 font-black hover:bg-red-100 transition-colors cursor-pointer text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>Eliminar</span>
                </button>
              )
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
