import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import type { ExamUnit, Question, SubmittedAnswer } from '@/types';
import type { TestResult } from '@/services/tests';
import { describeCorrect, isFullyCorrect, scoreSet, starsFor } from './scoring';

interface GameResultsProps {
  result: TestResult;
  passingScore: number;
  units: (ExamUnit & { questionIds: string[] })[];
  questions: Question[];
  answers: Record<string, SubmittedAnswer>;
  xp: number;
  unitQuestions: (unitId: string) => Question[];
}

/**
 * End of the run: the server's verdict, the docket broken down unit by unit,
 * and every question that went wrong with its correct answer.
 *
 * The score shown is the SERVER's, never the locally-computed one — the local
 * tally exists only to have marked answers in real time.
 */
export default function GameResults({
  result,
  passingScore,
  units,
  questions,
  answers,
  xp,
  unitQuestions,
}: GameResultsProps) {
  const { t } = useTranslation();
  const { passed, score, correctCount, totalQuestions } = result;

  // Only questions the student actually reached can be "mistakes" — a run cut
  // short by lost hearts shouldn't list everything it never showed.
  const mistakes = questions.filter(q => answers[q.id] !== undefined && !isFullyCorrect(q, answers[q.id]));

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="relative bg-surface-raised rounded-2xl border border-primary/30 corner-brackets p-8 text-center">
        <span className="section-eyebrow justify-center">
          {t(result.reason === 'hearts' ? 'exam.game.runEnded' : 'exam.game.runComplete')}
        </span>

        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mt-6 mb-6 ${
            passed ? 'bg-success-light' : 'bg-error-light'
          }`}
        >
          {passed ? (
            <CheckCircle2 className="w-10 h-10 text-success" aria-hidden />
          ) : (
            <XCircle className="w-10 h-10 text-error" aria-hidden />
          )}
        </div>

        <h1 className="font-display text-3xl font-semibold text-ink mb-2">
          {passed ? t('test.congrats') : t('test.failed')}
        </h1>
        <p className="text-ink-light">
          {result.reason === 'hearts'
            ? t('exam.game.heartsGoneBody')
            : passed
              ? t('test.passedBody')
              : t('test.failedBody')}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          {[
            { label: t('test.yourScore'), value: `${score}%`, tone: passed ? 'text-success' : 'text-error' },
            { label: t('test.required'), value: `${passingScore}%`, tone: 'text-ink' },
            { label: t('exam.game.correct'), value: `${correctCount}/${totalQuestions}`, tone: 'text-ink' },
            { label: t('exam.game.totalXp'), value: `${xp}`, tone: 'text-highlight' },
          ].map(stat => (
            <div key={stat.label} className="bg-surface-alt/50 rounded-xl p-4">
              <p className={`font-display text-2xl font-semibold tabular-nums ${stat.tone}`}>{stat.value}</p>
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-mute mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {!passed && (
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-mute mt-6">
            {t('exam.game.attemptsLeft', { count: result.attemptsLeft })}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link to="/mi-panel" className="btn-secondary btn-md rounded-xl">
            {t('test.backToPanel')}
          </Link>
          {passed && result.certificateId && (
            <Link
              to={`/certificado/${result.certificateId}`}
              className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl"
            >
              {t('test.viewCertificate')}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>

      {/* Per-unit breakdown */}
      <div className="editorial-rule" data-label={t('exam.game.docket')} />

      <ul className="space-y-px">
        {units.map((unit, i) => {
          const scored = scoreSet(unitQuestions(unit.id), answers);
          const played = unitQuestions(unit.id).some(q => answers[q.id] !== undefined);

          return (
            <li
              key={unit.id}
              className="flex items-center gap-3 py-3 border-b border-border/40 last:border-b-0"
            >
              <span className="font-mono text-[0.625rem] text-ink-mute tabular-nums w-6 shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span aria-hidden className="text-lg shrink-0">{unit.icon}</span>
              <span className="flex-1 min-w-0 text-sm text-ink truncate">{unit.title}</span>

              {played ? (
                <>
                  <span aria-hidden className="text-sm text-highlight shrink-0">
                    {'★'.repeat(starsFor(scored.pct))}
                  </span>
                  <span className="font-mono text-xs text-ink-light tabular-nums shrink-0 w-16 text-right">
                    {scored.pct}%
                  </span>
                </>
              ) : (
                <span className="font-mono text-xs text-ink-mute shrink-0">
                  {t('exam.game.notReached')}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Mistake review */}
      {mistakes.length > 0 && (
        <>
          <div className="editorial-rule" data-label={t('exam.game.reviewLabel')} />
          <h2 className="font-display text-xl font-semibold text-ink mb-4">
            {t('exam.game.reviewTitle', { count: mistakes.length })}
          </h2>

          <ul className="space-y-3">
            {mistakes.map(q => (
              <li key={q.id} className="rounded-xl border border-border/60 bg-surface-raised/60 p-4">
                <p className="text-sm font-medium text-ink">{q.text}</p>
                <p className="text-sm text-success mt-2">
                  <span className="font-mono text-xs uppercase tracking-wider">
                    {t('exam.game.correctLabel')}
                  </span>{' '}
                  {describeCorrect(q)}
                </p>
                {(q.explanation?.trim() || q.explanations?.[q.correctIndex ?? 0]?.trim()) && (
                  <p className="text-sm text-ink-light mt-1.5 leading-relaxed">
                    {q.explanation?.trim() || q.explanations?.[q.correctIndex ?? 0]}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
