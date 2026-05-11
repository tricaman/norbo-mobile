import { PetCategory } from "@/types/pet.types";

/**
 * Weight conversion + formatting helpers.
 *
 * Canonical storage unit is **integer milligrams** (`weightMg` on
 * `WEIGHT_RECORD` PetEvent.extra). Clients pick a display unit per
 * input and convert to mg before submit; for display they pick the
 * most natural unit for the pet's size.
 */

export const WEIGHT_UNITS = ["mg", "g", "kg", "oz", "lb"] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

/** Canonical conversion factors: 1 unit → milligrams. */
const TO_MG: Record<WeightUnit, number> = {
  mg: 1,
  g: 1_000,
  kg: 1_000_000,
  oz: 28_349.5,
  lb: 453_592,
};

/**
 * Convert a numeric value in `unit` into integer milligrams.
 * Returns `null` for non-positive / non-finite values.
 */
export function toMilligrams(value: number, unit: WeightUnit): number | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * TO_MG[unit]);
}

/** Convert milligrams into the requested display unit (float). */
export function fromMilligrams(mg: number, unit: WeightUnit): number {
  return mg / TO_MG[unit];
}

/**
 * Pick the most readable unit for a given mg value, biased to the
 * pet's category so spiders read in mg/g and dogs in kg.
 */
export function pickDisplayUnit(
  mg: number,
  category?: PetCategory,
): WeightUnit {
  if (category === PetCategory.INVERTEBRATE) {
    if (mg < 1_000) return "mg";
    return "g";
  }
  if (mg >= 1_000_000) return "kg";
  if (mg >= 1_000) return "g";
  return "mg";
}

/** Format mg as "12.3 kg" / "450 g" / "12 mg". */
export function formatWeight(
  mg: number,
  options: { unit?: WeightUnit; category?: PetCategory } = {},
): string {
  const unit = options.unit ?? pickDisplayUnit(mg, options.category);
  const value = fromMilligrams(mg, unit);
  // Integer for mg/g of small pets, 1 decimal otherwise, strip trailing zeros.
  const fixed =
    unit === "mg" || (unit === "g" && value >= 100)
      ? Math.round(value).toString()
      : value.toFixed(value < 10 ? 2 : 1).replace(/\.?0+$/, "");
  return `${fixed} ${unit}`;
}

/**
 * Default unit suggested for a pet category when the user has not
 * yet logged any weight (and therefore we have no last-used unit).
 */
export function defaultUnitForCategory(category: PetCategory): WeightUnit {
  switch (category) {
    case PetCategory.INVERTEBRATE:
      return "g";
    case PetCategory.AMPHIBIAN:
    case PetCategory.REPTILE:
    case PetCategory.BIRD:
    case PetCategory.FISH_FRESHWATER:
    case PetCategory.FISH_SALTWATER:
    case PetCategory.MAMMAL_SMALL:
      return "g";
    case PetCategory.MAMMAL_DOG:
    case PetCategory.MAMMAL_CAT:
    case PetCategory.EQUINE:
    case PetCategory.FARM:
    default:
      return "kg";
  }
}
