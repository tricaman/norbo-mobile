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

/**
 * Recurrence rule (server: reminder-engine/domain/reminder-recurrence.ts).
 * MONTHLY|YEARLY with an optional interval (MONTHLY + 3 = every 3 months).
 * Completing a recurring reminder makes the API spawn the next occurrence.
 */
export interface ReminderRecurrence {
  freq: 'MONTHLY' | 'YEARLY';
  interval?: number;
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
  recurrence: ReminderRecurrence | null;
  status: ReminderStatus;
  completedAt: string | null;
  snoozedUntil: string | null;
  notificationConfig: NotificationConfig;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type ReminderFilter =
  | 'today'
  | 'next7days'
  | 'overdue'
  | 'upcoming'
  /** PENDING with no upper bound, overdue-first; powers the home section. */
  | 'pending'
  | 'all';

export interface ReminderListResponse {
  rows: Reminder[];
  nextCursor: string | null;
}