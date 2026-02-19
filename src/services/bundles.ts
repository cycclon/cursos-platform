import { api } from './api';
import type { Bundle } from '@/types';

export const bundlesService = {
  getBundles: () => api.get<Bundle[]>('/bundles'),
  getBundleBySlug: (slug: string) => api.get<Bundle>(`/bundles/${slug}`),
  createBundle: (data: Partial<Bundle>) => api.post<Bundle>('/bundles', data),
  updateBundle: (slug: string, data: Partial<Bundle>) => api.put<Bundle>(`/bundles/${slug}`, data),
  deleteBundle: (slug: string) => api.delete<void>(`/bundles/${slug}`),
};
