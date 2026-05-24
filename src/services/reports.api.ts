import type { CreateReportInput, Report } from '@/types/report.types';
import { api } from './api';

export const reportsApi = {
  create: (input: CreateReportInput) => api.post<Report>('/reports', input),
} as const;
