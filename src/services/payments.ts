import { api } from './api';

/**
 * Exactly one of the three ids, plus an optional promo/referral code. The code
 * is advisory: the server re-resolves it and recomputes the price, so what the
 * client sends here can only ever reduce what it is allowed to reduce.
 */
interface CheckoutInput {
  courseId?: string;
  bundleId?: string;
  workshopId?: string;
  promoCode?: string;
}

export const paymentsService = {
  createPreference: (data: CheckoutInput) =>
    api.post<{ preferenceId: string; initPoint: string }>('/payments/create-preference', data),
  // International (USD) lane — Lemon Squeezy hosted checkout.
  createLemonCheckout: (data: CheckoutInput) =>
    api.post<{ checkoutUrl: string }>('/payments/lemonsqueezy/create-checkout', data),
  getPayments: () => api.get<unknown[]>('/payments'),
  refundPayment: (id: string) => api.post<unknown>(`/payments/${id}/refund`),
};
