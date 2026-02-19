import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export default function Combobox({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  label,
  required,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = inputValue
    ? options.filter(opt =>
        opt.toLowerCase().includes(inputValue.toLowerCase())
      )
    : options;

  const showNewOption = inputValue && !options.some(
    opt => opt.toLowerCase() === inputValue.toLowerCase()
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSelect = (option: string) => {
    onChange(option);
    setInputValue(option);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && showNewOption) {
      onChange(inputValue);
      setIsOpen(false);
      e.preventDefault();
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-ink mb-1.5">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-10 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue('');
                onChange('');
                inputRef.current?.focus();
              }}
              className="p-0.5 rounded hover:bg-chocolate-100/40 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-ink-light" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-ink-light transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 py-1 bg-parchment border border-chocolate-100/20 rounded-xl shadow-warm-lg max-h-60 overflow-y-auto">
          {filteredOptions.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full px-4 py-2.5 text-left text-sm text-ink hover:bg-cream-dark transition-colors flex items-center justify-between group"
            >
              <span>{option}</span>
              {option.toLowerCase() === inputValue.toLowerCase() && (
                <span className="text-xs text-chocolate">seleccionado</span>
              )}
            </button>
          ))}
        </div>
      )}

      {isOpen && showNewOption && (
        <div className="absolute z-50 w-full mt-1 py-1 bg-parchment border border-chocolate-100/20 rounded-xl shadow-warm-lg">
          <button
            type="button"
            onClick={() => handleSelect(inputValue)}
            className="w-full px-4 py-2.5 text-left text-sm text-ink hover:bg-cream-dark transition-colors flex items-center gap-2"
          >
            <span className="text-ink-light">Crear:</span>
            <span className="font-medium text-chocolate">{inputValue}</span>
          </button>
        </div>
      )}

      {isOpen && filteredOptions.length === 0 && !showNewOption && (
        <div className="absolute z-50 w-full mt-1 py-3 px-4 bg-parchment border border-chocolate-100/20 rounded-xl shadow-warm-lg text-center">
          <span className="text-sm text-ink-light">No hay coincidencias</span>
        </div>
      )}
    </div>
  );
}
