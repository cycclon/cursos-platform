import { api } from './api';
import type { Workshop } from '@/types';

function buildQuery(params?: Record<string, string | boolean | undefined>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of entries) sp.set(k, String(v));
  return `?${sp.toString()}`;
}

export const workshopsService = {
  getWorkshops: (params?: { category?: string; featured?: boolean; search?: string; upcoming?: boolean }) =>
    api.get<Workshop[]>(`/workshops${buildQuery(params)}`),
  getWorkshopBySlug: (slug: string) => api.get<Workshop>(`/workshops/${slug}`),
  createWorkshop: (data: Partial<Workshop>) => api.post<Workshop>('/workshops', data),
  updateWorkshop: (slug: string, data: Partial<Workshop>) =>
    api.put<Workshop>(`/workshops/${slug}`, data),
  deleteWorkshop: (slug: string) => api.delete<void>(`/workshops/${slug}`),
};
