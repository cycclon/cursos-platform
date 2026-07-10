import { api } from './api';

export type SubtitleJobStatus = 'queued' | 'processing' | 'done' | 'failed';

export interface SubtitleJobInfo {
  id: string;
  status: SubtitleJobStatus;
  step: string;
  warning?: string;
  error?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

// Auto-generation pipeline (teacher-only). `generate` is idempotent server-side:
// calling it while a job is active returns that same job.
export const subtitlesService = {
  generate: (moduleId: string, videoId: string) =>
    api.post<{ job: SubtitleJobInfo }>(`/modules/${moduleId}/videos/${videoId}/subtitles/generate`),
  getJob: (moduleId: string, videoId: string) =>
    api.get<{ job: SubtitleJobInfo | null }>(`/modules/${moduleId}/videos/${videoId}/subtitles/job`),

  // Teacher "Sobre mí" welcome video — targets the requesting teacher's profile.
  generateTeacherVideo: () =>
    api.post<{ job: SubtitleJobInfo }>('/teacher/video/subtitles/generate'),
  getTeacherVideoJob: () =>
    api.get<{ job: SubtitleJobInfo | null }>('/teacher/video/subtitles/job'),
};
