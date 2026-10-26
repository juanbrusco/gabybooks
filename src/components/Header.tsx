import React from 'react';
import { BarChart3, Database, Plus } from 'lucide-react';
import { TextSizeMode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  textSize: TextSizeMode;
  onToggleTextSize: (size: TextSizeMode) => void;
  onOpenAddBook: () => void;
  onOpenStats: () => void;
  onOpenCSV?: () => void;
  totalBooks: number;
  totalLeidos: number;
  totalNoLeidos: number;
  dbConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  textSize,
  onToggleTextSize,
  onOpenAddBook,
  onOpenStats,
  totalBooks,
  totalLeidos,
  totalNoLeidos,
  dbConnected = true,
}) => {
  return (
    <header className="bg-[#2D3E50] text-white border-b-4 border-[#1A252F] shadow-md transition-all">
      {/* Accessibility toolbar - compact */}
      <div className="bg-[#202C39] border-b border-[#1A252F] px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-gray-200">
          <div className="flex items-center gap-2 text-xs md:text-sm font-semibold truncate">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#2ECC71] shrink-0 shadow-xs"></span>
            <span className="truncate">La Biblioteca de Gaby</span>
            <span className="hidden sm:inline text-gray-400">|</span>
            <span className="hidden sm:inline text-gray-200 font-bold">
              {totalLeidos} leídos ({totalNoLeidos} no leídos)
            </span>
            {dbConnected && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">
                <Database className="w-3 h-3" />
                <span>PostgreSQL (Neon)</span>
              </span>
            )}
          </div>

          {/* Actions right: PWA install button + Text size selector */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-gray-300 hidden xs:inline">
                Tamaño:
              </span>
              <div className="inline-flex rounded-lg border border-[#3D5266] bg-[#1A252F] p-0.5 shadow-inner">
                <button
                  type="button"
                  id="btn-font-normal"
                  onClick={() => onToggleTextSize('normal')}
                  className={`px-2.5 py-0.5 text-xs font-black rounded transition-colors cursor-pointer ${
                    textSize === 'normal'
                      ? 'bg-[#3498DB] text-white shadow-xs'
                      : 'text-gray-300 hover:bg-[#2D3E50]'
                  }`}
                  title="Tamaño normal de texto"
                >
                  A
                </button>
                <button
                  type="button"
                  id="btn-font-grande"
                  onClick={() => onToggleTextSize('grande')}
                  className={`px-2.5 py-0.5 text-xs font-black rounded transition-colors cursor-pointer ${
                    textSize === 'grande'
                      ? 'bg-[#3498DB] text-white shadow-xs'
                      : 'text-gray-300 hover:bg-[#2D3E50]'
                  }`}
                  title="Tamaño grande de texto"
                >
                  A+
                </button>
                <button
                  type="button"
                  id="btn-font-extra"
                  onClick={() => onToggleTextSize('extra')}
                  className={`px-2.5 py-0.5 text-xs font-black rounded transition-colors cursor-pointer ${
                    textSize === 'extra'
                      ? 'bg-[#3498DB] text-white shadow-xs'
                      : 'text-gray-300 hover:bg-[#2D3E50]'
                  }`}
                  title="Tamaño muy grande de texto"
                >
                  A++
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation & actions - compact with title in single line and 2 equal buttons */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
          {/* Title in single line, no book icon */}
          <div className="min-w-0">
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-white tracking-tight whitespace-nowrap truncate">
              La Biblioteca de Gaby
            </h1>
          </div>

          {/* Action buttons: Resumen and Agregar Libro occupying equal width side-by-side */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              id="btn-ver-resumen"
              onClick={onOpenStats}
              className="flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl border-2 border-[#3E5265] bg-[#1F2C3A] hover:bg-[#243444] text-white font-bold transition-all shadow-sm text-xs sm:text-sm cursor-pointer whitespace-nowrap"
              title="Ver estadísticas y autores favoritos"
            >
              <BarChart3 className="w-4 h-4 text-[#3498DB] shrink-0" />
              <span>Resumen</span>
            </button>

            <button
              type="button"
              id="btn-agregar-libro"
              onClick={onOpenAddBook}
              className="flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl bg-[#E67E22] hover:bg-[#D35400] text-white text-xs sm:text-sm font-bold shadow-md border-b-4 border-[#A04000] active:translate-y-0.5 active:border-b-2 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Agregar Libro</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
