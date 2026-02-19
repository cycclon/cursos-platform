import { api } from './api';
import type { Module } from '@/types';

// When creating/updating, videos don't have id yet (server assigns it)
type ModuleInput = Omit<Partial<Module>, 'videos'> & {
  videos?: { url: string; title: string; duration: number; order: number }[];
};

export const modulesService = {
  getModules: (courseId: string) => api.get<Module[]>(`/courses/${courseId}/modules`),
  createModule: (courseId: string, data: ModuleInput) =>
    api.post<Module>(`/courses/${courseId}/modules`, data),
  updateModule: (moduleId: string, data: ModuleInput) =>
    api.put<Module>(`/modules/${moduleId}`, data),
  deleteModule: (moduleId: string) =>
    api.delete<void>(`/modules/${moduleId}`),
};
