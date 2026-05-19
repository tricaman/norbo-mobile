import type { PetEventType } from "./pet-event.types";

export interface PetExpenseCategoryTotal {
  type: PetEventType;
  total: number;
}

export interface PetExpenseSummary {
  petId: string;
  year: number;
  currency: string;
  total: number;
  previousYearTotal: number;
  /**
   * Year-over-year delta as a percentage (e.g. -12 means -12%).
   * `null` when there is no previous-year baseline.
   */
  yoyPercent: number | null;
  byCategory: PetExpenseCategoryTotal[];
}
