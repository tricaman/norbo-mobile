export enum PetEventType {
  VACCINATION = "VACCINATION",
  VET_VISIT = "VET_VISIT",
  PARASITE_TREATMENT = "PARASITE_TREATMENT",
  GROOMING = "GROOMING",
  WEIGHT_RECORD = "WEIGHT_RECORD",
  WATER_PARAMETERS = "WATER_PARAMETERS",
  WATER_CHANGE = "WATER_CHANGE",
  MOLT = "MOLT",
  FEEDING_LOG = "FEEDING_LOG",
  MEDICATION = "MEDICATION",
  PHOTO = "PHOTO",
  NOTE = "NOTE",
  INSURANCE = "INSURANCE",
  PASSING = "PASSING",
}

export enum PetEventStatus {
  SCHEDULED = "SCHEDULED",
  OCCURRED = "OCCURRED",
  CANCELLED = "CANCELLED",
}

export interface PetEvent {
  id: string;
  petId: string;
  ownerId: string;
  type: PetEventType;
  status: PetEventStatus;
  occurredAt: string | null;
  scheduledFor: string | null;
  completedAt: string | null;
  title: string;
  description: string | null;
  cost: number | null;
  currency: string;
  mediaAssetIds: string[];
  extra: Record<string, unknown>;
  createReminder: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PetEventTimeline {
  upcoming: PetEvent[];
  past: PetEvent[];
  nextCursor: string | null;
}

export interface CreatePetEventInput {
  mode: "past" | "future";
  type: PetEventType;
  occurredAt?: string;
  scheduledFor?: string;
  title: string;
  description?: string | null;
  cost?: number | null;
  currency?: string;
  mediaAssetIds?: string[];
  extra?: Record<string, unknown>;
  createReminder?: boolean;
}

export interface UpdatePetEventInput {
  title?: string;
  description?: string | null;
  occurredAt?: string;
  scheduledFor?: string;
  cost?: number | null;
  currency?: string;
  mediaAssetIds?: string[];
  extra?: Record<string, unknown>;
  createReminder?: boolean;
}
