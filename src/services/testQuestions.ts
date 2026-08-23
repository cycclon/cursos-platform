import { api } from './api';
import type { TestQuestion } from '@/types';

// The shape lives in @/types alongside Question/TestConfig — it used to be
// duplicated here, which let the two drift apart. Re-exported so the existing
// `import { type TestQuestion } from '@/services/testQuestions'` call sites
// keep working.
export type { TestQuestion };

export const testQuestionsService = {
  getQuestions: (courseId: string) =>
    api.get<TestQuestion[]>(`/courses/${courseId}/questions`),

  // Editor fetch: `raw=1` keeps the `translations` overlay (teacher/superuser)
  // so the EN-authoring fields load what was saved. Without it the API strips
  // `translations` from every question, the editor shows the English fields
  // empty, and saving writes that empty overlay back over the stored one.
  getQuestionsForEdit: (courseId: string) =>
    api.get<TestQuestion[]>(`/courses/${courseId}/questions?raw=1`),

  createQuestion: (courseId: string, data: Partial<TestQuestion>) =>
    api.post<TestQuestion>(`/courses/${courseId}/questions`, data),

  updateQuestion: (questionId: string, data: Partial<TestQuestion>) =>
    api.put<TestQuestion>(`/questions/${questionId}`, data),

  deleteQuestion: (questionId: string) =>
    api.delete<void>(`/questions/${questionId}`),
};
