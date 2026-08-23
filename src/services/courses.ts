import { api } from './api';
import type { Clearable, Course } from '@/types';

// Write payload. The price fields are clearable — send `null` to remove one
// (an omitted key leaves the stored value untouched).
export type CourseInput = Partial<
  Clearable<Course, 'discountPrice' | 'priceUsd' | 'discountPriceUsd' | 'discountLabel'>
>;

export const coursesService = {
  getCourses: () => api.get<Course[]>('/courses'),
  getCourseBySlug: (slug: string) => api.get<Course>(`/courses/${slug}`),
  // Editor fetch: `raw=1` returns canonical Spanish + the raw `translations`
  // overlay (teacher/superuser only) so the EN authoring fields load their
  // saved values — and a save can't wipe them. Public reads stay language-resolved.
  getCoursesForEdit: () => api.get<Course[]>('/courses?raw=1'),
  getCourseBySlugForEdit: (slug: string) => api.get<Course>(`/courses/${slug}?raw=1`),
  createCourse: (data: CourseInput) => api.post<Course>('/courses', data),
  updateCourse: (slug: string, data: CourseInput) => api.put<Course>(`/courses/${slug}`, data),
  deleteCourse: (slug: string) => api.delete<void>(`/courses/${slug}`),
  // Persist a new catalog order — `ids` is the full course list in the desired
  // sequence; the backend sets each course's `order` to its index.
  reorderCourses: (ids: string[]) => api.put<{ message: string }>('/courses/reorder', { ids }),
};
