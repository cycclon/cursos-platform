import { api } from './api';
import type { Question } from '@/types';

interface TestResponse {
  questions: Question[];
  timeLimit: number;
  totalQuestions: number;
  attemptsUsed: number;
}

export const testsService = {
  getTest: async (courseId: string) => {
    return api.get<TestResponse>(`/courses/${courseId}/test`);
  },
  submitTest: (courseId: string, answers: Record<string, number>) =>
    api.post<{ passed: boolean; score: number; certificateId?: string }>(
      `/courses/${courseId}/test/submit`,
      { answers },
    ),
};
