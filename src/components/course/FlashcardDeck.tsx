import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';
import type { Flashcard } from '@/types';

interface FlashcardDeckProps {
  cards: Flashcard[];
}

/**
 * Optional study-card deck rendered inside the course player. Each card flips
 * (3D rotateY) to reveal its answer; left/right arrows move through the deck.
 * Navigating is never required for module completion — this is pure review.
 */
export default function FlashcardDeck({ cards }: FlashcardDeckProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  // Direction of the last navigation, so the incoming card slides in from the
  // matching side. The flip (rotateY) means "show answer"; sliding means
  // "next/prev card" — two distinct gestures.
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);

  const total = cards.length;

  const goTo = useCallback(
    (next: number, dir: 'left' | 'right') => {
      setSlideDir(dir);
      setFlipped(false);
      setIndex(((next % total) + total) % total); // wrap-around
    },
    [total],
  );

  const flip = useCallback(() => setFlipped(f => !f), []);

  const onCardKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo(index + 1, 'right');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(index - 1, 'left');
      }
    },
    [goTo, index],
  );

  if (total === 0) return null;
  const card = cards[index];

  const faceBase =
    'absolute inset-0 backface-hidden rounded-2xl border border-chocolate-100/40 bg-cream-dark/60 ' +
    'p-6 flex flex-col group-focus-visible:ring-2 group-focus-visible:ring-chocolate';

  return (
    <div>
      {/* Card */}
      <button
        type="button"
        onClick={flip}
        onKeyDown={onCardKeyDown}
        aria-pressed={flipped}
        aria-label={flipped ? t('flashcards.showQuestion') : t('flashcards.showAnswer')}
        className="group block w-full text-left perspective-[1400px] focus:outline-none cursor-pointer"
      >
        <div
          key={index}
          className={`relative h-72 sm:h-80 w-full transform-3d transition-transform duration-500 ease-out motion-reduce:transition-none ${
            flipped ? 'rotate-y-180' : ''
          } ${slideDir === 'right' ? 'flashcard-in-right' : slideDir === 'left' ? 'flashcard-in-left' : ''}`}
        >
          {/* Front — question */}
          <div className={faceBase} aria-hidden={flipped}>
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.2em] text-ink-light tabular-nums">
                {index + 1} / {total}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-light">
                {t('flashcards.question')}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto flex items-center justify-center py-4">
              <p className="font-display text-xl sm:text-2xl font-semibold text-ink text-center leading-snug text-balance">
                {card.question}
              </p>
            </div>
            <span className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-chocolate">
              <RotateCw className="w-3 h-3" />
              Mira la respuesta
            </span>
          </div>

          {/* Back — answer */}
          <div className={`${faceBase} rotate-y-180`} aria-hidden={!flipped}>
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.2em] text-ink-light tabular-nums">
                {index + 1} / {total}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-chocolate">
                {t('flashcards.answer')}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto flex items-center justify-center py-4">
              <p className="text-base sm:text-lg text-ink text-center leading-relaxed text-pretty">
                {card.answer}
              </p>
            </div>
            <span className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-ink-light">
              <RotateCw className="w-3 h-3" />
              Volver a la pregunta
            </span>
          </div>
        </div>
      </button>

      {/* Controls — arrows only */}
      <div className="mt-4 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => goTo(index - 1, 'left')}
          disabled={total <= 1}
          aria-label={t('flashcards.previousCard')}
          className="p-2.5 rounded-full border border-chocolate-100/40 text-ink hover:bg-cream-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs tracking-[0.2em] text-ink-light tabular-nums min-w-16 text-center">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={() => goTo(index + 1, 'right')}
          disabled={total <= 1}
          aria-label={t('flashcards.nextCard')}
          className="p-2.5 rounded-full border border-chocolate-100/40 text-ink hover:bg-cream-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
