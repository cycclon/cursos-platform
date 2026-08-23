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
  // Editor fetch: `raw=1` keeps the `translations` overlay (teacher/superuser) so
  // the EN authoring fields load their saved values and a save can't wipe them.
  getModulesForEdit: (courseId: string) => api.get<Module[]>(`/courses/${courseId}/modules?raw=1`),
  createModule: (courseId: string, data: ModuleInput) =>
    api.post<Module>(`/courses/${courseId}/modules`, data),
  updateModule: (moduleId: string, data: ModuleInput) =>
    api.put<Module>(`/modules/${moduleId}`, data),
  deleteModule: (moduleId: string) =>
    api.delete<void>(`/modules/${moduleId}`),
};
