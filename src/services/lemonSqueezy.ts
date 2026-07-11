import { api } from './api';

export interface LemonSqueezyStatus {
  connected: boolean;
  source?: 'db' | 'env';
  storeId?: string;
  storeName?: string | null;
  variantId?: string;
  testMode?: boolean;
  connectedAt?: string | null;
}

export interface LsStore {
  id: string;
  name: string;
}

export interface LsVariant {
  id: string;
  label: string;
  price: number;
  status: string;
}

export interface LsInspectResult {
  stores: LsStore[];
  storeId: string | null;
  variants: LsVariant[];
}

export const lemonSqueezyService = {
  getStatus: () => api.get<LemonSqueezyStatus>('/lemonsqueezy/admin/status'),
  inspect: (data: { apiKey: string; storeId?: string }) =>
    api.post<LsInspectResult>('/lemonsqueezy/admin/inspect', data),
  connect: (data: { apiKey: string; storeId: string; variantId: string; testMode: boolean }) =>
    api.post<{ connected: true; storeName: string; testMode: boolean }>(
      '/lemonsqueezy/admin/connect',
      data,
    ),
  disconnect: () => api.post<{ ok: true }>('/lemonsqueezy/admin/disconnect'),
};
