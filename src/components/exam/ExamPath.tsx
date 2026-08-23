import { Lock, Check, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ExamUnit } from '@/types';

export type UnitStatus = 'locked' | 'available' | 'done';

export interface UnitSummary {
  unit: ExamUnit & { questionIds: string[] };
  status: UnitStatus;
  /** Present once the unit has been played. */
  result?: { earned: number; total: number; pct: number; stars: number };
}

interface ExamPathProps {
  courseTitle: string;
  units: UnitSummary[];
  onOpenUnit: (unitId: string) => void;
  onFinish: () => void;
  allDone: boolean;
  submitting: boolean;
}

/**
 * The run's route — the exam's stages as a zig-zag of emblem nodes, the shape
 * the sibling site drew in its prototype, rendered in the platform's vocabulary rather
 * than the prototype's plastic 3D bubbles: mono numbering, a Fraunces title per
 * stage, hairline connectors, and the corner-bracket motif framing the open
 * stage the way it frames the hero, the portrait and the certificate.
 *
 * The alternation is what makes the route read as a route. Each connector is a
 * literal staircase between two node centres, so a glance down the column shows
 * how far the student has walked: travelled steps are drawn in primary, sealed
 * ones in the hairline border colour. The `01 → 06` numbering is load-bearing
 * too — units unlock strictly in order.
 */
export default function ExamPath({
  courseTitle,
  units,
  onOpenUnit,
  onFinish,
  allDone,
  submitting,
}: ExamPathProps) {
  const { t } = useTranslation();
  const doneCount = units.filter(u => u.status === 'done').length;

  // Node centres, so the connector segments meet the circles exactly: half of
  // the node column (w-20 / sm:w-[5.5rem]).
  const CENTER_LEFT = 'left-10 sm:left-11 -translate-x-1/2';
  const CENTER_RIGHT = 'right-10 sm:right-11 translate-x-1/2';

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <span className="section-eyebrow">{t('exam.game.docket')}</span>
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-mute tabular-nums">
          {doneCount}/{units.length}
        </span>
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink mb-8 leading-tight">
        {courseTitle}
      </h1>

      <ol className="mb-2">
        {units.map(({ unit, status, result }, i) => {
          const isLocked = status === 'locked';
          const isOpen = status === 'available';
          const isDone = status === 'done';
          const onLeft = i % 2 === 0;
          const nn = String(i + 1).padStart(2, '0');
          const titleId = `unit-${unit.id}-title`;
          const descId = `unit-${unit.id}-desc`;
          const statusId = `unit-${unit.id}-status`;

          // The step arriving at this node is drawn as travelled once the unit
          // above it is cleared.
          const travelled = i > 0 && units[i - 1].status === 'done';
          const stepColor = travelled ? 'bg-primary/50' : 'bg-border';

          return (
            <li key={unit.id}>
              {i > 0 && (
                <div aria-hidden className="relative h-10 sm:h-12">
                  {/* Down from the previous node… */}
                  <span
                    className={`absolute top-0 h-1/2 w-0.5 ${onLeft ? CENTER_RIGHT : CENTER_LEFT} ${stepColor}`}
                  />
                  {/* …across… */}
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 h-0.5 left-10 right-10 sm:left-11 sm:right-11 ${stepColor}`}
                  />
                  {/* …and down into this one. */}
                  <span
                    className={`absolute bottom-0 h-1/2 w-0.5 ${onLeft ? CENTER_LEFT : CENTER_RIGHT} ${stepColor}`}
                  />
                </div>
              )}

              <div
                className={`flex items-center gap-4 sm:gap-6 ${onLeft ? '' : 'flex-row-reverse'}`}
              >
                {/* Node column — the box is oversized so the two brackets land
                    in the circle's empty corners. Two, not four: four close up
                    into a frame, and a frame is not the motif. */}
                <div
                  className={`relative shrink-0 w-20 h-20 sm:w-[5.5rem] sm:h-[5.5rem] flex items-center justify-center ${
                    isOpen ? 'corner-brackets' : ''
                  }`}
                >
                  <button
                    type="button"
                    // Finished units are sealed: replaying one would refill
                    // hearts and overwrite answers already banked for this
                    // attempt, which is a free retry by another name. Review
                    // happens at the end.
                    disabled={isLocked || isDone}
                    onClick={() => onOpenUnit(unit.id)}
                    // The stage's own heading is its label — the circle carries
                    // an emoji, which says nothing out loud.
                    aria-labelledby={`${titleId} ${statusId}`}
                    aria-describedby={unit.description ? descId : undefined}
                    className={`relative w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-full border-2 flex items-center justify-center transition-transform motion-reduce:transition-none ${
                      isDone
                        ? 'bg-success border-success text-surface cursor-default'
                        : isOpen
                          ? 'bg-primary border-primary text-surface neon-glow hover:scale-105 active:scale-95'
                          : 'bg-surface-alt border-border text-ink-mute cursor-not-allowed'
                    }`}
                  >
                    {unit.icon?.trim() ? (
                      <span
                        aria-hidden
                        className={`text-2xl sm:text-3xl leading-none ${isLocked ? 'opacity-40 grayscale' : ''}`}
                      >
                        {unit.icon}
                      </span>
                    ) : (
                      <span aria-hidden className="font-mono text-sm font-bold tabular-nums">
                        {nn}
                      </span>
                    )}

                    {(isDone || isLocked) && (
                      <span
                        aria-hidden
                        className={`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-surface border flex items-center justify-center ${
                          isDone ? 'border-success text-success' : 'border-border text-ink-mute'
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        ) : (
                          <Lock className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </button>
                </div>

                {/* Copy mirrors the node it belongs to, so the number always
                    sits closest to the circle it numbers. */}
                <div className={`min-w-0 flex-1 ${onLeft ? 'text-left' : 'text-right'}`}>
                  <h2
                    id={titleId}
                    className={`flex items-baseline gap-2 font-display text-base sm:text-lg font-semibold leading-snug ${
                      isLocked ? 'text-ink-light' : 'text-ink'
                    } ${onLeft ? '' : 'flex-row-reverse'}`}
                  >
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-mute tabular-nums shrink-0">
                      {nn}
                    </span>
                    <span className="min-w-0">{unit.title}</span>
                  </h2>

                  {unit.description && (
                    <p id={descId} className="text-sm text-ink-light mt-1 leading-relaxed">
                      {unit.description}
                    </p>
                  )}

                  <div
                    className={`flex items-center gap-3 mt-2 ${onLeft ? '' : 'justify-end'}`}
                  >
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-mute tabular-nums">
                      {t('exam.game.questionCount', { count: unit.questionIds.length })}
                    </span>

                    {result && (
                      <span className="flex items-center gap-1">
                        {Array.from({ length: 3 }, (_, s) => (
                          <Star
                            key={s}
                            aria-hidden
                            className={`w-3.5 h-3.5 ${
                              s < result.stars ? 'text-highlight fill-current' : 'text-ink-mute/30'
                            }`}
                          />
                        ))}
                        <span className="font-mono text-[0.625rem] text-ink-mute tabular-nums ml-1">
                          {result.pct}%
                        </span>
                      </span>
                    )}
                  </div>

                  <span id={statusId} className="sr-only">
                    {isDone
                      ? t('exam.game.statusDone')
                      : isOpen
                        ? t('exam.game.statusOpen')
                        : t('exam.game.statusLocked')}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="editorial-rule" data-label={t('exam.game.closing')} />

      <button
        type="button"
        onClick={onFinish}
        disabled={!allDone || submitting}
        className="btn-primary btn-lg rounded-xl w-full disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? t('exam.game.submitting') : t('exam.game.finishRun')}
      </button>

      {!allDone && (
        <p className="text-sm text-ink-light text-center mt-3">{t('exam.game.finishHint')}</p>
      )}
    </div>
  );
}
