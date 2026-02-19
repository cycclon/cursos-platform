import { api } from './api';

export interface TestQuestion {
  id: string;
  courseId: string;
  question: string;
  options: string[];
  correctIndex: number;
  order: number;
}

export const testQuestionsService = {
  getQuestions: (courseId: string) =>
    api.get<TestQuestion[]>(`/courses/${courseId}/questions`),

  createQuestion: (courseId: string, data: Partial<TestQuestion>) =>
    api.post<TestQuestion>(`/courses/${courseId}/questions`, data),

  updateQuestion: (questionId: string, data: Partial<TestQuestion>) =>
    api.put<TestQuestion>(`/questions/${questionId}`, data),

  deleteQuestion: (questionId: string) =>
    api.delete<void>(`/questions/${questionId}`),
};
