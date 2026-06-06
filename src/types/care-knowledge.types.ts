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
