import { api } from './api';

export interface MercadoPagoStatus {
  connected: boolean;
  mpUserId?: string;
  liveMode?: boolean;
  connectedAt?: string;
  expiresAt?: string;
}

export const mercadoPagoService = {
  getStatus: () => api.get<MercadoPagoStatus>('/auth/mercadopago/status'),
  disconnect: () => api.post<{ ok: true }>('/auth/mercadopago/disconnect'),
  connectUrl: '/api/auth/mercadopago/connect',
};
