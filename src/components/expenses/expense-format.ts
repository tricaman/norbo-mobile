import { PetEventType } from "@/types/pet-event.types";

/**
 * Per-category color hint shared across the global expenses screen.
 *
 * Mirrors the palette of `PetExpensesTab` but lifted up so the donut
 * + legend + history rows stay in sync. There is no design-system
 * token map for event types yet — when one lands this can move there.
 */
export const EXPENSE_CATEGORY_COLORS: Record<PetEventType, string> = {
  [PetEventType.VET_VISIT]: "#6B8595",
  [PetEventType.VACCINATION]: "#7E9970",
  [PetEventType.PARASITE_TREATMENT]: "#8DA28A",
  [PetEventType.GROOMING]: "#D4A24C",
  [PetEventType.WEIGHT_RECORD]: "#9CAEBA",
  [PetEventType.WATER_PARAMETERS]: "#7B9DB0",
  [PetEventType.WATER_CHANGE]: "#6B8595",
  [PetEventType.MOLT]: "#B59C6E",
  [PetEventType.FEEDING_LOG]: "#C9A567",
  [PetEventType.MEDICATION]: "#5B7553",
  [PetEventType.PHOTO]: "#A88FC2",
  [PetEventType.NOTE]: "#8D816A",
  [PetEventType.INSURANCE]: "#6B6358",
};

export const EXPENSE_CATEGORY_ICON: Record<PetEventType, string> = {
  [PetEventType.VACCINATION]: "syringe",
  [PetEventType.VET_VISIT]: "stethoscope",
  [PetEventType.PARASITE_TREATMENT]: "shield.checkerboard",
  [PetEventType.GROOMING]: "scissors",
  [PetEventType.WEIGHT_RECORD]: "scalemass",
  [PetEventType.WATER_PARAMETERS]: "drop.fill",
  [PetEventType.WATER_CHANGE]: "arrow.triangle.2.circlepath",
  [PetEventType.MOLT]: "leaf.fill",
  [PetEventType.FEEDING_LOG]: "fork.knife",
  [PetEventType.MEDICATION]: "pill.fill",
  [PetEventType.PHOTO]: "camera.fill",
  [PetEventType.NOTE]: "note.text",
  [PetEventType.INSURANCE]: "shield.fill",
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
