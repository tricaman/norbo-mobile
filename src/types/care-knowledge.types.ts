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
  /** Optional (additive): UVB requirement note key. */
  uvbKey?: string;
  /** Optional (additive): extra husbandry note keys. */
  noteKeys?: string[];
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

/** Mirrors `GET /care-knowledge/bird-housing?species=` (generic fallback). */
export interface BirdHousingGuideline {
  species: string;
  nameKey: string;
  minWidthCm: number;
  minDepthCm: number;
  minHeightCm: number;
  baseBirds: number;
  extraWidthPerBirdCm: number;
  barSpacingMm: EnvRange;
  noteKeys: string[];
}

/** Mirrors `GET /care-knowledge/bird-feeding?species=` (generic fallback). */
export interface BirdFeedingGuideline {
  species: string;
  nameKey: string;
  typicalWeightG: EnvRange;
  dryFoodGramsPer100g: number;
  freshVegPct: EnvRange;
  dietKey: string;
  noteKeys: string[];
}

/** Mirrors `GET /care-knowledge/bird-environment` items (curated content). */
export interface BirdEnvironmentProfile {
  id: string;
  nameKey: string;
  aliases: string[];
  tempC: EnvRange;
  humidityPct: EnvRange;
  daylightHours: EnvRange;
  sleepHours: EnvRange;
  hazardKeys: string[];
}

export type SnakeAgeBand = "HATCHLING" | "JUVENILE" | "ADULT";

export interface SnakeFeedingBand {
  ageBand: SnakeAgeBand;
  intervalDays: EnvRange;
  /** Prey mass as % of snake body mass; 0/0 when weight-based sizing is N/A. */
  preyPctBodyWeight: EnvRange;
  preyTypeKey: string;
}

/** Mirrors `GET /care-knowledge/snake-feeding?species=` (generic fallback). */
export interface SnakeFeedingGuideline {
  species: string;
  nameKey: string;
  aliases: string[];
  girthRuleKey: string;
  bands: SnakeFeedingBand[];
  noteKeys: string[];
}

/** Mirrors `GET /care-knowledge/turtle-tank?species=` (generic fallback). */
export interface TurtleTankGuideline {
  species: string;
  nameKey: string;
  aliases: string[];
  litersPerShellCm: number;
  extraLitersPerShellCmPerTurtle: number;
  minWaterDepthFactor: number;
  waterTempC: EnvRange;
  baskingTempC: EnvRange;
  uvbNoteKey: string;
  noteKeys: string[];
}

export type AmphibianHabitat =
  | "AQUATIC"
  | "SEMI_AQUATIC"
  | "TERRESTRIAL"
  | "ARBOREAL";

/** Mirrors `GET /care-knowledge/amphibian-environment` items (curated content). */
export interface AmphibianEnvironmentProfile {
  id: string;
  nameKey: string;
  aliases: string[];
  habitat: AmphibianHabitat;
  airTempC: EnvRange | null;
  waterTempC: EnvRange | null;
  humidityPct: EnvRange | null;
  waterNoteKeys: string[];
  tankNoteKey: string;
}

/** Mirrors `GET /care-knowledge/chicken-coop` (per-hen coefficients). */
export interface ChickenCoopConfig {
  floorM2PerHen: number;
  runM2PerHen: number;
  hensPerNestBox: number;
  roostCmPerHen: number;
  sizeFactors: Record<"BANTAM" | "STANDARD" | "HEAVY", number>;
  noteKeys: string[];
}

/** Mirrors `GET /care-knowledge/livestock-water?species=` (generic fallback). */
export interface WaterGuideline {
  species: string;
  nameKey: string;
  /** PER_HEAD: L/day per animal (count input). PER_KG: L/day per kg (weight input). */
  basis: "PER_HEAD" | "PER_KG";
  minPerUnit: number;
  maxPerUnit: number;
  noteKeys: string[];
}

/** Mirrors `GET /care-knowledge/forage-ration?species=` (generic fallback). */
export interface ForageGuideline {
  species: string;
  nameKey: string;
  dmPercentMin: number;
  dmPercentMax: number;
  noteKeys: string[];
}
