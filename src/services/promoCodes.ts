import { api } from './api';
import type {
  PromoCode,
  PromoPublicInfo,
  PromoQuote,
  PromoRedemption,
} from '@/types';

/** Exactly one of the three ids, mirroring the backend's XOR contract. */
export interface PromoItemRef {
  courseId?: string;
  bundleId?: string;
  workshopId?: string;
}

export interface PromoCodeInput {
  code?: string;
  kind: 'promo' | 'referral';
  discountPercent: number;
  // Clearable fields: send `null` to remove one. An omitted key leaves the
  // stored value untouched (see backend utils/updateOps).
  label?: string | null;
  payeeName?: string | null;
  payeeEmail?: string | null;
  commissionPercent?: number | null;
  maxUses?: number | null;
  expiresAt?: string | null;
  oncePerStudent?: boolean;
  active?: boolean;
  scope?: 'all' | 'selected';
  courseIds?: string[];
  bundleIds?: string[];
  workshopIds?: string[];
}

export interface PromoRedeemResult {
  paymentId: string;
  type: 'course' | 'bundle' | 'workshop';
  itemId: string;
  slug: string;
  title: string;
}

export const promoCodesService = {
  /* Management (main teacher + superuser only) */
  list: () => api.get<PromoCode[]>('/promo-codes'),
  suggestCode: () => api.get<{ code: string }>('/promo-codes/generate'),
  create: (data: PromoCodeInput) => api.post<PromoCode>('/promo-codes', data),
  update: (id: string, data: Partial<PromoCodeInput>) =>
    api.put<PromoCode>(`/promo-codes/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/promo-codes/${id}`),
  redemptions: (id: string) => api.get<PromoRedemption[]>(`/promo-codes/${id}/redemptions`),
  settle: (id: string) =>
    api.post<PromoCode & { settled: number }>(`/promo-codes/${id}/settle`, {}),

  /* Student-facing */
  publicInfo: (code: string) =>
    api.get<PromoPublicInfo>(`/promo-codes/public/${encodeURIComponent(code)}`),
  validate: (data: PromoItemRef & { code: string; currency: 'ARS' | 'USD' }) =>
    api.post<PromoQuote>('/promo-codes/validate', data),
  redeem: (data: PromoItemRef & { code: string; currency: 'ARS' | 'USD' }) =>
    api.post<PromoRedeemResult>('/promo-codes/redeem', data),
};
