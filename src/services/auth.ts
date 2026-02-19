import { api } from './api';
import type { User } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const authService = {
  getMe: () => api.get<User>('/auth/me'),
  logout: () => api.post<void>('/auth/logout'),
  getGoogleLoginUrl: () => `${API_BASE}/auth/google`,
  register: (data: { name: string; email: string; password: string }) =>
    api.post<User>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<User>('/auth/login', data),
};
