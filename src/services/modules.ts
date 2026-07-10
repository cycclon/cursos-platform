import { api } from './api';
import type { Module, VideoSubtitle } from '@/types';

// When creating, videos don't have _id yet (server assigns it). On update we
// round-trip `_id` so Mongoose preserves each video's identity — subtitle
// jobs and per-video progress reference videos by that id.
type ModuleInput = Omit<Partial<Module>, 'videos'> & {
  videos?: {
    _id?: string;
    url: string;
    title: string;
    duration: number;
    order: number;
    subtitles?: VideoSubtitle[];
    translations?: { en?: { title?: string } };
  }[];
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
