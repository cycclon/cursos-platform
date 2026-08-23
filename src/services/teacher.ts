import { api } from './api';
import type { Teacher } from '@/types';

export const teacherService = {
  getTeacher: () => api.get<Teacher>('/teacher'),
  // Editor fetch: `raw=1` returns canonical Spanish + the raw `translations`
  // overlay so the EnglishSection can edit both languages. Public reads omit it
  // and get the language-resolved view (so a teacher can preview EN too).
  getTeacherForEdit: () => api.get<Teacher>('/teacher?raw=1'),
  updateTeacher: (data: Partial<Teacher>) => api.put<Teacher>('/teacher', data),
};
