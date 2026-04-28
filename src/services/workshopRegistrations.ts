import { api } from './api';
import type {
  WorkshopRegistration,
  WorkshopAccessResponse,
  WorkshopRosterEntry,
  AttendanceStatus,
} from '@/types';

export const workshopRegistrationsService = {
  getMyRegistrations: () =>
    api.get<WorkshopRegistration[]>('/workshop-registrations'),
  getAccess: (workshopId: string) =>
    api.get<WorkshopAccessResponse>(`/workshop-registrations/${workshopId}/access`),
  register: (workshopId: string) =>
    api.post<WorkshopRegistration>('/workshop-registrations', { workshopId }),
  cancel: (registrationId: string) =>
    api.post<WorkshopRegistration>(`/workshop-registrations/${registrationId}/cancel`),
  markAttendance: (registrationId: string, status: Extract<AttendanceStatus, 'attended' | 'no_show'>) =>
    api.post<WorkshopRegistration>(`/workshop-registrations/${registrationId}/attendance`, { status }),
  getRoster: (workshopId: string) =>
    api.get<WorkshopRosterEntry[]>(`/workshops/${workshopId}/registrations`),
};
