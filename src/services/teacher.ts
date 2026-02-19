import { api } from './api';
import type { Teacher } from '@/types';

export const teacherService = {
  getTeacher: () => api.get<Teacher>('/teacher'),
  updateTeacher: (data: Partial<Teacher>) => api.put<Teacher>('/teacher', data),
};
