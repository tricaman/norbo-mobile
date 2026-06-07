import { ExpenseCategory } from "@/types/expense.types";

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.VET]: "#3B82A0",
  [ExpenseCategory.FOOD]: "#2FA66A",
  [ExpenseCategory.ACCESSORIES]: "#9B5DE5",
  [ExpenseCategory.GROOMING]: "#E76F51",
  [ExpenseCategory.OTHER]: "#8A9AA6",
};

export const EXPENSE_CATEGORY_ICON: Record<ExpenseCategory, string> = {
  [ExpenseCategory.VET]: "stethoscope",
  [ExpenseCategory.FOOD]: "fork.knife",
  [ExpenseCategory.ACCESSORIES]: "bag",
  [ExpenseCategory.GROOMING]: "scissors",
  [ExpenseCategory.OTHER]: "creditcard",
};

export function formatCurrency(amount: number, currency: string): string {
  const safeCurrency = currency || "EUR";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${safeCurrency}`;
  }
}

export function formatTrendPercent(percent: number | null): string | null {
  if (percent === null) return null;
  const rounded = Math.round(percent);
  if (rounded === 0) return "0%";
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}%`;
}
