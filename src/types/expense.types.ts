// `ExpenseCategory` is owned by `src/shared/pet-event-schemas` so it can be
// referenced by the cross-cutting `PET_EVENT_CAPABILITIES` map (events ↔
// expenses ↔ reminders). Re-exported here for ergonomic UI imports.
import { ExpenseCategory } from "@/shared/pet-event-schemas";
export { ExpenseCategory };

export interface Expense {
  id: string;
  petId: string;
  ownerId: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string | null;
  occurredAt: string;
  receiptUrl: string | null;
  receiptMediaAssetId: string | null;
  petEventId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ExpenseListResponse {
  rows: Expense[];
  nextCursor: string | null;
}

export interface ExpenseCategoryBreakdown {
  category: ExpenseCategory;
  amount: number;
  count: number;
}

export interface ExpensePetBreakdown {
  petId: string;
  petName: string;
  amount: number;
  count: number;
}

export interface ExpenseMonthBreakdown {
  month: string;
  amount: number;
}

export interface ExpenseSummary {
  total: { amount: number; currency: string };
  byCategory: ExpenseCategoryBreakdown[];
  byPet: ExpensePetBreakdown[];
  byMonth: ExpenseMonthBreakdown[];
}

export type ExpensePeriod = "month" | "year" | "all";

export interface CreateExpenseInput {
  petId: string;
  amount: number;
  currency?: string;
  category: ExpenseCategory;
  description?: string | null;
  occurredAt: string;
  receiptMediaAssetId?: string | null;
  receiptUrl?: string | null;
  petEventId?: string | null;
}

export interface UpdateExpenseInput {
  amount?: number;
  currency?: string;
  category?: ExpenseCategory;
  description?: string | null;
  occurredAt?: string;
  receiptMediaAssetId?: string | null;
  receiptUrl?: string | null;
}
