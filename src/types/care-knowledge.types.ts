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
