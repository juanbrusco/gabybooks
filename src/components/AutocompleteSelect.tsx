import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check, LucideIcon } from 'lucide-react';
import { TextSizeMode } from '../types';

interface AutocompleteOption {
  name: string;
  count?: number;
}

interface AutocompleteSelectProps {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  options: AutocompleteOption[];
  placeholder: string;
  allLabel: string;
  textSize: TextSizeMode;
}

export const AutocompleteSelect: React.FC<AutocompleteSelectProps> = ({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  options,
  placeholder,
  allLabel,
  textSize,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep query in sync when value changes or when opened
  useEffect(() => {
    if (!isOpen) {
      setQuery(value);
    }
  }, [value, isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery(value);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, value]);

  // Filter options based on query when open
  const filteredOptions = query.trim()
    ? options.filter((opt) => opt.name.toLowerCase().includes(query.toLowerCase().trim()))
    : options;

  const handleSelect = (selectedName: string) => {
    onChange(selectedName);
    setQuery(selectedName);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const inputSize =
    textSize === 'extra'
      ? 'text-lg py-3 px-3'
      : textSize === 'grande'
      ? 'text-base py-2.5 px-3'
      : 'text-sm py-2 px-2.5';

  return (
    <div ref={containerRef} className="flex flex-col gap-1 relative">
      <label
        htmlFor={id}
        className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5"
      >
        <Icon className="w-3.5 h-3.5 text-[#3498DB]" />
        {label}
      </label>

      {/* Input container simulating a searchable select */}
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={isOpen ? query : value || ''}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery(value);
          }}
          placeholder={value ? value : placeholder}
          className={`w-full bg-[#F8F9FA] border-2 ${
            isOpen ? 'border-[#3498DB] bg-white ring-2 ring-blue-100' : 'border-gray-300'
          } rounded-xl pr-16 font-bold text-[#2C3E50] placeholder-gray-500 focus:outline-none transition-all cursor-text ${inputSize}`}
          autoComplete="off"
        />

        {/* Buttons right: Clear and Chevron */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              title="Borrar selección"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (isOpen) {
                setIsOpen(false);
                setQuery(value);
              } else {
                setIsOpen(true);
                inputRef.current?.focus();
              }
            }}
            className="p-1 rounded-lg text-gray-500 hover:text-[#2C3E50] cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute top-[102%] left-0 right-0 z-50 bg-white rounded-xl border-2 border-gray-300 shadow-2xl max-h-64 overflow-y-auto mt-1 animate-in fade-in duration-100">
          {/* Option: Todos / Limpiar */}
          <button
            type="button"
            onClick={() => handleSelect('')}
            className={`w-full text-left px-3.5 py-2.5 text-sm font-bold border-b border-gray-100 flex items-center justify-between hover:bg-[#F4F6F7] transition-colors cursor-pointer ${
              !value ? 'bg-blue-50 text-[#3498DB]' : 'text-gray-700'
            }`}
          >
            <span>{allLabel}</span>
            {!value && <Check className="w-4 h-4 text-[#3498DB]" />}
          </button>

          {/* List of matched options */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = value.toLowerCase() === opt.name.toLowerCase();
              return (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => handleSelect(opt.name)}
                  className={`w-full text-left px-3.5 py-2.5 text-sm font-bold flex items-center justify-between border-b border-gray-50 hover:bg-[#F4F6F7] transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50 text-[#2980B9]' : 'text-[#2C3E50]'
                  }`}
                >
                  <span className="truncate pr-2">{opt.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {opt.count !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-gray-200 text-gray-700">
                        {opt.count}
                      </span>
                    )}
                    {isSelected && <Check className="w-4 h-4 text-[#3498DB]" />}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-3.5 py-3 text-xs text-gray-500 font-semibold text-center italic">
              No se encontraron coincidencias para "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
