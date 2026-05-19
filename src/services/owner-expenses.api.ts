import type {
  ExpensePeriod,
  OwnerExpenseHistoryPage,
  OwnerExpenseSummary,
} from "@/types/owner-expense.types";
import { api } from "./api";

interface ExpenseQueryParams {
  period: ExpensePeriod;
  petIds?: string[];
}

interface ExpenseHistoryQueryParams extends ExpenseQueryParams {
  cursor?: string | null;
  limit?: number;
}

function buildParams(params: ExpenseQueryParams): Record<string, string> {
  const out: Record<string, string> = { period: params.period };
  if (params.petIds && params.petIds.length > 0) {
    out.petIds = params.petIds.join(",");
  }
  return out;
}

export const ownerExpensesApi = {
  summary: (params: ExpenseQueryParams) =>
    api.get<OwnerExpenseSummary>("/me/expenses/summary", {
      params: buildParams(params),
    }),

  history: (params: ExpenseHistoryQueryParams) => {
    const query: Record<string, string | number> = buildParams(params);
    if (params.cursor) query.cursor = params.cursor;
    if (params.limit) query.limit = params.limit;
    return api.get<OwnerExpenseHistoryPage>("/me/expenses", { params: query });
  },
} as const;
