import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Book } from '../types';
import {
  exportBooksToCSV,
  downloadCSVFile,
  parseCSVToBooks,
} from '../utils/csvHelper';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onImportNewBooks: (importedBooks: Book[], mode: 'replace' | 'merge') => void;
  onRestoreOriginal: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  books,
  onImportNewBooks,
  onRestoreOriginal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncMode, setSyncMode] = useState<'replace' | 'merge'>('replace');
  const [importNotice, setImportNotice] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    const csvData = exportBooksToCSV(books);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSVFile(csvData, `mis_libros_${dateStr}.csv`);
    setImportNotice({
      type: 'success',
      message: `¡Archivo CSV descargado con éxito! Contiene los ${books.length} libros de tu biblioteca.`,
    });
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSVToBooks(text);
        if (parsed.length === 0) {
          setImportNotice({
            type: 'error',
            message:
              'No se encontraron libros válidos en el archivo seleccionado. Asegúrate de que incluya las columnas TÍTULO y AUTOR.',
          });
          return;
        }

        onImportNewBooks(parsed, syncMode);
        setImportNotice({
          type: 'success',
          message: `¡Se cargaron exitosamente ${parsed.length} libros desde tu archivo CSV!`,
          details:
            syncMode === 'replace'
              ? 'El catálogo anterior fue reemplazado por los datos de este archivo.'
              : 'Los libros fueron combinados con tu biblioteca actual sin duplicados.',
        });
      } catch (err) {
        setImportNotice({
          type: 'error',
          message:
            'Hubo un error al leer el archivo. Asegúrate de que sea un archivo de texto con formato CSV válido.',
        });
      }
    };

    reader.readAsText(file, 'UTF-8');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="modal-importar-exportar-csv"
        className="bg-white rounded-3xl border-2 sm:border-4 border-[#2C3E50] shadow-2xl max-w-xl w-full overflow-hidden my-auto flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-[#2D3E50] text-white px-5 sm:px-7 py-4 border-b-4 border-[#1A252F] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-[#2ECC71]" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Catálogo y Archivo CSV
            </h2>
          </div>

          <button
            type="button"
            id="btn-cerrar-modal-csv"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-7 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Notifications */}
          {importNotice && (
            <div
              className={`p-4 rounded-2xl border-2 flex flex-col gap-1 text-sm ${
                importNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                  : 'bg-red-50 border-red-300 text-red-900 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5 font-bold">
                {importNotice.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <span>{importNotice.message}</span>
              </div>
              {importNotice.details && (
                <p className="text-xs text-gray-700 mt-1 pl-7 leading-relaxed font-normal">
                  {importNotice.details}
                </p>
              )}
            </div>
          )}

          {/* Option 1: Download current library */}
          <div className="bg-[#F8F9FA] p-5 rounded-2xl border-2 border-gray-200 border-l-8 border-[#2ECC71] space-y-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#2ECC71] text-white shrink-0">
                <Download className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-[#2C3E50] text-base sm:text-lg">
                  Descargar archivo CSV (Exportar)
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5">
                  Genera una copia en archivo CSV con todos los {books.length} libros actuales, incluyendo tus calificaciones, comentarios y estado de lectura.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-descargar-csv"
              onClick={handleDownloadCSV}
              className="w-full py-3 px-4 rounded-xl bg-[#2ECC71] hover:bg-[#27AE60] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Descargar archivo CSV ahora</span>
            </button>
          </div>

          {/* Option 2: Upload CSV */}
          <div className="bg-[#F8F9FA] p-5 rounded-2xl border-2 border-gray-200 border-l-8 border-[#3498DB] space-y-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#3498DB] text-white shrink-0">
                <Upload className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-[#2C3E50] text-base sm:text-lg">
                  Cargar archivo CSV (Importar)
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5">
                  Selecciona un archivo CSV desde tu computadora para cargarlo en la biblioteca.
                </p>
              </div>
            </div>

            {/* Sync mode options */}
            <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2 text-xs sm:text-sm">
              <p className="font-bold text-gray-700">Al importar el archivo:</p>
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-gray-800">
                  <input
                    type="radio"
                    name="modal-sync-mode"
                    value="replace"
                    checked={syncMode === 'replace'}
                    onChange={() => setSyncMode('replace')}
                    className="text-[#3498DB] focus:ring-0"
                  />
                  <span>Reemplazar catálogo actual</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-gray-800">
                  <input
                    type="radio"
                    name="modal-sync-mode"
                    value="merge"
                    checked={syncMode === 'merge'}
                    onChange={() => setSyncMode('merge')}
                    className="text-[#3498DB] focus:ring-0"
                  />
                  <span>Combinar con existentes</span>
                </label>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept=".csv,text/csv"
              className="hidden"
              id="file-input-csv"
            />

            <button
              type="button"
              id="btn-seleccionar-archivo-csv"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 px-4 rounded-xl bg-white border-2 border-gray-300 hover:bg-gray-100 text-[#2C3E50] font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-5 h-5 text-[#3498DB]" />
              <span>Seleccionar archivo CSV...</span>
            </button>
          </div>

          {/* Option 3: Restore initial dataset */}
          <div className="pt-2 border-t-2 border-gray-200 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-gray-500 font-medium">
              ¿Deseas reiniciar los libros al catálogo inicial?
            </span>
            <button
              type="button"
              id="btn-restaurar-originales"
              onClick={() => {
                if (
                  confirm(
                    '¿Deseas recargar los libros iniciales? Los cambios no guardados se reemplazarán por el catálogo original.'
                  )
                ) {
                  onRestoreOriginal();
                  setImportNotice({
                    type: 'success',
                    message: 'Se ha restaurado el catálogo inicial de libros.',
                  });
                }
              }}
              className="text-xs font-black text-[#3498DB] hover:text-[#2980B9] hover:underline inline-flex items-center gap-1 cursor-pointer py-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restaurar catálogo inicial</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F4F6F7] px-5 sm:px-7 py-4 border-t-2 border-gray-200 flex justify-end">
          <button
            type="button"
            id="btn-cerrar-modal-bottom"
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-[#E67E22] hover:bg-[#D35400] text-white font-black shadow-md border-b-4 border-[#A04000] active:translate-y-0.5 active:border-b-2 transition-all cursor-pointer text-sm sm:text-base"
          >
            Listo, volver a la biblioteca
          </button>
        </div>
      </div>
    </div>
  );
};
