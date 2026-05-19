import { api } from './api';
import type {
  ProgressOverview,
  CourseProgressRow,
  CourseModulesProgress,
  CourseStudentsProgress,
  StudentProgressDetail,
} from '@/types';

export const progressService = {
  getOverview: () => api.get<ProgressOverview>('/progress/overview'),
  getCourses: () => api.get<CourseProgressRow[]>('/progress/courses'),
  getCourseModules: (courseId: string) =>
    api.get<CourseModulesProgress>(`/progress/courses/${courseId}/modules`),
  getCourseStudents: (courseId: string) =>
    api.get<CourseStudentsProgress>(`/progress/courses/${courseId}/students`),
  getStudent: (studentId: string) =>
    api.get<StudentProgressDetail>(`/progress/students/${studentId}`),
};
