/**
 * Resting Energy Requirement (RER), the published husbandry baseline shared by
 * the dog and cat calorie tools:  RER = 70 × kg^0.75 (kcal/day).
 *
 * Maintenance Energy (MER) = RER × a lifestage/activity factor; the factor is
 * species-specific and supplied by the caller, so this stays the single place
 * the RER curve is defined. Indicative, non-clinical.
 */
export function restingEnergyKcal(weightKg: number): number {
  return 70 * Math.pow(weightKg, 0.75);
}

export function dailyEnergyKcal(weightKg: number, factor: number): number {
  return restingEnergyKcal(weightKg) * factor;
}
