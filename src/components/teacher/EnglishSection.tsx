import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Languages, Loader2, Sparkles } from 'lucide-react';

interface EnglishSectionProps {
  /** Fill-empty-fields-with-AI handler. Omit to hide the button. */
  onAutoTranslate?: () => void | Promise<void>;
  translating?: boolean;
  defaultOpen?: boolean;
  /** Compact variant for nested forms (modules/questions). */
  dense?: boolean;
  children: ReactNode;
}

/**
 * Collapsible "English translation" panel used across the teacher editors.
 * The teacher UI itself stays in Spanish by design — this section only edits
 * the English content overlay (`translations.en`). The auto-translate button
 * fills EMPTY fields with machine translations; existing text is never
 * overwritten (clear a field to re-translate it).
 */
export default function EnglishSection({
  onAutoTranslate,
  translating = false,
  defaultOpen = false,
  dense = false,
  children,
}: EnglishSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-gold/40 bg-gold/5 overflow-hidden">
      <div className={`flex items-center gap-2 ${dense ? 'px-3 py-2' : 'px-4 py-2.5'}`}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 flex-1 text-left"
          aria-expanded={open}
        >
          <Languages className={`${dense ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-chocolate shrink-0`} />
          <span className={`${dense ? 'text-xs' : 'text-sm'} font-semibold text-ink`}>
            Traducción al inglés (EN)
          </span>
          {open ? (
            <ChevronUp className="w-3.5 h-3.5 text-ink-light" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-ink-light" />
          )}
        </button>
        {onAutoTranslate && (
          <button
            type="button"
            onClick={() => { setOpen(true); void onAutoTranslate(); }}
            disabled={translating}
            title="Traduce con IA los campos en inglés que estén vacíos. Lo ya escrito no se pisa."
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-chocolate bg-gold/20 rounded-lg hover:bg-gold/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {translating ? 'Traduciendo…' : 'Completar con IA'}
          </button>
        )}
      </div>
      {open && (
        <div className={`${dense ? 'px-3 pb-3' : 'px-4 pb-4'} space-y-3 border-t border-gold/20 pt-3`}>
          <p className="text-[11px] text-ink-light/80">
            Si un campo queda vacío, los estudiantes verán el texto en español (nunca se muestra
            contenido a medias).
          </p>
          {children}
        </div>
      )}
    </div>
  );
}
