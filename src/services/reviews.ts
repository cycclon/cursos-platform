import { api } from './api';
import type { Review } from '@/types';

export const reviewsService = {
  getCourseReviews: (courseId: string) => api.get<Review[]>(`/courses/${courseId}/reviews`),
  createReview: (data: { courseId: string; rating: number; categories: object; comment: string }) =>
    api.post<Review>('/reviews', data),
  replyToReview: (reviewId: string, reply: string) =>
    api.post<Review>(`/reviews/${reviewId}/reply`, { reply }),
  getMyReviewedCourses: () => api.get<string[]>('/reviews/mine'),
  getTeacherReviews: () => api.get<Review[]>('/reviews/teacher'),
};
