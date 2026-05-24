import type { Reminder, ReminderFilter, ReminderListResponse, ReminderSubjectType } from '@/types/reminder.types';
import { api } from './api';

export interface CreateReminderInput {
  subjectType: ReminderSubjectType;
  petId?: string | null;
  title: string;
  description?: string | null;
  dueAt: string;
  notificationConfig?: { offsets: number[]; time: string };
}

export const remindersApi = {
  list: (params: { filter: ReminderFilter; cursor?: string; limit?: number }) =>
    api.get<ReminderListResponse>('/reminders', { params }),

  create: (input: CreateReminderInput) =>
    api.post<Reminder>('/reminders', input),

  get: (id: string) => api.get<Reminder>(`/reminders/${encodeURIComponent(id)}`),

  complete: (id: string) =>
    api.post<Reminder>(`/reminders/${encodeURIComponent(id)}/complete`),

  snooze: (id: string, until: string) =>
    api.post<Reminder>(`/reminders/${encodeURIComponent(id)}/snooze`, { until }),

  cancel: (id: string, reason?: string) =>
    api.post<Reminder>(`/reminders/${encodeURIComponent(id)}/cancel`, { reason }),

  update: (
    id: string,
    data: { title?: string; description?: string | null; dueAt?: string },
  ) => api.patch<Reminder>(`/reminders/${encodeURIComponent(id)}`, data),

  delete: (id: string) =>
    api.delete(`/reminders/${encodeURIComponent(id)}`),
} as const;
