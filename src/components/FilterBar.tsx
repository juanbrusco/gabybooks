import React, { useState } from 'react';
import { Search, X, MapPin, User, ArrowUpDown, Mic, MicOff } from 'lucide-react';
import { TextSizeMode } from '../types';
import { AutocompleteSelect } from './AutocompleteSelect';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedAuthor: string;
  onAuthorChange: (author: string) => void;
  selectedPlace: string;
  onPlaceChange: (place: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  allAuthors: { name: string; count: number }[];
  allPlaces: { name: string; count: number }[];
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  textSize: TextSizeMode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedAuthor,
  onAuthorChange,
  selectedPlace,
  onPlaceChange,
  sortBy,
  onSortChange,
  allAuthors,
  allPlaces,
  onResetFilters,
  hasActiveFilters,
  textSize,
}) => {
  const [isListening, setIsListening] = useState(false);

  const startVoiceSearch = () => {
    // Web Speech API
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Tu navegador no soporta búsqueda por voz. Puedes escribir en la casilla de búsqueda.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onSearchChange(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const inputClass =
    textSize === 'extra'
      ? 'text-xl py-3.5 px-4'
      : textSize === 'grande'
      ? 'text-lg py-3 px-3.5'
      : 'text-base py-2.5 px-3';

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-gray-200 shadow-sm mb-6">
      <div className="flex flex-col gap-4">
        {/* Main Search Input */}
        <div className="relative flex items-center">
          <div className="absolute left-4 pointer-events-none text-gray-500">
            <Search className="w-6 h-6" />
          </div>
          <input
            type="text"
            id="input-buscar-libros"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por título, autor o lugar (ej: Megan Maxwell, Texas, Escocia...)"
            className={`w-full pl-13 pr-24 rounded-xl border-2 border-gray-300 bg-[#F8F9FA] text-[#1A1A1A] placeholder-gray-400 focus:border-[#3498DB] focus:bg-white focus:outline-none transition-all shadow-xs font-semibold ${inputClass}`}
          />

          <div className="absolute right-3 flex items-center gap-1">
            {searchTerm && (
              <button
                type="button"
                id="btn-limpiar-busqueda"
                onClick={() => onSearchChange('')}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                title="Borrar texto"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              id="btn-busqueda-voz"
              onClick={startVoiceSearch}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-[#3498DB] hover:bg-blue-50'
              }`}
              title="Buscar dictando por voz"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Author Autocomplete Selector */}
          <AutocompleteSelect
            id="select-autor-autocomplete"
            label="Autor / Autora:"
            icon={User}
            value={selectedAuthor}
            onChange={onAuthorChange}
            options={allAuthors}
            placeholder="Buscar o elegir autor..."
            allLabel={`Todos los autores (${allAuthors.length})`}
            textSize={textSize}
          />

          {/* Place Autocomplete Selector */}
          <AutocompleteSelect
            id="select-lugar-autocomplete"
            label="Lugar del libro:"
            icon={MapPin}
            value={selectedPlace}
            onChange={onPlaceChange}
            options={allPlaces}
            placeholder="Buscar o elegir lugar..."
            allLabel="Cualquier lugar / país"
            textSize={textSize}
          />

          {/* Sort By */}
          <div className="flex flex-col gap-1">
            <label htmlFor="select-orden" className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#3498DB]" />
              Ordenar por:
            </label>
            <select
              id="select-orden"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full bg-[#F8F9FA] border-2 border-gray-300 rounded-xl px-3 py-2 text-sm md:text-base font-bold text-[#2C3E50] focus:outline-none focus:border-[#3498DB] focus:bg-white transition-colors cursor-pointer"
            >
              <option value="recientes">Más recientes anotados</option>
              <option value="calificacion">Mejor calificados (estrellas)</option>
              <option value="titulo_az">Título (de la A a la Z)</option>
              <option value="autor_az">Autor (de la A a la Z)</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            {hasActiveFilters ? (
              <button
                type="button"
                id="btn-restablecer-filtros"
                onClick={onResetFilters}
                className="w-full py-2.5 px-3 rounded-xl bg-[#ECF0F1] hover:bg-gray-200 border-2 border-gray-300 text-[#2C3E50] font-bold text-sm md:text-base flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <X className="w-4 h-4" />
                <span>Limpiar filtros</span>
              </button>
            ) : (
              <div className="text-xs text-gray-500 font-semibold py-2 px-1 text-center w-full">
                Filtros listos
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
