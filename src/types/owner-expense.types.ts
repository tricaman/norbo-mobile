import type { PetEventType } from "./pet-event.types";

export type ExpensePeriod = "month" | "year" | "all";

export interface OwnerExpenseCategoryTotal {
  type: PetEventType;
  total: number;
}

export interface OwnerExpensePetTotal {
  petId: string;
  total: number;
}

export interface OwnerExpenseSummary {
  period: ExpensePeriod;
  from: string | null;
  to: string | null;
  currency: string;
  total: number;
  previousTotal: number;
  /** Period-over-period delta percentage. `null` = no baseline. */
  trendPercent: number | null;
  /** Average monthly spend in the active window (null when undefined). */
  averagePerMonth: number | null;
  byCategory: OwnerExpenseCategoryTotal[];
  byPet: OwnerExpensePetTotal[];
}

export interface OwnerExpenseHistoryItem {
  id: string;
  petId: string;
  type: PetEventType;
  title: string;
  occurredAt: string;
  cost: number;
  currency: string;
}

export interface OwnerExpenseHistoryPage {
  rows: OwnerExpenseHistoryItem[];
  nextCursor: string | null;
}
