import {
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
  parseISO,
} from "date-fns";
import type { TFunction } from "i18next";

/**
 * Format an age from an ISO birth date into a human-readable label.
 *
 * Unit selection:
 *   - < 7 days   → days
 *   - < 8 weeks  → weeks
 *   - < 24 months → months
 *   - otherwise  → years
 *
 * Returns `null` when the birth date is missing or in the future.
 */
export function formatPetAge(
  birthDate: string | null | undefined,
  t: TFunction,
): string | null {
  if (!birthDate) return null;

  const birth = parseISO(birthDate);
  const now = new Date();
  if (birth.getTime() > now.getTime()) return null;

  const days = differenceInDays(now, birth);
  if (days < 7) {
    if (days < 1) return null;
    return `${days} ${t(days === 1 ? "petDetail.ageDay" : "petDetail.ageDays")}`;
  }

  const weeks = differenceInWeeks(now, birth);
  if (weeks < 8) {
    return `${weeks} ${t(weeks === 1 ? "petDetail.ageWeek" : "petDetail.ageWeeks")}`;
  }

  const months = differenceInMonths(now, birth);
  if (months < 24) {
    return `${months} ${t(months === 1 ? "petDetail.ageMonth" : "petDetail.ageMonths")}`;
  }

  const years = differenceInYears(now, birth);
  return `${years} ${t(years === 1 ? "petDetail.ageYear" : "petDetail.ageYears")}`;
}
