import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { getCourse, testQuestions } from '@/data/mock';
import RoleSwitcher from '@/components/layout/RoleSwitcher';

type TestState = 'intro' | 'taking' | 'results';

export default function Test() {
  const { courseId } = useParams<{ courseId: string }>();
  const course = getCourse(courseId ?? '');
  const questions = testQuestions.filter(q => q.courseId === courseId);
  const config = course?.testConfig;

  const [state, setState] = useState<TestState>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState((config?.timeLimit ?? 30) * 60);

  // Timer
  useEffect(() => {
    if (state !== 'taking') return;
    if (timeLeft <= 0) {
      setState('results');
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [state, timeLeft]);

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

  const correctCount = questions.reduce((sum, q) => {
    return sum + (answers[q.id] === q.correctAnswer ? 1 : 0);
  }, 0);
  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= config.passingScore;

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
              { label: 'Intentos restantes', value: `${config.maxRetries}` },
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
        <RoleSwitcher />
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
            {passed && (
              <Link
                to="/certificado/cert1"
                className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl"
              >
                Ver certificado
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
        <RoleSwitcher />
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
                onClick={() => setState('results')}
                className="btn-primary btn-md rounded-xl"
              >
                Finalizar examen
              </button>
            )}
          </div>
        </div>
      )}
      <RoleSwitcher />
    </div>
  );
}
