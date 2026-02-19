import { api } from './api';

export const paymentsService = {
  createPreference: (data: { courseId?: string; bundleId?: string }) =>
    api.post<{ preferenceId: string; initPoint: string }>('/payments/create-preference', data),
  getPayments: () => api.get<unknown[]>('/payments'),
  refundPayment: (id: string) => api.post<unknown>(`/payments/${id}/refund`),
};
