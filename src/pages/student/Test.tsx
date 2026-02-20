import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, AlertCircle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { coursesService } from '@/services/courses';
import { testsService } from '@/services/tests';
import { useToast } from '@/context/ToastContext';


type TestState = 'intro' | 'taking' | 'results';

export default function Test() {
  const { courseId } = useParams<{ courseId: string }>();
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

  const [state, setState] = useState<TestState>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<{ passed: boolean; score: number; certificateId?: string } | null>(null);

  const submitMutation = useMutation({
    mutationFn: () => {
      return testsService.submitTest(courseId!, answers);
    },
    onSuccess: (data) => {
      setResult(data);
      setState('results');
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
    onError: () => {
      toast.error('Error al enviar el examen. Intentá de nuevo.');
    },
  });

  // Initialize timer when config loads
  useEffect(() => {
    if (config && timeLeft === 0 && state === 'intro') {
      setTimeLeft(config.timeLimit * 60);
    }
  }, [config, timeLeft, state]);

  // Timer
  useEffect(() => {
    if (state !== 'taking') return;
    if (timeLeft <= 0) {
      submitMutation.mutate();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [state, timeLeft]);

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
        <h1 className="font-display text-2xl text-ink">Examen no disponible</h1>
        <Link to="/mi-panel" className="text-chocolate mt-4 inline-block">Volver a mi panel</Link>
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
  const correctCount = result ? Math.round((result.score / 100) * questions.length) : 0;

  // Intro screen
  if (state === 'intro') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-parchment rounded-2xl p-8 border border-chocolate-100/20 shadow-warm-lg text-center">
          <div className="w-16 h-16 rounded-2xl bg-chocolate-50 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-chocolate" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink mb-2">Examen: {course.title}</h1>
          <p className="text-ink-light mb-6">Leé atentamente las instrucciones antes de comenzar.</p>

          <div className="grid grid-cols-2 gap-4 mb-8 text-left">
            {[
              { label: 'Preguntas', value: `${questions.length}` },
              { label: 'Tiempo límite', value: `${config.timeLimit} minutos` },
              { label: 'Intentos restantes', value: `${config.maxRetries - attemptsUsed}` },
              { label: 'Para aprobar', value: `${config.passingScore}%` },
            ].map((item, i) => (
              <div key={i} className="bg-cream-dark/50 rounded-xl p-4">
                <p className="text-xs text-ink-light">{item.label}</p>
                <p className="text-lg font-bold text-ink">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-error-light rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-error font-medium">Una vez iniciado, no podrás pausar el examen. El tiempo correrá hasta que finalices o se agote.</p>
          </div>

          <button
            onClick={() => setState('taking')}
            className="btn-primary btn-lg rounded-xl"
          >
            Comenzar examen
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
            {passed ? '¡Felicitaciones!' : 'No aprobaste'}
          </h1>
          <p className="text-ink-light mb-6">
            {passed
              ? 'Aprobaste el examen con éxito. Ya podés obtener tu certificado.'
              : 'No alcanzaste el puntaje mínimo requerido. Podés intentar nuevamente.'}
          </p>

          <div className="inline-flex items-center gap-6 bg-cream-dark/50 rounded-xl px-8 py-4 mb-8">
            <div className="text-center">
              <p className={`text-4xl font-bold ${passed ? 'text-success' : 'text-error'}`}>{score}%</p>
              <p className="text-xs text-ink-light mt-1">Tu puntaje</p>
            </div>
            <div className="w-px h-10 bg-chocolate-100/30" />
            <div className="text-center">
              <p className="text-4xl font-bold text-ink">{config.passingScore}%</p>
              <p className="text-xs text-ink-light mt-1">Requerido</p>
            </div>
            <div className="w-px h-10 bg-chocolate-100/30" />
            <div className="text-center">
              <p className="text-4xl font-bold text-ink">{correctCount}/{questions.length}</p>
              <p className="text-xs text-ink-light mt-1">Correctas</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Link
              to="/mi-panel"
              className="btn-secondary btn-md rounded-xl"
            >
              Volver a mi panel
            </Link>
            {passed && result?.certificateId && (
              <Link
                to={`/certificado/${result.certificateId}`}
                className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl"
              >
                Ver certificado
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">{course.title}</h1>
          <p className="text-sm text-ink-light">Pregunta {currentQ + 1} de {questions.length}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold ${
          timeLeft < 60 ? 'bg-error-light text-error' : 'bg-chocolate-50 text-chocolate'
        }`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
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
            {question.type === 'true-false' ? 'Verdadero o Falso' : 'Opción múltiple'}
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
              Anterior
            </button>
            {currentQ < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQ(currentQ + 1)}
                className="btn-primary btn-md rounded-xl"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="btn-primary btn-md rounded-xl disabled:opacity-50"
              >
                {submitMutation.isPending ? 'Enviando...' : 'Finalizar examen'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
