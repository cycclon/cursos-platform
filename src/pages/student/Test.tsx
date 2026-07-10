import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Clock, AlertCircle, CheckCircle2, XCircle, ArrowRight, Sparkles } from 'lucide-react';
import { coursesService } from '@/services/courses';
import { testsService } from '@/services/tests';
import { useToast } from '@/context/ToastContext';


type TestState = 'intro' | 'taking' | 'results';

export default function Test() {
  const { courseId } = useParams<{ courseId: string }>();
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading: loadingCourse } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesService.getCourses,
  });

  const { data: testData, isLoading: loadingQuestions } = useQuery({
    queryKey: ['test', courseId],
    queryFn: () => testsService.getTest(courseId!),
    enabled: !!courseId,
  });

  const questions = testData?.questions ?? [];
  const attemptsUsed = testData?.attemptsUsed ?? 0;

  const course = courses.find(c => c.id === courseId);
  const config = course?.testConfig;

  // The exam delivery endpoint is authoritative for the run's modes; fall back
  // to the (public) course config while it loads.
  const showExplanations = testData?.showExplanations ?? config?.showExplanations ?? false;
  const timed = testData?.timed ?? config?.timed ?? true;

  const [state, setState] = useState<TestState>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<{ passed: boolean; score: number; totalQuestions?: number; correctCount?: number; certificateId?: string } | null>(null);

  const submitMutation = useMutation({
    mutationFn: () => {
      // Submit one entry per presented question (-1 = left unanswered) so the
      // server grades against exactly what the student saw.
      const fullAnswers: Record<string, number> = {};
      questions.forEach(q => { fullAnswers[q.id] = answers[q.id] ?? -1; });
      return testsService.submitTest(courseId!, fullAnswers);
    },
    onSuccess: (data) => {
      setResult(data);
      setState('results');
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
    onError: () => {
      toast.error(t('test.submitError'));
    },
  });

  const startExam = () => {
    if (timed && config) setTimeLeft(config.timeLimit * 60);
    setState('taking');
  };

  // Timer (timed exams only)
  useEffect(() => {
    if (state !== 'taking' || !timed) return;
    if (timeLeft <= 0) {
      submitMutation.mutate();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [state, timed, timeLeft]);

  const isLoading = loadingCourse || loadingQuestions;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-parchment rounded-2xl p-8 border border-chocolate-100/20 shadow-warm-lg">
          <div className="h-16 w-16 bg-chocolate-50 rounded-2xl animate-pulse mx-auto mb-6" />
          <div className="h-8 w-64 bg-chocolate-50 rounded animate-pulse mx-auto mb-4" />
          <div className="h-4 w-48 bg-chocolate-50 rounded animate-pulse mx-auto mb-6" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-20 bg-cream-dark/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course || !config) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">{t('test.notAvailable')}</h1>
        <Link to="/mi-panel" className="text-chocolate mt-4 inline-block">{t('test.backToPanel')}</Link>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const score = result?.score ?? 0;
  const passed = result?.passed ?? false;
  const correctCount = result?.correctCount ?? 0;
  const gradedCount = result?.totalQuestions ?? questions.length;

  // Intro screen
  if (state === 'intro') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-parchment rounded-2xl p-8 border border-chocolate-100/20 shadow-warm-lg text-center">
          <div className="w-16 h-16 rounded-2xl bg-chocolate-50 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-chocolate" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink mb-2">{t('test.examTitle', { title: course.title })}</h1>
          <p className="text-ink-light mb-6">{t('test.readInstructions')}</p>

          {showExplanations && (
            <div className="inline-flex items-center gap-2 bg-chocolate-50 text-chocolate rounded-full px-4 py-1.5 mb-6 text-xs font-mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {t('test.explanationMode')}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-8 text-left">
            {[
              { label: t('test.questions'), value: `${questions.length}` },
              { label: t('test.time'), value: timed ? t('test.minutesValue', { count: config.timeLimit }) : t('test.noLimit') },
              { label: t('test.attemptsLeft'), value: `${config.maxRetries - attemptsUsed}` },
              { label: t('test.toPass'), value: `${config.passingScore}%` },
            ].map((item, i) => (
              <div key={i} className="bg-cream-dark/50 rounded-xl p-4">
                <p className="text-xs text-ink-light">{item.label}</p>
                <p className="text-lg font-bold text-ink">{item.value}</p>
              </div>
            ))}
          </div>

          {showExplanations && (
            <div className="bg-cream-dark/50 rounded-xl p-4 mb-4 text-left flex gap-3">
              <Sparkles className="w-5 h-5 text-chocolate shrink-0 mt-0.5" />
              <p className="text-sm text-ink-light">{t('test.explanationHint')}</p>
            </div>
          )}

          {timed ? (
            <div className="bg-error-light rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-error font-medium">{t('test.timedWarning')}</p>
            </div>
          ) : (
            <div className="bg-cream-dark/50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-ink-light">{t('test.untimedHint')}</p>
            </div>
          )}

          <button
            onClick={startExam}
            className="btn-primary btn-lg rounded-xl"
          >
            {t('test.start')}
          </button>
        </div>
      </div>
    );
  }

  // Results screen
  if (state === 'results') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-parchment rounded-2xl p-8 border border-chocolate-100/20 shadow-warm-lg text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            passed ? 'bg-success-light' : 'bg-error-light'
          }`}>
            {passed ? (
              <CheckCircle2 className="w-10 h-10 text-success" />
            ) : (
              <XCircle className="w-10 h-10 text-error" />
            )}
          </div>

          <h1 className="font-display text-2xl font-bold text-ink mb-2">
            {passed ? t('test.congrats') : t('test.failed')}
          </h1>
          <p className="text-ink-light mb-6">
            {passed ? t('test.passedBody') : t('test.failedBody')}
          </p>

          <div className="inline-flex items-center gap-6 bg-cream-dark/50 rounded-xl px-8 py-4 mb-8">
            <div className="text-center">
              <p className={`text-4xl font-bold ${passed ? 'text-success' : 'text-error'}`}>{score}%</p>
              <p className="text-xs text-ink-light mt-1">{t('test.yourScore')}</p>
            </div>
            <div className="w-px h-10 bg-chocolate-100/30" />
            <div className="text-center">
              <p className="text-4xl font-bold text-ink">{config.passingScore}%</p>
              <p className="text-xs text-ink-light mt-1">{t('test.required')}</p>
            </div>
            <div className="w-px h-10 bg-chocolate-100/30" />
            <div className="text-center">
              <p className="text-4xl font-bold text-ink">{correctCount}/{gradedCount}</p>
              <p className="text-xs text-ink-light mt-1">{t('test.correctCount')}</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Link
              to="/mi-panel"
              className="btn-secondary btn-md rounded-xl"
            >
              {t('test.backToPanel')}
            </Link>
            {passed && result?.certificateId && (
              <Link
                to={`/certificado/${result.certificateId}`}
                className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl"
              >
                {t('test.viewCertificate')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Taking test
  const question = questions[currentQ];

  // ── Explanation mode: immediate per-question feedback ──────────────
  if (showExplanations) {
    const selected = question ? answers[question.id] : undefined;
    const answered = selected !== undefined;
    const correctIndex = question?.correctIndex;
    const isLast = currentQ === questions.length - 1;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-xl font-bold text-ink">{course.title}</h1>
            <p className="text-sm text-ink-light">{t('test.questionOf', { current: currentQ + 1, total: questions.length })}</p>
          </div>
          {timed && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold ${
              timeLeft < 60 ? 'bg-error-light text-error' : 'bg-chocolate-50 text-chocolate'
            }`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-chocolate-100/30 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-chocolate rounded-full transition-all duration-300"
            style={{ width: `${((currentQ + 1) / Math.max(questions.length, 1)) * 100}%` }}
          />
        </div>

        {/* Question */}
        {question && (
          <div className="bg-parchment rounded-2xl p-8 border border-chocolate-100/20 shadow-warm">
            <span className="text-xs font-semibold text-gold uppercase tracking-wider">
              {question.type === 'true-false' ? t('test.trueFalse') : t('test.multipleChoice')}
            </span>
            <h2 className="font-display text-xl font-bold text-ink mt-2 mb-6">{question.text}</h2>

            <div className="space-y-3">
              {question.options.map((opt, i) => {
                const isCorrect = answered && i === correctIndex;
                const isWrongPick = answered && i === selected && i !== correctIndex;
                const explanation = question.explanations?.[i]?.trim();

                let containerClass = 'border-chocolate-100/30';
                if (!answered) {
                  containerClass = 'border-chocolate-100/30 hover:border-chocolate/40 cursor-pointer';
                } else if (isCorrect) {
                  containerClass = 'border-success bg-success-light/40';
                } else if (isWrongPick) {
                  containerClass = 'border-error bg-error-light/40';
                } else {
                  containerClass = 'border-chocolate-100/20 opacity-80';
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { if (!answered) setAnswers(prev => ({ ...prev, [question.id]: i })); }}
                    disabled={answered}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${containerClass}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                        isCorrect
                          ? 'border-success bg-success text-white'
                          : isWrongPick
                            ? 'border-error bg-error text-white'
                            : 'border-chocolate-100/40 text-ink-light'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-ink block">{opt}</span>

                        {answered && isCorrect && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success mt-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {t('test.correctAnswer')}
                          </span>
                        )}
                        {answered && isWrongPick && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-error mt-2">
                            <XCircle className="w-4 h-4" />
                            {t('test.incorrectAnswer')}
                          </span>
                        )}

                        {answered && explanation && (
                          <p className="text-sm text-ink-light mt-1.5 leading-relaxed">{explanation}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation — forward only; answer locks on selection */}
            <div className="flex justify-end mt-8 pt-6 border-t border-chocolate-100/20">
              {!isLast ? (
                <button
                  onClick={() => setCurrentQ(currentQ + 1)}
                  disabled={!answered}
                  className="btn-primary btn-md rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t('test.next')}
                </button>
              ) : (
                <button
                  onClick={() => submitMutation.mutate()}
                  disabled={!answered || submitMutation.isPending}
                  className="btn-primary btn-md rounded-xl disabled:opacity-50"
                >
                  {submitMutation.isPending ? t('test.sending') : t('test.finish')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Classic mode: answer everything, then submit ──────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">{course.title}</h1>
          <p className="text-sm text-ink-light">{t('test.questionOf', { current: currentQ + 1, total: questions.length })}</p>
        </div>
        {timed && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold ${
            timeLeft < 60 ? 'bg-error-light text-error' : 'bg-chocolate-50 text-chocolate'
          }`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-8">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            className={`h-2 rounded-full transition-all ${
              i === currentQ
                ? 'w-8 bg-chocolate'
                : answers[questions[i].id] !== undefined
                  ? 'w-2 bg-gold'
                  : 'w-2 bg-chocolate-100/40'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      {question && (
        <div className="bg-parchment rounded-2xl p-8 border border-chocolate-100/20 shadow-warm">
          <span className="text-xs font-semibold text-gold uppercase tracking-wider">
            {question.type === 'true-false' ? t('test.trueFalse') : t('test.multipleChoice')}
          </span>
          <h2 className="font-display text-xl font-bold text-ink mt-2 mb-6">{question.text}</h2>

          <div className="space-y-3">
            {question.options.map((opt, i) => {
              const selected = answers[question.id] === i;
              return (
                <button
                  key={i}
                  onClick={() => setAnswers(prev => ({ ...prev, [question.id]: i }))}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selected
                      ? 'border-chocolate bg-chocolate-50 text-ink'
                      : 'border-chocolate-100/30 hover:border-chocolate/30 text-ink-light'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      selected
                        ? 'border-chocolate bg-chocolate text-cream'
                        : 'border-chocolate-100/40 text-ink-light'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm font-medium">{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-chocolate-100/20">
            <button
              onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
              disabled={currentQ === 0}
              className="btn-secondary btn-md rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t('test.previous')}
            </button>
            {currentQ < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQ(currentQ + 1)}
                className="btn-primary btn-md rounded-xl"
              >
                {t('test.next')}
              </button>
            ) : (
              <button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="btn-primary btn-md rounded-xl disabled:opacity-50"
              >
                {submitMutation.isPending ? t('test.sending') : t('test.finish')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
