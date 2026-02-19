import { api } from './api';
import type { Testimonial } from '@/types';

export const testimonialsService = {
  getTestimonials: () => api.get<Testimonial[]>('/testimonials'),
  createTestimonial: (data: Partial<Testimonial>) => api.post<Testimonial>('/testimonials', data),
  updateTestimonial: (id: string, data: Partial<Testimonial>) =>
    api.put<Testimonial>(`/testimonials/${id}`, data),
  deleteTestimonial: (id: string) => api.delete<void>(`/testimonials/${id}`),
};
