export enum ReminderSubjectType {
  HEALTH_EVENT = 'HEALTH_EVENT',
  MAINTENANCE  = 'MAINTENANCE',
  CONSUMABLE   = 'CONSUMABLE',
  ADMIN        = 'ADMIN',
  MILESTONE    = 'MILESTONE',
  CUSTOM       = 'CUSTOM',
}

export enum ReminderStatus {
  PENDING   = 'PENDING',
  DONE      = 'DONE',
  SNOOZED   = 'SNOOZED',
  CANCELLED = 'CANCELLED',
}

export interface NotificationConfig {
  offsets: number[];
  time: string;
}

export interface Reminder {
  id: string;
  petId: string | null;
  ownerId: string;
  subjectType: ReminderSubjectType;
  subjectRef: string | null;
  title: string;
  description: string | null;
  dueAt: string;
  recurrence: Record<string, unknown> | null;
  status: ReminderStatus;
  completedAt: string | null;
  snoozedUntil: string | null;
  notificationConfig: NotificationConfig;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type ReminderFilter = 'today' | 'next7days' | 'overdue' | 'upcoming' | 'all';

export interface ReminderListResponse {
  rows: Reminder[];
  nextCursor: string | null;
}