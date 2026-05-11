import { api } from './api';
import type { SalesData, CourseStat, SaleDetail } from '@/types';

export const statisticsService = {
  getSalesData: () => api.get<SalesData[]>('/statistics/sales'),
  getCourseStats: () => api.get<CourseStat[]>('/statistics/courses'),
  getSalesDetail: () => api.get<SaleDetail[]>('/statistics/sales-detail'),
};
