import { api } from './api';
import type {
  Reminder,
  ReminderDraft,
  MassReminderParams,
  MassReminderPreview,
  MassReminderResult,
} from '@/types';

export const remindersService = {
  getStudentLog: (studentId: string) =>
    api.get<Reminder[]>(`/reminders/student/${studentId}`),
  getStudentDraft: (studentId: string) =>
    api.get<ReminderDraft>(`/reminders/student/${studentId}/draft`),
  sendToStudent: (
    studentId: string,
    payload: { subject: string; body: string; signature: string },
  ) => api.post<Reminder>(`/reminders/student/${studentId}`, payload),
  massPreview: (params: MassReminderParams) =>
    api.post<MassReminderPreview>('/reminders/mass/preview', params),
  massSend: (params: MassReminderParams & { signature?: string }) =>
    api.post<MassReminderResult>('/reminders/mass/send', params),
};
