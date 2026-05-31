import type {
  CreateExpenseInput,
  Expense,
  ExpenseCategory,
  ExpenseListResponse,
  ExpensePeriod,
  ExpenseSummary,
  ExpenseTrendResponse,
  UpdateExpenseInput,
} from "@/types/expense.types";
import { api } from "./api";

/**
 * Build `[from, to)` boundaries for the requested period in UTC.
 * Using local-time `new Date(y, m, d)` + `toISOString()` shifts boundaries
 * by the user's TZ offset and leaks expenses across month/year edges, so
 * we anchor in UTC consistently with the backend's storage.
 */
function periodToDates(period: ExpensePeriod): { from?: string; to?: string } {
  const now = new Date();
  if (period === "month") {
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    ).toISOString();
    const to = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    ).toISOString();
    return { from, to };
  }
  if (period === "year") {
    const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
    const to = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1)).toISOString();
    return { from, to };
  }
  return {};
}

interface SummaryParams {
  period: ExpensePeriod;
  petId?: string;
  petIds?: string[];
}

interface ListParams {
  period?: ExpensePeriod;
  petId?: string;
  petIds?: string[];
  category?: ExpenseCategory;
  cursor?: string | null;
  limit?: number;
}

function buildPetParams(
  petId: string | undefined,
  petIds: string[] | undefined,
): Record<string, unknown> {
  if (petIds && petIds.length > 0) {
    // Axios serializes arrays as repeated `petId=` query params with the
    // default paramsSerializer, which matches the API contract.
    return { petId: petIds };
  }
  if (petId) return { petId };
  return {};
}

export const expensesApi = {
  summary: ({ period, petId, petIds }: SummaryParams) => {
    const dates = periodToDates(period);
    return api.get<ExpenseSummary>("/expenses/summary", {
      params: { ...buildPetParams(petId, petIds), ...dates },
    });
  },

  list: ({ period, petId, petIds, category, cursor, limit }: ListParams) => {
    const dates = period ? periodToDates(period) : {};
    const params: Record<string, unknown> = {
      ...dates,
      ...buildPetParams(petId, petIds),
    };
    if (category) params.category = category;
    if (cursor) params.cursor = cursor;
    if (limit) params.limit = limit;
    return api.get<ExpenseListResponse>("/expenses", { params });
  },

  trend: ({
    petId,
    petIds,
    months,
  }: {
    petId?: string;
    petIds?: string[];
    months?: number;
  } = {}) => {
    const params: Record<string, unknown> = {
      ...buildPetParams(petId, petIds),
    };
    if (months) params.months = months;
    return api.get<ExpenseTrendResponse>("/expenses/trend", { params });
  },

  get: (id: string) => api.get<Expense>(`/expenses/${encodeURIComponent(id)}`),

  create: (input: CreateExpenseInput) => api.post<Expense>("/expenses", input),

  update: (id: string, input: UpdateExpenseInput) =>
    api.patch<Expense>(`/expenses/${encodeURIComponent(id)}`, input),

  delete: (id: string) => api.delete(`/expenses/${encodeURIComponent(id)}`),
} as const;
