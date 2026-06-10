import { api } from './api';
import type {
  BugReportCreateInput,
  BugReportCreated,
  BugReportDetail,
  BugReportListResponse,
  BugReportStats,
  BugReportStatus,
  BugReportType,
} from '@/types';

export interface BugReportListFilters {
  status?: BugReportStatus;
  type?: BugReportType;
  q?: string;
  page?: number;
  limit?: number;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && v !== null) q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const bugReportsService = {
  // ── Reporter (any signed-in user) ──
  create: (payload: BugReportCreateInput) =>
    api.post<BugReportCreated>('/bug-reports', payload),

  uploadImage: (file: File, onProgress?: (percent: number) => void) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.upload<{ url: string }>('/bug-reports/upload', fd, onProgress);
  },

  // ── Superuser ──
  list: (filters: BugReportListFilters = {}) =>
    api.get<BugReportListResponse>(
      `/bug-reports${buildQuery({
        status: filters.status,
        type: filters.type,
        q: filters.q,
        page: filters.page,
        limit: filters.limit,
      })}`,
    ),

  stats: () => api.get<BugReportStats>('/bug-reports/stats'),

  get: (id: string) => api.get<BugReportDetail>(`/bug-reports/${id}`),

  setStatus: (id: string, payload: { status: BugReportStatus; note?: string }) =>
    api.patch<BugReportDetail>(`/bug-reports/${id}/status`, payload),

  saveNotes: (id: string, internalNotes: string) =>
    api.put<BugReportDetail>(`/bug-reports/${id}/notes`, { internalNotes }),

  sendMessage: (id: string, payload: { subject: string; body: string }) =>
    api.post<BugReportDetail>(`/bug-reports/${id}/message`, payload),
};
