import { api } from './api';
import type { Enrollment } from '@/types';

export const enrollmentsService = {
  getEnrollments: () => api.get<Enrollment[]>('/enrollments'),
  createEnrollment: (courseId: string) =>
    api.post<Enrollment>('/enrollments', { courseId }),
  updateProgress: (courseId: string, progress: number) =>
    api.put<Enrollment>(`/enrollments/${courseId}/progress`, { progress }),
  completeModule: (courseId: string, moduleId: string) =>
    api.post<Enrollment>(`/enrollments/${courseId}/complete-module`, { moduleId }),
  saveProgress: (courseId: string, moduleId: string, progress: number) =>
    api.post<Enrollment>(`/enrollments/${courseId}/save-progress`, { moduleId, progress }),
  saveVideoProgress: (courseId: string, data: {
    moduleId: string;
    videoId: string;
    watchedSeconds: number;
    maxReachedSeconds: number;
    duration: number;
    lastPosition: number;
  }) => api.post<Enrollment>(`/enrollments/${courseId}/save-video-progress`, data),
};
