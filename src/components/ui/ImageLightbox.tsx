import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

/**
 * Full-screen viewer for a single image, framed with the brand's corner
 * brackets (the recurring "case-file" motif). Opening and closing both
 * animate: on close we set `closing`, play the exit animation, then defer
 * `onClose` so the element stays mounted long enough to animate out.
 */
export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  const requestClose = useCallback(() => {
    if (closingRef.current) return; // ignore double triggers (button + backdrop)
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(onClose, 200); // matches the .lightbox-*-out duration
  }, [onClose]);

  // Esc to close + lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && requestClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [requestClose]);

  return createPortal(
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8 bg-ink/70 backdrop-blur-md ${
        closing ? 'lightbox-backdrop-out' : 'lightbox-backdrop-in'
      }`}
      onMouseDown={requestClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        onClick={requestClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2 rounded-full bg-surface/90 text-ink hover:bg-surface hover:text-primary shadow-warm transition-colors"
        aria-label="Cerrar imagen"
      >
        <X className="w-5 h-5" />
      </button>

      <figure
        className={`corner-brackets relative m-0 ${closing ? 'lightbox-image-out' : 'lightbox-image-in'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="block max-h-[85vh] max-w-[90vw] w-auto h-auto object-contain rounded-lg shadow-warm-lg"
        />
      </figure>
    </div>,
    document.body,
  );
}
