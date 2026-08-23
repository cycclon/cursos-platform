import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { Question, SubmittedAnswer } from '@/types';
import { isPairAttempts, normalizeAnswer } from './scoring';

interface QuestionBodyProps {
  question: Question;
  answer: SubmittedAnswer | undefined;
  /** Locked once checked — game mode never lets an answer be revised. */
  checked: boolean;
  onAnswer: (answer: SubmittedAnswer) => void;
}

/** Dispatches to the right editor for the question's format. */
export default function QuestionBody(props: QuestionBodyProps) {
  switch (props.question.type) {
    case 'tf':
      return <TrueFalseBody {...props} />;
    case 'fill':
      return <FillBody {...props} />;
    case 'match':
      return <MatchBody {...props} />;
    default:
      return <ChoiceBody {...props} />;
  }
}

/* ── Shared option styling ─────────────────────────────────────── */

function optionClass(state: 'idle' | 'selected' | 'correct' | 'wrong' | 'muted'): string {
  switch (state) {
    case 'correct':
      return 'border-success bg-success-light/40 text-ink';
    case 'wrong':
      return 'border-error bg-error-light/40 text-ink';
    case 'selected':
      return 'border-primary bg-primary-50 text-ink';
    case 'muted':
      return 'border-border/50 text-ink-light opacity-70';
    default:
      return 'border-border hover:border-primary/50 text-ink-light';
  }
}

/* ── Multiple choice ───────────────────────────────────────────── */

function ChoiceBody({ question, answer, checked, onAnswer }: QuestionBodyProps) {
  const selected = typeof answer === 'number' ? answer : undefined;

  return (
    <div className="space-y-3">
      {question.options.map((opt, i) => {
        const isCorrect = checked && i === question.correctIndex;
        const isWrongPick = checked && i === selected && i !== question.correctIndex;
        const state = isCorrect ? 'correct' : isWrongPick ? 'wrong' : checked ? 'muted' : selected === i ? 'selected' : 'idle';
        const explanation = checked ? question.explanations?.[i]?.trim() : '';

        return (
          <button
            key={i}
            type="button"
            disabled={checked}
            onClick={() => onAnswer(i)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${optionClass(state)}`}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className={`w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold ${
                  isCorrect
                    ? 'border-success bg-success text-surface'
                    : isWrongPick
                      ? 'border-error bg-error text-surface'
                      : selected === i && !checked
                        ? 'border-primary bg-primary text-surface'
                        : 'border-border text-ink-mute'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium block">{opt}</span>
                {explanation && (
                  <p className="text-sm text-ink-light mt-1.5 leading-relaxed">{explanation}</p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ── True / false ──────────────────────────────────────────────── */

function TrueFalseBody({ question, answer, checked, onAnswer }: QuestionBodyProps) {
  const selected = typeof answer === 'number' ? answer : undefined;

  return (
    <div className="grid grid-cols-2 gap-3">
      {question.options.map((opt, i) => {
        const isCorrect = checked && i === question.correctIndex;
        const isWrongPick = checked && i === selected && i !== question.correctIndex;
        const state = isCorrect ? 'correct' : isWrongPick ? 'wrong' : checked ? 'muted' : selected === i ? 'selected' : 'idle';

        return (
          <button
            key={i}
            type="button"
            disabled={checked}
            onClick={() => onAnswer(i)}
            className={`p-5 rounded-xl border-2 transition-colors flex flex-col items-center gap-2 ${optionClass(state)}`}
          >
            {i === 0 ? <CheckCircle2 className="w-6 h-6" aria-hidden /> : <XCircle className="w-6 h-6" aria-hidden />}
            <span className="font-display text-base font-semibold">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Fill in the blank ─────────────────────────────────────────── */

function FillBody({ question, answer, checked, onAnswer }: QuestionBodyProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const value = typeof answer === 'string' ? answer : '';

  useEffect(() => {
    if (!checked) inputRef.current?.focus();
  }, [checked, question.id]);

  const accepted = question.accepted ?? [];
  const isCorrect =
    checked && accepted.some(candidate => normalizeAnswer(candidate) === normalizeAnswer(value));

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={checked}
        onChange={e => onAnswer(e.target.value)}
        placeholder={t('exam.game.fillPlaceholder')}
        aria-label={t('exam.game.fillPlaceholder')}
        className={`w-full px-4 py-3.5 rounded-xl border-2 bg-surface-alt/50 text-ink font-body outline-none transition-colors placeholder:text-ink-mute disabled:opacity-90 ${
          checked
            ? isCorrect
              ? 'border-success bg-success-light/40'
              : 'border-error bg-error-light/40'
            : 'border-border focus:border-primary'
        }`}
      />

      {checked && !isCorrect && (
        <p className="text-sm text-ink-light mt-3">
          {t('exam.game.expectedAnswer')}{' '}
          <span className="font-mono text-ink">{accepted[0]}</span>
        </p>
      )}
    </div>
  );
}

/* ── Matching ──────────────────────────────────────────────────── */

/**
 * Pair the left column to the right one, tapping one item from each side.
 *
 * Every tap is appended to an ordered attempt log, and that log — not the
 * finished grid — is what gets submitted: a completed grid is always correct,
 * so first-attempt accuracy is the only thing that can distinguish a student
 * who knew the material from one who brute-forced it.
 */
function MatchBody({ question, answer, checked, onAnswer }: QuestionBodyProps) {
  const left = question.pairsLeft ?? [];
  const right = question.pairsRight ?? [];

  const attempts = useMemo(() => (isPairAttempts(answer) ? answer : []), [answer]);

  // Solved pairs are derived from the log, so a resumed run rebuilds the grid.
  const solved = useMemo(() => {
    const map = new Map<number, number>();
    for (const [l, r] of attempts) if (l === r) map.set(l, r);
    return map;
  }, [attempts]);

  const [pending, setPending] = useState<{ side: 'L' | 'R'; index: number } | null>(null);
  const [wrongFlash, setWrongFlash] = useState<{ left: number; right: number } | null>(null);

  // Display order for the right column is shuffled once per question — a
  // matching exercise where the answer is the row across from you is no test.
  const rightOrder = useMemo(() => {
    const order = right.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  useEffect(() => {
    if (!wrongFlash) return;
    const timer = setTimeout(() => setWrongFlash(null), 450);
    return () => clearTimeout(timer);
  }, [wrongFlash]);

  const handlePick = (side: 'L' | 'R', index: number) => {
    // Solved chips are already `disabled`; the sides key differently (the map
    // is left→right), so re-testing membership here would reject valid picks.
    if (checked) return;

    if (!pending || pending.side === side) {
      setPending({ side, index });
      return;
    }

    const leftIdx = side === 'L' ? index : pending.index;
    const rightIdx = side === 'R' ? index : pending.index;

    setPending(null);
    if (leftIdx !== rightIdx) setWrongFlash({ left: leftIdx, right: rightIdx });
    onAnswer([...attempts, [leftIdx, rightIdx]]);
  };

  const chipClass = (isSolved: boolean, isPending: boolean, isFlashing: boolean) => {
    if (isSolved) return 'border-success/50 bg-success-light/30 text-ink-light opacity-60';
    if (isFlashing) return 'border-error bg-error-light/40 text-ink animate-shake';
    if (isPending) return 'border-primary bg-primary-50 text-ink';
    return 'border-border hover:border-primary/50 text-ink-light';
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2.5">
        {left.map((text, i) => {
          const isSolved = solved.has(i);
          return (
            <button
              key={i}
              type="button"
              disabled={checked || isSolved}
              onClick={() => handlePick('L', i)}
              className={`w-full text-left p-3 rounded-xl border-2 text-sm font-medium transition-colors ${chipClass(
                isSolved,
                pending?.side === 'L' && pending.index === i,
                wrongFlash?.left === i,
              )}`}
            >
              {text}
            </button>
          );
        })}
      </div>

      <div className="space-y-2.5">
        {rightOrder.map(i => {
          const isSolved = Array.from(solved.values()).includes(i);
          return (
            <button
              key={i}
              type="button"
              disabled={checked || isSolved}
              onClick={() => handlePick('R', i)}
              className={`w-full text-left p-3 rounded-xl border-2 text-sm font-medium transition-colors ${chipClass(
                isSolved,
                pending?.side === 'R' && pending.index === i,
                wrongFlash?.right === i,
              )}`}
            >
              {right[i]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
