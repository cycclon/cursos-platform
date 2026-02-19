import { api } from './api';
import type { Course } from '@/types';

export const coursesService = {
  getCourses: () => api.get<Course[]>('/courses'),
  getCourseBySlug: (slug: string) => api.get<Course>(`/courses/${slug}`),
  createCourse: (data: Partial<Course>) => api.post<Course>('/courses', data),
  updateCourse: (slug: string, data: Partial<Course>) => api.put<Course>(`/courses/${slug}`, data),
  deleteCourse: (slug: string) => api.delete<void>(`/courses/${slug}`),
};
