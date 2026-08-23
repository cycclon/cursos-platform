import type { Question, SubmittedAnswer } from '@/types';

/**
 * Client-side mirror of `backend/src/utils/examGrading.ts`.
 *
 * Game mode marks answers the instant they're given, so the client has to score
 * locally — but this is for FEEDBACK ONLY. The score that decides pass/fail,
 * certificates and retries is always recomputed on the server at submit time.
 * If the two ever disagree, the server is right. Keep the rules here in step
 * with the backend module.
 */

/** Case- and accent-insensitive comparison key for free-text answers. */
export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isPairAttempts(value: SubmittedAnswer | undefined): value is [number, number][] {
  return Array.isArray(value);
}

/**
 * Score one answered question in [0, 1]. Everything except `match` is
 * all-or-nothing; `match` awards 1/N per left item paired correctly on the
 * FIRST try, which is the only reason a completed grid can score below 100%.
 */
export function scoreAnswer(question: Question, answer: SubmittedAnswer | undefined): number {
  if (answer === undefined || answer === null) return 0;

  switch (question.type) {
    case 'mcq':
    case 'tf':
      return typeof answer === 'number' && answer === question.correctIndex ? 1 : 0;

    case 'fill': {
      if (typeof answer !== 'string') return 0;
      const accepted = question.accepted ?? [];
      const given = normalizeAnswer(answer);
      if (!given || accepted.length === 0) return 0;
      return accepted.some(candidate => normalizeAnswer(candidate) === given) ? 1 : 0;
    }

    case 'match': {
      const pairCount = question.pairsLeft?.length ?? 0;
      if (pairCount === 0 || !isPairAttempts(answer)) return 0;

      const firstTry = new Map<number, number>();
      for (const [leftIdx, rightIdx] of answer) {
        if (leftIdx < 0 || leftIdx >= pairCount) continue;
        if (!firstTry.has(leftIdx)) firstTry.set(leftIdx, rightIdx);
      }

      let earned = 0;
      firstTry.forEach((rightIdx, leftIdx) => {
        if (leftIdx === rightIdx) earned++;
      });
      return earned / pairCount;
    }

    default:
      return 0;
  }
}

/**
 * Whether the student has done enough to submit this question — what gates the
 * "Comprobar" button. For matching that means every pair is placed, since a
 * half-finished grid can't be marked.
 */
export function isAnswerComplete(question: Question, answer: SubmittedAnswer | undefined): boolean {
  if (answer === undefined || answer === null) return false;

  switch (question.type) {
    case 'mcq':
    case 'tf':
      return typeof answer === 'number' && answer >= 0;
    case 'fill':
      return typeof answer === 'string' && answer.trim().length > 0;
    case 'match': {
      if (!isPairAttempts(answer)) return false;
      const solved = new Set(answer.filter(([l, r]) => l === r).map(([l]) => l));
      return solved.size === (question.pairsLeft?.length ?? 0);
    }
    default:
      return false;
  }
}

/** Whether an answer earned full credit — drives the ✓/✗ feedback banner. */
export function isFullyCorrect(question: Question, answer: SubmittedAnswer | undefined): boolean {
  return scoreAnswer(question, answer) === 1;
}

/** Rolled-up score for a set of questions, as earned/total and a percentage. */
export function scoreSet(
  questions: Question[],
  answers: Record<string, SubmittedAnswer>,
): { earned: number; total: number; pct: number } {
  const total = questions.length;
  const earned = questions.reduce((sum, q) => sum + scoreAnswer(q, answers[q.id]), 0);
  return { earned, total, pct: total === 0 ? 0 : Math.round((earned / total) * 100) };
}

/** 1–3 stars for a finished unit, matching the thresholds in the prototype. */
export function starsFor(pct: number): number {
  if (pct >= 90) return 3;
  if (pct >= 70) return 2;
  return 1;
}

/** Human-readable correct answer, for the end-of-run mistake review. */
export function describeCorrect(question: Question): string {
  switch (question.type) {
    case 'mcq':
    case 'tf':
      return question.options[question.correctIndex ?? 0] ?? '';
    case 'fill':
      return question.accepted?.[0] ?? '';
    case 'match':
      return (question.pairsLeft ?? [])
        .map((left, i) => `${left} → ${question.pairsRight?.[i] ?? ''}`)
        .join(' · ');
    default:
      return '';
  }
}
