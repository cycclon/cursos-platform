import { api } from './api';
import type { ExamUnit, GameConfig, Question, SubmittedAnswer } from '@/types';

/** Server-persisted state of a game-mode run, so the skill tree survives a refresh. */
export interface AttemptState {
  answers: Record<string, SubmittedAnswer>;
  completedUnitIds: string[];
  currentUnitId?: string;
  hearts: number;
  xp: number;
  streak: number;
}

interface BaseTestResponse {
  questions: Question[];
  timeLimit: number;
  timed: boolean;
  showExplanations: boolean;
  totalQuestions: number;
  attemptsUsed: number;
}

export interface ClassicTestResponse extends BaseTestResponse {
  mode: 'classic';
}

export interface GameTestResponse extends BaseTestResponse {
  mode: 'game';
  // Units the run actually walks — empty ones are filtered out server-side,
  // and `questionIds` is scoped to what this attempt was served.
  units: (ExamUnit & { questionIds: string[] })[];
  gameConfig: GameConfig;
  state: AttemptState;
}

export type TestResponse = ClassicTestResponse | GameTestResponse;

export interface TestResult {
  passed: boolean;
  score: number;
  totalQuestions: number;
  correctCount: number;
  reason: 'completed' | 'hearts';
  attemptsUsed: number;
  attemptsLeft: number;
  certificateId?: string;
}

export const testsService = {
  getTest: async (courseId: string) => {
    return api.get<TestResponse>(`/courses/${courseId}/test`);
  },

  submitTest: (
    courseId: string,
    answers: Record<string, SubmittedAnswer>,
    reason: 'completed' | 'hearts' = 'completed',
  ) => api.post<TestResult>(`/courses/${courseId}/test/submit`, { answers, reason }),

  /** Checkpoint a game-mode run (called as each unit is finished). */
  saveState: (courseId: string, state: AttemptState) =>
    api.put<{ ok: true }>(`/courses/${courseId}/test/state`, state),
};
