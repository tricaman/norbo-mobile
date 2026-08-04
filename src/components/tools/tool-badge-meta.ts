import type { ToolBadge } from "@/types/tool.types";

/**
 * BADGE_META — the single source for anything ToolBadge-specific in the UI
 * (mirrors the KIND_META / CATEGORY_META pattern): icon glyph, i18n label key
 * and colour tone. Badge labels are a closed set localized client-side — the
 * server sends the enum value only.
 *
 * `tone` maps onto the theme colour families, resolved by ToolBadgeChip:
 * - "accent"  → the flagship look (PREMIUM_FREE: premium-grade, free for all)
 * - "primary" → a positive, low-key highlight (NEW)
 * - "neutral" → informative, deliberately quiet (BETA)
 */
export const BADGE_META: Record<
  ToolBadge,
  { icon: string; labelKey: string; tone: "accent" | "primary" | "neutral" }
> = {
  PREMIUM_FREE: {
    icon: "star-four-points",
    labelKey: "servicesHub.badge.PREMIUM_FREE",
    tone: "accent",
  },
  NEW: {
    icon: "creation",
    labelKey: "servicesHub.badge.NEW",
    tone: "primary",
  },
  BETA: {
    icon: "flask-outline",
    labelKey: "servicesHub.badge.BETA",
    tone: "neutral",
  },
};

/**
 * Version-skew hardening: a newer server can serve a badge value this build
 * doesn't know. Always resolve through this helper — it returns null so the
 * caller simply renders nothing instead of crashing on a missing key.
 */
export function getToolBadgeMeta(
  badge: string | null | undefined,
): (typeof BADGE_META)[ToolBadge] | null {
  if (!badge) return null;
  return (BADGE_META as Record<string, (typeof BADGE_META)[ToolBadge]>)[badge] ?? null;
}
