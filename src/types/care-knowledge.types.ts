/** Inclusive target range for an environmental parameter. */
export interface EnvRange {
  min: number;
  max: number;
}

/** Mirrors `GET /care-knowledge/reptile-environment` items (curated content). */
export interface ReptileEnvironmentProfile {
  id: string;
  nameKey: string;
  aliases: string[];
  baskingTempC: EnvRange;
  coolTempC: EnvRange;
  humidityPct: EnvRange;
}

export type ToxicityRisk = "SAFE" | "CAUTION" | "TOXIC";

/** Mirrors `GET /care-knowledge/toxicity?category=` items. */
export interface ToxicityItem {
  category: string;
  names: string[];
  risk: ToxicityRisk;
  noteKey: string;
}

export interface BcsOption {
  labelKey: string;
  score: number;
}
export interface BcsQuestion {
  promptKey: string;
  options: BcsOption[];
}
export interface BcsBand {
  maxScore: number;
  interpretationKey: string;
}
/** Mirrors `GET /care-knowledge/bcs?category=` (or null when unsupported). */
export interface BcsScale {
  category: string;
  scaleNameKey: string;
  questions: BcsQuestion[];
  bands: BcsBand[];
}

export type DogSize = "TOY" | "SMALL" | "MEDIUM" | "LARGE" | "GIANT";
export type DogAgeBand = "PUPPY" | "ADULT" | "SENIOR";

export interface DogActivityGuideline {
  size: DogSize;
  ageBand: DogAgeBand;
  minMinutes: number;
  maxMinutes: number;
  intensity: "LOW" | "MODERATE" | "HIGH";
}

export interface PuppyMilestone {
  size: DogSize;
  nameKey: string;
  fromWeeks: number;
  toWeeks: number;
}

export interface WeightRange {
  min: number;
  max: number;
}
export interface DogBreedStandard {
  breedId: string;
  nameKey: string;
  size: DogSize;
  male: WeightRange;
  female: WeightRange;
}

export type CatFoodType = "DRY" | "WET" | "MIXED";

export interface CatLitterGuidance {
  recommendedBoxLengthCm: number;
  noteKeys: string[];
}
export interface CatFoodEnergy {
  wetKcalPer100g: number;
  dryKcalPer100g: number;
  maintenanceFactor: number;
}
export interface CatHydration {
  mlPerKg: number;
  foodWaterFraction: Record<CatFoodType, number>;
  noteKeys: string[];
}

export interface SafeTemperature {
  species: string;
  nameKey: string;
  minC: number;
  maxC: number;
  heatRiskC: number;
  torporRiskC: number | null;
  behaviorNoteKeys: string[];
}
export interface RationGuideline {
  species: string;
  nameKey: string;
  hayKey: string;
  pelletGramsPerKg: number;
  vegGramsPerKg: number;
  noteKeys: string[];
}
export interface EnclosureGuideline {
  species: string;
  nameKey: string;
  minFloorAreaCm2: number;
  minHeightCm: number;
  perAdditionalAreaCm2: number;
  enrichmentNoteKeys: string[];
}
export interface HayConfig {
  gramsPerKgPerDay: number;
}
