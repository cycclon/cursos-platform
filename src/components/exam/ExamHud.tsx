import { Heart, Flame, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ExamHudProps {
  hearts: number;
  maxHearts: number;
  xp: number;
  streak: number;
  /** 0–1. Progress through the current unit, or the whole run on the path screen. */
  progress: number;
  onExit?: () => void;
}

/**
 * Run status line: lives, progress, XP.
 *
 * Deliberately not the prototype's emoji row — every counter here is set in the
 * mono "case-file" face with tabular figures, the same treatment the rest of
 * the platform gives metadata. Hearts stay iconographic because they have to
 * read at a glance mid-question.
 */
export default function ExamHud({ hearts, maxHearts, xp, streak, progress, onExit }: ExamHudProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {onExit && (
        <button
          type="button"
          onClick={onExit}
          aria-label={t('exam.game.exitUnit')}
          className="shrink-0 p-1.5 -ml-1.5 rounded-lg text-ink-mute hover:text-ink hover:bg-surface-mute/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div
          className="h-2 w-full rounded-full bg-surface-mute overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
      </div>

      {streak > 0 && (
        <div
          className="hidden sm:flex items-center gap-1.5 shrink-0"
          title={t('exam.game.streakTitle', { count: streak })}
        >
          <Flame className="w-4 h-4 text-highlight" aria-hidden />
          <span className="font-mono text-sm text-highlight tabular-nums">{streak}</span>
        </div>
      )}

      <div className="flex items-center gap-1 shrink-0" aria-label={t('exam.game.heartsLeft', { count: hearts })}>
        {Array.from({ length: maxHearts }, (_, i) => (
          <Heart
            key={i}
            aria-hidden
            className={`w-4 h-4 ${i < hearts ? 'text-error fill-current' : 'text-ink-mute/35'}`}
          />
        ))}
      </div>

      <div className="shrink-0 font-mono text-xs uppercase tracking-[0.18em] text-ink-mute">
        <span className="text-highlight tabular-nums">{xp}</span> XP
      </div>
    </div>
  );
}
