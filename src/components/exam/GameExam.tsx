import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, HeartCrack } from 'lucide-react';
import type { Question, SubmittedAnswer } from '@/types';
import { testsService, type AttemptState, type GameTestResponse, type TestResult } from '@/services/tests';
import { useToast } from '@/context/ToastContext';
import ExamHud from './ExamHud';
import ExamPath, { type UnitSummary, type UnitStatus } from './ExamPath';
import QuestionBody from './QuestionBody';
import GameResults from './GameResults';
import { isAnswerComplete, isFullyCorrect, scoreSet, starsFor } from './scoring';

interface GameExamProps {
  courseId: string;
  courseTitle: string;
  passingScore: number;
  data: GameTestResponse;
  /**
   * Fired the moment the run is graded. The parent must switch out of its
   * "taking" state, because submitting flips the enrollment to `testPassed` and
   * the parent's already-passed guard would otherwise unmount this component
   * before the results screen ever renders.
   */
  onFinished?: () => void;
}

type Screen = 'path' | 'unit' | 'unitResult' | 'results';

/**
 * "Modo juego" — the exam as a sequence of units walked in order, with lives
 * and XP.
 *
 * The client scores locally so it can mark each answer on the spot, but that
 * score is never authoritative: the server re-grades every answer on submit.
 * Run state is checkpointed after each unit, so closing the tab resumes rather
 * than restarts (and, because the attempt is pinned server-side, cannot be used
 * to farm a fresh question set).
 */
export default function GameExam({ courseId, courseTitle, passingScore, data, onFinished }: GameExamProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const maxHearts = data.gameConfig.hearts;

  const [answers, setAnswers] = useState<Record<string, SubmittedAnswer>>(data.state.answers ?? {});
  const [completedUnitIds, setCompletedUnitIds] = useState<string[]>(data.state.completedUnitIds ?? []);
  const [xp, setXp] = useState(data.state.xp ?? 0);
  const [streak, setStreak] = useState(data.state.streak ?? 0);
  const [hearts, setHearts] = useState(data.state.hearts ?? maxHearts);

  const [screen, setScreen] = useState<Screen>('path');
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const questionById = useMemo(
    () => new Map(data.questions.map(q => [q.id, q])),
    [data.questions],
  );

  const unitQuestions = useCallback(
    (unitId: string): Question[] => {
      const unit = data.units.find(u => u.id === unitId);
      if (!unit) return [];
      return unit.questionIds
        .map(id => questionById.get(id))
        .filter((q): q is Question => q !== undefined);
    },
    [data.units, questionById],
  );

  const checkpoint = useMutation({
    mutationFn: (state: AttemptState) => testsService.saveState(courseId, state),
    // A dropped checkpoint costs at most the current unit's progress on
    // resume; it must never interrupt the run.
    onError: () => {},
  });

  const submit = useMutation({
    mutationFn: (reason: 'completed' | 'hearts') => testsService.submitTest(courseId, answers, reason),
    onSuccess: data => {
      setResult(data);
      setScreen('results');
      // Tell the parent first: the invalidation below marks the course passed,
      // which trips its already-passed guard unless it has left "taking".
      onFinished?.();
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
    onError: () => toast.error(t('test.submitError')),
  });

  const save = useCallback(
    (overrides: Partial<AttemptState> = {}) => {
      checkpoint.mutate({
        answers,
        completedUnitIds,
        currentUnitId: activeUnitId ?? undefined,
        hearts,
        xp,
        streak,
        ...overrides,
      });
    },
    [answers, completedUnitIds, activeUnitId, hearts, xp, streak, checkpoint],
  );

  /* ── Path ─────────────────────────────────────────────────────── */

  const summaries: UnitSummary[] = useMemo(
    () =>
      data.units.map((unit, i) => {
        const isDone = completedUnitIds.includes(unit.id);
        const prevDone = i === 0 || completedUnitIds.includes(data.units[i - 1].id);
        const status: UnitStatus = isDone ? 'done' : prevDone ? 'available' : 'locked';

        if (!isDone) return { unit, status };

        const scored = scoreSet(unitQuestions(unit.id), answers);
        return { unit, status, result: { ...scored, stars: starsFor(scored.pct) } };
      }),
    [data.units, completedUnitIds, answers, unitQuestions],
  );

  const allDone = data.units.length > 0 && completedUnitIds.length === data.units.length;

  const openUnit = (unitId: string) => {
    setActiveUnitId(unitId);
    setQIndex(0);
    setChecked(false);
    // Lives are a single pool for the whole exam — deliberately NOT refilled
    // here. Mistakes carry across units, so a shaky early unit still costs you
    // in the last one.
    setScreen('unit');
  };

  const exitUnit = () => {
    setScreen('path');
    setActiveUnitId(null);
    save({ currentUnitId: undefined });
  };

  /* ── Unit run ─────────────────────────────────────────────────── */

  const active = activeUnitId ? unitQuestions(activeUnitId) : [];
  const question = active[qIndex];
  const answer = question ? answers[question.id] : undefined;
  const correct = question ? isFullyCorrect(question, answer) : false;

  const setAnswer = (value: SubmittedAnswer) => {
    if (!question || checked) return;
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  };

  const handleCheck = () => {
    if (!question || checked) return;
    setChecked(true);

    if (isFullyCorrect(question, answers[question.id])) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setXp(
        xp +
          data.gameConfig.xpPerCorrect +
          (nextStreak >= data.gameConfig.streakThreshold ? data.gameConfig.xpStreakBonus : 0),
      );
    } else {
      setStreak(0);
      setHearts(h => Math.max(0, h - 1));
    }
  };

  // `hearts` has already been decremented by handleCheck at this point, so the
  // test is against the post-answer value — comparing `<= 1` here would end the
  // run one mistake early.
  const heartsGone = checked && !correct && hearts === 0;

  const handleContinue = () => {
    // Out of lives: the run is over where it stands. Unreached questions grade
    // as zero, so this is a real (failing-by-default) submission, not a reset.
    if (heartsGone) {
      submit.mutate('hearts');
      return;
    }

    const isLast = qIndex === active.length - 1;
    setChecked(false);

    if (!isLast) {
      setQIndex(qIndex + 1);
      return;
    }

    const nextCompleted = activeUnitId && !completedUnitIds.includes(activeUnitId)
      ? [...completedUnitIds, activeUnitId]
      : completedUnitIds;

    setCompletedUnitIds(nextCompleted);
    setScreen('unitResult');
    save({ completedUnitIds: nextCompleted, hearts, xp, streak });
  };

  /* ── Screens ──────────────────────────────────────────────────── */

  if (screen === 'results' && result) {
    return (
      <GameResults
        result={result}
        passingScore={passingScore}
        units={data.units}
        questions={data.questions}
        answers={answers}
        xp={xp}
        unitQuestions={unitQuestions}
      />
    );
  }

  if (screen === 'unitResult' && activeUnitId) {
    const unit = data.units.find(u => u.id === activeUnitId);
    const scored = scoreSet(unitQuestions(activeUnitId), answers);
    const stars = starsFor(scored.pct);

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="relative bg-surface-raised rounded-2xl border border-primary/30 corner-brackets p-8 text-center">
          <span className="section-eyebrow justify-center">{t('exam.game.unitCleared')}</span>

          <div aria-hidden className="text-5xl mt-6 mb-4">{unit?.icon}</div>
          <h1 className="font-display text-2xl font-semibold text-ink">{unit?.title}</h1>

          <div className="flex items-center justify-center gap-1 mt-4" aria-label={t('exam.game.starsEarned', { count: stars })}>
            {Array.from({ length: 3 }, (_, i) => (
              <span
                key={i}
                aria-hidden
                className={`text-2xl ${i < stars ? 'text-highlight' : 'text-ink-mute/25'}`}
              >
                ★
              </span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { label: t('exam.game.correct'), value: `${Math.round(scored.earned * 10) / 10}/${scored.total}` },
              { label: t('exam.game.unitScore'), value: `${scored.pct}%` },
              { label: t('exam.game.totalXp'), value: `${xp}` },
            ].map(stat => (
              <div key={stat.label} className="bg-surface-alt/50 rounded-xl p-4">
                <p className="font-display text-2xl font-semibold text-ink tabular-nums">{stat.value}</p>
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-mute mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => { setScreen('path'); setActiveUnitId(null); }}
            className="btn-primary btn-lg rounded-xl w-full mt-8"
          >
            {allDone ? t('exam.game.backToDocketFinal') : t('exam.game.backToDocket')}
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'unit' && question) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ExamHud
          hearts={hearts}
          maxHearts={maxHearts}
          xp={xp}
          streak={streak}
          progress={active.length ? qIndex / active.length : 0}
          onExit={exitUnit}
        />

        <div className="mt-8">
          <div className="flex items-baseline justify-between gap-4">
            <span className="section-eyebrow">{t(`exam.game.type.${question.type}`)}</span>
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-mute tabular-nums">
              {qIndex + 1}/{active.length}
            </span>
          </div>

          <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink leading-snug mt-3 mb-7">
            {question.text}
          </h1>

          <QuestionBody
            question={question}
            answer={answer}
            checked={checked}
            onAnswer={setAnswer}
          />
        </div>

        {/* Verdict + advance */}
        <div className="mt-8 pt-6 border-t border-border/60">
          {!checked ? (
            <button
              type="button"
              onClick={handleCheck}
              disabled={!question || !isAnswerComplete(question, answer)}
              className="btn-primary btn-lg rounded-xl w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('exam.game.check')}
            </button>
          ) : (
            <div>
              <div className={`flex items-start gap-3 mb-4 ${correct ? 'text-success' : 'text-error'}`}>
                {correct ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
                ) : (
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold">
                    {correct ? t('exam.game.correctTitle') : t('exam.game.wrongTitle')}
                  </p>
                  {question.type === 'match' && !correct && (
                    <p className="text-sm text-ink-light mt-0.5">{t('exam.game.matchPartial')}</p>
                  )}
                  {/* Suppressed when it would just repeat the per-option
                      rationale already rendered under the correct choice. */}
                  {question.explanation?.trim() &&
                    question.explanation.trim() !== question.explanations?.[question.correctIndex ?? 0]?.trim() && (
                      <p className="text-sm text-ink-light mt-1.5 leading-relaxed">{question.explanation}</p>
                    )}
                </div>
              </div>

              {heartsGone && (
                <div className="flex items-start gap-3 rounded-xl border border-error/40 bg-error-light/30 p-4 mb-4">
                  <HeartCrack className="w-5 h-5 text-error shrink-0 mt-0.5" aria-hidden />
                  <p className="text-sm text-ink-light">{t('exam.game.heartsGone')}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleContinue}
                disabled={submit.isPending}
                className="btn-primary btn-lg rounded-xl w-full disabled:opacity-50"
              >
                {heartsGone
                  ? submit.isPending
                    ? t('exam.game.submitting')
                    : t('exam.game.seeResult')
                  : t('exam.game.continue')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <ExamHud
        hearts={hearts}
        maxHearts={maxHearts}
        xp={xp}
        streak={streak}
        progress={data.units.length ? completedUnitIds.length / data.units.length : 0}
      />

      <div className="mt-8">
        <ExamPath
          courseTitle={courseTitle}
          units={summaries}
          onOpenUnit={openUnit}
          onFinish={() => submit.mutate('completed')}
          allDone={allDone}
          submitting={submit.isPending}
        />
      </div>
    </div>
  );
}
