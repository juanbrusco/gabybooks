import React, { useState, useEffect, useMemo } from 'react';
import { Book, TabType, TextSizeMode } from './types';
import { Header } from './components/Header';
import { TabsNavigation } from './components/TabsNavigation';
import { FilterBar } from './components/FilterBar';
import { BookCard } from './components/BookCard';
import { BookDetailModal } from './components/BookDetailModal';
import { BookFormModal } from './components/BookFormModal';
import { ImportExportModal } from './components/ImportExportModal';
import { StatsDrawer } from './components/StatsDrawer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { BookOpen, Plus, Loader2, Sparkles, Volume2, CheckCircle2, Search, FileSpreadsheet, Database, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  fetchBooks,
  createBook,
  updateBook,
  deleteBook,
  importBatchBooks,
  seedInitialBooks,
} from './services/api';

const STORAGE_KEY = 'mis_libros_lectura_v1';
const TEXT_SIZE_KEY = 'mis_libros_text_size';
const PAGE_SIZE = 12;

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('libros');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('');
  const [sortBy, setSortBy] = useState('recientes');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllManually, setShowAllManually] = useState(false);

  // Accessibility
  const [textSize, setTextSize] = useState<TextSizeMode>('normal');

  // Modals
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formInitialLeido, setFormInitialLeido] = useState<boolean | undefined>(undefined);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Load saved text size
  useEffect(() => {
    const savedSize = localStorage.getItem(TEXT_SIZE_KEY) as TextSizeMode;
    if (savedSize && ['normal', 'grande', 'extra'].includes(savedSize)) {
      setTextSize(savedSize);
    }
  }, []);

  const handleToggleTextSize = (size: TextSizeMode) => {
    setTextSize(size);
    localStorage.setItem(TEXT_SIZE_KEY, size);
  };

  // Initial Data Loading from NeonDB
  useEffect(() => {
    const loadBooksFromDatabase = async () => {
      setIsLoading(true);
      try {
        const data = await fetchBooks();
        setBooks(data);
        setDbConnected(true);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.error('Error cargando libros de NeonDB:', err);
        setDbConnected(false);
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setBooks(parsed);
            }
          } catch (e) {
            console.error(e);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadBooksFromDatabase();
  }, []);

  // Restore original dataset in NeonDB
  const handleRestoreOriginal = async () => {
    setIsLoading(true);
    try {
      const seeded = await seedInitialBooks();
      setBooks(seeded);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      showToast('Se restauró el catálogo inicial en NeonDB.');
    } catch (err) {
      console.error(err);
      showToast('Error al restaurar catálogo inicial.');
    } finally {
      setIsLoading(false);
    }
  };

  // Import new list into NeonDB
  const handleImportNewBooks = async (imported: Book[], mode: 'replace' | 'merge') => {
    setIsLoading(true);
    try {
      await importBatchBooks(imported, mode);
      const updated = await fetchBooks();
      setBooks(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      showToast(`Se importaron ${imported.length} libros en NeonDB.`);
    } catch (err: any) {
      console.error(err);
      showToast('Error al importar libros a la base de datos: ' + (err.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  // TTS Helper
  const handlePlayTTS = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Tu navegador no soporta lectura en voz alta.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    showToast('Leyendo en voz alta...');
  };

  // Book modification handlers
  const handleSaveBook = async (bookData: Omit<Book, 'id'>, id?: string) => {
    let finalData = { ...bookData };
    if (id) {
      // Edit existing: if leido, automatically mark as descargado
      if (finalData.leido) {
        finalData.estadoKindle = 'en_kindle';
        finalData.descargadoRaw = 'si';
      }
      const previous = [...books];
      // Optimistic update
      setBooks(books.map((b) => (b.id === id ? { ...b, ...finalData } : b)));
      if (selectedBook && selectedBook.id === id) {
        setSelectedBook({ ...selectedBook, ...finalData });
      }

      try {
        const updated = await updateBook(id, finalData);
        setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
        if (selectedBook && selectedBook.id === id) {
          setSelectedBook(updated);
        }
        showToast('¡Cambios guardados en NeonDB!');
      } catch (err: any) {
        console.error('Error al actualizar libro en NeonDB:', err);
        setBooks(previous);
        showToast('Error al guardar en la base de datos: ' + (err.message || ''));
      }
    } else {
      // Add new: automatically mark as descargado
      finalData.estadoKindle = 'en_kindle';
      finalData.descargadoRaw = 'si';

      try {
        const created = await createBook(finalData);
        setBooks((prev) => [created, ...prev]);
        showToast('¡Libro añadido exitosamente a NeonDB!');
      } catch (err: any) {
        console.error('Error al crear libro en NeonDB:', err);
        showToast('Error al guardar libro en NeonDB: ' + (err.message || ''));
      }
    }
  };

  const handleDeleteBook = async (id: string) => {
    const previous = [...books];
    setBooks(books.filter((b) => b.id !== id));
    if (selectedBook && selectedBook.id === id) {
      setSelectedBook(null);
    }

    try {
      await deleteBook(id);
      showToast('Libro eliminado de NeonDB.');
    } catch (err: any) {
      console.error('Error al eliminar libro de NeonDB:', err);
      setBooks(previous);
      showToast('Error al eliminar libro de la base de datos.');
    }
  };

  // Optimistic patch shared by the toggles: applies it, persists it, and reverts the patched fields on failure
  const patchBook = async (book: Book, patch: Partial<Book>, successMsg: string) => {
    const apply = (p: Partial<Book>) => {
      setBooks((prev) => prev.map((b) => (b.id === book.id ? { ...b, ...p } : b)));
      setSelectedBook((prev) => (prev && prev.id === book.id ? { ...prev, ...p } : prev));
    };
    const previous = Object.fromEntries(
      Object.keys(patch).map((k) => [k, book[k as keyof Book]])
    ) as Partial<Book>;

    apply(patch);
    try {
      await updateBook(book.id, patch);
      showToast(successMsg);
    } catch (err: any) {
      console.error('Error al actualizar libro en NeonDB:', err);
      apply(previous);
      showToast('Error al guardar en la base de datos: ' + (err.message || ''));
    }
  };

  const handleToggleKindle = (book: Book) => {
    const newEstado = book.estadoKindle === 'en_kindle' ? 'no_descargado' : 'en_kindle';
    return patchBook(
      book,
      { estadoKindle: newEstado, descargadoRaw: newEstado === 'en_kindle' ? 'si' : 'no' },
      newEstado === 'en_kindle'
        ? `"${book.titulo}" marcado como descargado en Kindle.`
        : `"${book.titulo}" retirado de Kindle.`
    );
  };

  const handleToggleLeido = (book: Book) => {
    const willBeLeido = !book.leido;
    return patchBook(
      book,
      {
        leido: willBeLeido,
        ...(willBeLeido ? { estadoKindle: 'en_kindle' as const, descargadoRaw: 'si' } : {}),
      },
      willBeLeido
        ? `¡Marcaste "${book.titulo}" como leído!`
        : `"${book.titulo}" marcado como no leído.`
    );
  };

  const handleSetEstadoKindle = (
    book: Book,
    estado: 'en_kindle' | 'por_conseguir' | 'no_descargado'
  ) => {
    let descargadoRaw = 'no';
    if (estado === 'en_kindle') descargadoRaw = 'si';
    else if (estado === 'por_conseguir') descargadoRaw = 'no conseguido';

    return patchBook(book, { estadoKindle: estado, descargadoRaw }, 'Estado de Kindle actualizado.');
  };

  // Filtered lists and counters
  const counts = useMemo(() => {
    return {
      libros: books.filter((b) => b.leido).length,
      no_leidos: books.filter((b) => b.estadoKindle === 'en_kindle' && !b.leido).length,
      todos: books.length,
    };
  }, [books]);

  // Unique authors and places
  const allAuthors = useMemo(() => {
    const map: Record<string, number> = {};
    books.forEach((b) => {
      if (b.autor && b.autor !== 'Autor Desconocido') {
        map[b.autor] = (map[b.autor] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [books]);

  const allPlaces = useMemo(() => {
    const map: Record<string, number> = {};
    books.forEach((b) => {
      if (b.lugar) {
        const parts = b.lugar.split(/[\/,]/).map((p) => p.trim());
        parts.forEach((p) => {
          if (p.length > 1) {
            map[p] = (map[p] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [books]);

  // Filtered books based on tab, search, author, place, sort
  const filteredBooks = useMemo(() => {
    return books
      .filter((b) => {
        // Tab filter: 'no_leidos' = descargados pero no leídos aún
        if (activeTab === 'no_leidos') {
          return b.estadoKindle === 'en_kindle' && !b.leido;
        }

        // Tab filter: 'libros' = leídos
        if (!b.leido) return false;

        // Search term filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase().trim();
          const matchTitle = b.titulo.toLowerCase().includes(term);
          const matchAuthor = b.autor.toLowerCase().includes(term);
          const matchPlace = b.lugar.toLowerCase().includes(term);
          const matchComment = b.comentario.toLowerCase().includes(term);
          if (!matchTitle && !matchAuthor && !matchPlace && !matchComment) {
            return false;
          }
        }

        // Selected author filter
        if (selectedAuthor && b.autor !== selectedAuthor) {
          return false;
        }

        // Selected place filter
        if (selectedPlace && !b.lugar.toLowerCase().includes(selectedPlace.toLowerCase())) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'calificacion') {
          return b.ratingStars - a.ratingStars;
        }
        if (sortBy === 'titulo_az') {
          return a.titulo.localeCompare(b.titulo);
        }
        if (sortBy === 'autor_az') {
          return a.autor.localeCompare(b.autor);
        }
        // default: recientes (preserve default order or id)
        return 0;
      });
  }, [books, activeTab, searchTerm, selectedAuthor, selectedPlace, sortBy]);

  const hasActiveFilters = Boolean(searchTerm.trim() || selectedAuthor || selectedPlace);
  const shouldShowList = activeTab === 'no_leidos' ? true : (hasActiveFilters || showAllManually);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedAuthor('');
    setSelectedPlace('');
    setShowAllManually(false);
    setCurrentPage(1);
  };

  // Pagination calculation (PAGE_SIZE = 12)
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredBooks.length);
  const displayedBooks = filteredBooks.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F7] text-[#1A1A1A]">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2D3E50] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border-2 border-[#1A252F] animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0" />
          <span className="font-black text-sm sm:text-base">{toastMessage}</span>
        </div>
      )}

      {/* Main Header with font controls & quick actions */}
      <Header
        textSize={textSize}
        onToggleTextSize={handleToggleTextSize}
        onOpenAddBook={() => {
          setEditingBook(null);
          setFormInitialLeido(undefined);
          setIsFormOpen(true);
        }}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenCSV={() => setIsImportExportOpen(true)}
        totalBooks={counts.todos}
        totalLeidos={counts.libros}
        totalNoLeidos={counts.no_leidos}
        dbConnected={dbConnected}
      />

      {/* Section Tabs: Libros and No Leídos */}
      <TabsNavigation
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          resetFilters();
          setShowAllManually(false);
          setCurrentPage(1);
        }}
        counts={{
          libros: counts.libros,
          no_leidos: counts.no_leidos,
        }}
        textSize={textSize}
      />

      {/* Main content container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Search and Filters - only in Libros section */}
        {activeTab === 'libros' && (
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            selectedAuthor={selectedAuthor}
            onAuthorChange={(auth) => {
              setSelectedAuthor(auth);
              setCurrentPage(1);
            }}
            selectedPlace={selectedPlace}
            onPlaceChange={(plc) => {
              setSelectedPlace(plc);
              setCurrentPage(1);
            }}
            sortBy={sortBy}
            onSortChange={(sort) => {
              setSortBy(sort);
              setCurrentPage(1);
            }}
            allAuthors={allAuthors}
            allPlaces={allPlaces}
            onResetFilters={resetFilters}
            hasActiveFilters={hasActiveFilters}
            textSize={textSize}
          />
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-[#3498DB] animate-spin" />
            <p className="text-xl font-black text-[#2C3E50]">
              Cargando tu biblioteca de libros...
            </p>
          </div>
        ) : !shouldShowList ? (
          /* Initial State: Clean search prompt - no book list displayed by default */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border-2 border-gray-200 max-w-xl mx-auto my-8 space-y-4 shadow-sm animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-[#ECF0F1] text-[#3498DB] flex items-center justify-center mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-[#2C3E50]">
              ¿Qué libro buscas hoy?
            </h2>
            <p className="text-base text-gray-600 font-medium leading-relaxed">
              Escribe en el buscador de arriba el título o autor, o selecciona un Autor o Lugar en los filtros para ver los libros.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                id="btn-ver-todos-inicial"
                onClick={() => setShowAllManually(true)}
                className="px-5 py-2.5 rounded-xl bg-white border-2 border-gray-300 text-[#2C3E50] font-black hover:bg-gray-100 transition-colors cursor-pointer text-sm sm:text-base shadow-xs"
              >
                Ver todo el catálogo de Libros ({counts.libros})
              </button>
            </div>
          </div>
        ) : filteredBooks.length === 0 ? (
          /* Empty state when search or filter returns 0 results */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border-2 border-gray-200 max-w-xl mx-auto my-8 space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#ECF0F1] text-[#2C3E50] flex items-center justify-center mx-auto">
              {activeTab === 'no_leidos' ? (
                <CheckCircle2 className="w-8 h-8 text-[#2ECC71]" />
              ) : (
                <BookOpen className="w-8 h-8 text-[#3498DB]" />
              )}
            </div>
            <h2 className="text-2xl font-black text-[#2C3E50]">
              {activeTab === 'no_leidos'
                ? '¡Estás al día! No tienes libros pendientes'
                : 'No encontramos libros con estos filtros'}
            </h2>
            <p className="text-base text-gray-600 font-medium leading-relaxed">
              {activeTab === 'no_leidos'
                ? 'No hay libros descargados pendientes de lectura en este momento. Al añadir un libro nuevo, quedará guardado aquí automáticamente.'
                : hasActiveFilters
                ? 'Probá borrando el texto de búsqueda o quitando los filtros para ver más libros.'
                : 'Todavía no hay libros en esta sección.'}
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              {activeTab === 'libros' && hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-xl bg-[#2C3E50] text-white font-bold hover:bg-[#1A252F] transition-colors cursor-pointer text-base"
                >
                  Limpiar filtros
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditingBook(null);
                  setIsFormOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#E67E22] text-white font-black hover:bg-[#D35400] transition-colors cursor-pointer text-base border-b-4 border-[#A04000] shadow-sm"
              >
                + Añadir un libro nuevo
              </button>
            </div>
          </div>
        ) : (
          /* Book Cards Grid */
          <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-base sm:text-lg font-black text-[#2C3E50]">
                  {activeTab === 'no_leidos' ? (
                    <>
                      {filteredBooks.length > PAGE_SIZE
                        ? `Libros pendientes (${startIndex + 1}–${endIndex} de ${filteredBooks.length})`
                        : `Libros no leídos descargados (${filteredBooks.length})`}
                    </>
                  ) : (
                    <>
                      {filteredBooks.length > PAGE_SIZE
                        ? `Mostrando ${startIndex + 1}–${endIndex} de ${filteredBooks.length} libros`
                        : `Mostrando ${filteredBooks.length} de ${filteredBooks.length} libros`}
                      {selectedAuthor ? ` de ${selectedAuthor}` : ''}
                      {selectedPlace ? ` en ${selectedPlace}` : ''}
                    </>
                  )}
                </span>

                {totalPages > 1 && (
                  <span className="text-xs font-black bg-[#2D3E50]/10 text-[#2D3E50] px-2.5 py-1 rounded-lg">
                    Página {safeCurrentPage} de {totalPages}
                  </span>
                )}
              </div>

              {activeTab === 'libros' && !hasActiveFilters && showAllManually && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAllManually(false);
                    setCurrentPage(1);
                  }}
                  className="text-xs sm:text-sm font-bold text-gray-500 hover:text-[#2C3E50] cursor-pointer underline"
                >
                  Ocultar lista
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {displayedBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isNoLeidosSection={activeTab === 'no_leidos'}
                  onSelect={(b) => {
                    setEditingBook(b);
                    setFormInitialLeido(undefined);
                    setIsFormOpen(true);
                  }}
                  onEdit={(b) => {
                    setEditingBook(b);
                    setFormInitialLeido(undefined);
                    setIsFormOpen(true);
                  }}
                  onMarkLeidoModal={(b) => {
                    setEditingBook(b);
                    setFormInitialLeido(true);
                    setIsFormOpen(true);
                  }}
                  onPlayTTS={handlePlayTTS}
                  textSize={textSize}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav
                aria-label="Paginación de libros"
                className="mt-8 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="text-xs sm:text-sm font-bold text-gray-600 order-2 sm:order-1">
                  Mostrando libros{' '}
                  <span className="font-extrabold text-[#2C3E50]">
                    {startIndex + 1} al {endIndex}
                  </span>{' '}
                  de un total de{' '}
                  <span className="font-extrabold text-[#2C3E50]">
                    {filteredBooks.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
                  {/* Botón Anterior */}
                  <button
                    type="button"
                    id="btn-pag-anterior"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border-2 border-gray-300 bg-white font-black text-xs sm:text-sm text-[#2C3E50] hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>

                  {/* Números de página */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => {
                      const isCurrent = pageNum === safeCurrentPage;
                      const isNear = Math.abs(pageNum - safeCurrentPage) <= 1;
                      const isEnd = pageNum === 1 || pageNum === totalPages;

                      if (!isNear && !isEnd && totalPages > 6) {
                        if (pageNum === 2 || pageNum === totalPages - 1) {
                          return (
                            <span
                              key={pageNum}
                              className="px-1 text-gray-400 font-bold text-xs select-none"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center border-2 ${
                            isCurrent
                              ? 'bg-[#2D3E50] border-[#1A252F] text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Botón Siguiente */}
                  <button
                    type="button"
                    id="btn-pag-siguiente"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border-2 border-gray-300 bg-white font-black text-xs sm:text-sm text-[#2C3E50] hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </main>

      {/* Floating Add Book Button for mobile */}
      <div className="fixed bottom-6 right-6 md:hidden z-40">
        <button
          type="button"
          id="btn-floating-add"
          onClick={() => {
            setEditingBook(null);
            setIsFormOpen(true);
          }}
          className="w-14 h-14 rounded-full bg-[#E67E22] text-white flex items-center justify-center shadow-xl hover:bg-[#D35400] transition-colors cursor-pointer border-2 border-[#A04000]"
          title="Añadir Libro"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Discreet Footer for Administrator / Son */}
      <footer className="mt-auto border-t-2 border-gray-200 bg-white py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-500">
          <div className="flex items-center gap-2 font-bold text-gray-600">
            <span>Mi Biblioteca Personal</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>NeonDB PostgreSQL</span>
            </span>
          </div>

          <button
            type="button"
            id="btn-admin-excel-csv"
            onClick={() => setIsImportExportOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8F9FA] hover:bg-gray-200 border-2 border-gray-300 text-gray-700 font-bold transition-all shadow-xs cursor-pointer text-xs"
            title="Descargar o cargar archivo CSV de libros"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#2ECC71]" />
            <span>Descargar / Cargar CSV</span>
          </button>
        </div>
      </footer>

      {/* Modals */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onEdit={(b) => {
            setEditingBook(b);
            setFormInitialLeido(undefined);
            setIsFormOpen(true);
          }}
          onDelete={handleDeleteBook}
          onToggleLeido={handleToggleLeido}
          onSetEstadoKindle={handleSetEstadoKindle}
          textSize={textSize}
        />
      )}

      <BookFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBook(null);
          setFormInitialLeido(undefined);
        }}
        onSave={handleSaveBook}
        onDelete={handleDeleteBook}
        editingBook={editingBook}
        initialLeido={formInitialLeido}
        existingAuthors={allAuthors.map((a) => a.name)}
        textSize={textSize}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        books={books}
        onImportNewBooks={handleImportNewBooks}
        onRestoreOriginal={handleRestoreOriginal}
      />

      <StatsDrawer
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        books={books}
        onSelectAuthor={(author) => {
          setSelectedAuthor(author);
          setActiveTab('libros');
          setShowAllManually(true);
        }}
        onSelectPlace={(place) => {
          setSelectedPlace(place);
          setActiveTab('libros');
          setShowAllManually(true);
        }}
        textSize={textSize}
      />

      <OfflineIndicator />
    </div>
  );
}
