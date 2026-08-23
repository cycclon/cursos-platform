import { api } from './api';
import type { Bundle, Clearable } from '@/types';

// Write payload — see CourseInput. `null` clears the USD price.
export type BundleInput = Partial<Clearable<Bundle, 'priceUsd'>>;

export const bundlesService = {
  getBundles: () => api.get<Bundle[]>('/bundles'),
  // Editor fetch: raw canonical + translations overlay (see teacherService).
  getBundlesForEdit: () => api.get<Bundle[]>('/bundles?raw=1'),
  getBundleBySlug: (slug: string) => api.get<Bundle>(`/bundles/${slug}`),
  createBundle: (data: BundleInput) => api.post<Bundle>('/bundles', data),
  updateBundle: (slug: string, data: BundleInput) => api.put<Bundle>(`/bundles/${slug}`, data),
  deleteBundle: (slug: string) => api.delete<void>(`/bundles/${slug}`),
};
