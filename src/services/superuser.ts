import { api } from './api';

export interface TeacherEntry {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  title: string;
  isMainTeacher: boolean;
}

export const superuserService = {
  getTeachers: () => api.get<TeacherEntry[]>('/superuser/teachers'),
  createTeacher: (data: { name: string; email: string; title: string }) =>
    api.post<TeacherEntry>('/superuser/teachers', data),
  deleteTeacher: (id: string) => api.delete<void>(`/superuser/teachers/${id}`),
};
