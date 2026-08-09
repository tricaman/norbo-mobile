import type { BadgeRarity } from "@/types/badge.types";
import { useUnistyles } from "react-native-unistyles";

/**
 * RARITY_META — everything rarity-specific in one place (the BADGE_META /
 * KIND_META pattern). Rarity is the GLOBAL scale shared by every badge: it
 * drives colour and the "this one is special" treatment. It is orthogonal to a
 * tier's title, which is per-badge and arrives from the server.
 *
 * `glow` turns on NorboPressable's `premium` halo. Reserved for EPIC and
 * LEGENDARY on purpose — if everything glows, nothing does.
 */
export const RARITY_META: Record<
  BadgeRarity,
  {
    tone: "neutral" | "info" | "primary" | "accent";
    labelKey: string;
    glow: boolean;
  }
> = {
  COMMON: {
    tone: "neutral",
    labelKey: "badges.rarity.COMMON",
    glow: false,
  },
  RARE: {
    tone: "info",
    labelKey: "badges.rarity.RARE",
    glow: false,
  },
  EPIC: {
    tone: "primary",
    labelKey: "badges.rarity.EPIC",
    glow: true,
  },
  LEGENDARY: {
    tone: "accent",
    labelKey: "badges.rarity.LEGENDARY",
    glow: true,
  },
};

/**
 * Version-skew hardening: a newer server can send a rarity this build does not
 * know. Always resolve through this helper — it returns null and the caller
 * falls back to the neutral look instead of crashing on a missing key.
 */
export function getRarityMeta(
  rarity: string | null | undefined,
): (typeof RARITY_META)[BadgeRarity] | null {
  if (!rarity) return null;
  return (
    (RARITY_META as Record<string, (typeof RARITY_META)[BadgeRarity]>)[
      rarity
    ] ?? null
  );
}

export interface RarityColors {
  fg: string;
  bg: string;
  border: string;
}

/**
 * Resolves a rarity to theme colours. A null/unknown rarity — and a locked
 * badge, which has no rarity yet — gets the quiet neutral treatment.
 */
export function useRarityColors(
  rarity: BadgeRarity | string | null | undefined,
): RarityColors {
  const { theme } = useUnistyles();
  const meta = getRarityMeta(rarity);

  switch (meta?.tone) {
    case "info":
      return {
        fg: theme.colors.info,
        bg: theme.colors.infoSoft,
        border: theme.colors.infoBorder,
      };
    case "primary":
      return {
        fg: theme.colors.primary,
        bg: theme.colors.primarySoft,
        border: theme.colors.primaryBorder,
      };
    case "accent":
      return {
        fg: theme.colors.accent,
        bg: theme.colors.accentSoft,
        border: theme.colors.accentBorder,
      };
    default:
      return {
        fg: theme.colors.textSecondary,
        bg: theme.colors.surface2,
        border: theme.colors.border,
      };
  }
}
