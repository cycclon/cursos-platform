import { api } from './api';
import type { FAQ } from '@/types';

export const faqsService = {
  getFaqs: () => api.get<FAQ[]>('/faqs'),
  // Editor fetch: raw canonical + translations overlay (see teacherService).
  getFaqsForEdit: () => api.get<FAQ[]>('/faqs?raw=1'),
  createFaq: (data: { question: string; answer: string }) => api.post<FAQ>('/faqs', data),
  updateFaq: (id: string, data: { question: string; answer: string }) =>
    api.put<FAQ>(`/faqs/${id}`, data),
  deleteFaq: (id: string) => api.delete<void>(`/faqs/${id}`),
};
