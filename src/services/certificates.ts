import { api } from './api';
import type { Certificate } from '@/types';

export const certificatesService = {
  getCertificates: () => api.get<Certificate[]>('/certificates'),
  getCertificate: (id: string) => api.get<Certificate>(`/certificates/${id}`),
};
