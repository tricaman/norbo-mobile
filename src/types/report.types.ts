export enum ReportType {
  BUG = 'BUG',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  PET_HEALTH = 'PET_HEALTH',
}

export interface Report {
  id: string;
  ownerId: string;
  type: ReportType;
  status: string;
  subject: string;
  body: string;
  petId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportInput {
  type: ReportType;
  subject: string;
  body: string;
  petId?: string | null;
}
