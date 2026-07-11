import { api } from './api';

export const paymentsService = {
  createPreference: (data: { courseId?: string; bundleId?: string; workshopId?: string }) =>
    api.post<{ preferenceId: string; initPoint: string }>('/payments/create-preference', data),
  // International (USD) lane — Lemon Squeezy hosted checkout.
  createLemonCheckout: (data: { courseId?: string; bundleId?: string; workshopId?: string }) =>
    api.post<{ checkoutUrl: string }>('/payments/lemonsqueezy/create-checkout', data),
  getPayments: () => api.get<unknown[]>('/payments'),
  refundPayment: (id: string) => api.post<unknown>(`/payments/${id}/refund`),
};
