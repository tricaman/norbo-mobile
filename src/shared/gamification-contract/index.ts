// ⚠️  AUTO-GENERATED — DO NOT EDIT.
// Source of truth: norbo-api/src/shared/gamification-contract/index.ts
// Regenerate with `pnpm sync:contracts` in norbo-api.

/**
 * gamification-contract — the shared contract for the badge system.
 *
 * Single source of truth, defined once and consumed by BOTH norbo-api and
 * norbo-mobile. Framework-free on purpose: NO Nest, NO Prisma, NO React, only
 * `zod`. The mobile copy under `norbo-mobile/src/shared/gamification-contract`
 * is generated from this file by `scripts/sync-shared-contracts.mjs` (run
 * `pnpm sync:contracts` in norbo-api) — never edit it by hand.
 *
 * The model in one line: a badge is one METRIC (code) plus a LADDER of four
 * tiers (data in the `badge_tier` table). A tier's condition is always and only
 * `metric >= threshold`.
 *
 * Everything a client renders as text arrives already resolved in the user's
 * language (`Accept-Language` → `resolveLocale`): the client never sees the
 * other translations, and badge/tier copy is deliberately NOT in the app's i18n
 * files. Only the surrounding chrome (screen labels, rarity names, units) is.
 */
import { z } from 'zod';

// ── Rarity ───────────────────────────────────────────────────────────
// The GLOBAL scale, shared by every badge: it drives colour, frame and
// visual language client-side. Orthogonal to a tier's *title*, which is
// per-badge ("Newcomer", "Veteran", …) and comes from the server.
// Members MUST mirror the `BadgeRarity` enum in prisma/schema.prisma.

export const BADGE_RARITIES = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const;
export type BadgeRarity = (typeof BADGE_RARITIES)[number];
export const badgeRaritySchema = z.enum(BADGE_RARITIES);

// ── Metric units ─────────────────────────────────────────────────────
// What `currentValue` / `nextThreshold` are counted in. Supplied by the
// metric provider (code), never by the badge row, and localized
// client-side against a closed set — so the copy reads "25 places", not
// "25 times". Adding a unit costs one entry here plus its singular/plural
// forms in the app's locale files; `count` stays as the generic fallback.

export const METRIC_UNITS = [
  'days',
  'count',
  'places',
  'pets',
  'reminders',
  'expenses',
  'friends',
] as const;
export type MetricUnit = (typeof METRIC_UNITS)[number];
export const metricUnitSchema = z.enum(METRIC_UNITS);

/**
 * Discriminator written into the `data` map of every unlock push, and read
 * back by the mobile `getNavTargetFromData` routing table (which serves both
 * push taps and inbox-row taps).
 */
export const BADGE_DATA_TYPE = 'badge';

// ── Responses ────────────────────────────────────────────────────────

/** One badge as it appears in the grid. Text already localized. */
export interface BadgeSummary {
  readonly id: string;
  /** MaterialCommunityIcons glyph name, rendered client-side. */
  readonly icon: string;
  readonly coverImageUrl: string | null;
  readonly sortOrder: number;
  readonly title: string;
  readonly description: string;
  /** How to earn it — shown while still locked. */
  readonly hint: string;
  readonly unit: MetricUnit;
  /** Number of tiers in the ladder (4 today, read it rather than assume). */
  readonly maxLevel: number;
  /**
   * The user's progress value. This is the MONOTONIC all-time best, never the
   * raw current metric: a value that dropped must not drag the bar backwards.
   */
  readonly currentValue: number;
  /** 0 = nothing unlocked yet (the badge is locked). */
  readonly currentLevel: number;
  readonly currentRarity: BadgeRarity | null;
  readonly currentTierTitle: string | null;
  /** null when the top tier is reached. */
  readonly nextThreshold: number | null;
  readonly nextRarity: BadgeRarity | null;
  /** 0..1 towards the next tier, already clamped. 1 at the top tier. */
  readonly progress: number;
  /** ISO timestamp of the very first unlock, or null. */
  readonly unlockedAt: string | null;
  /** The client celebrates levels `seenLevel + 1 … currentLevel`. */
  readonly seenLevel: number;
}

/** One rung of the ladder, as shown in the detail sheet. */
export interface BadgeTierView {
  readonly level: number;
  readonly rarity: BadgeRarity;
  readonly threshold: number;
  readonly title: string;
  readonly description: string;
  readonly unlocked: boolean;
}

/** A badge plus its full ladder — every tier, including the ones ahead. */
export interface BadgeDetail extends BadgeSummary {
  readonly tiers: readonly BadgeTierView[];
}

// ── Requests ─────────────────────────────────────────────────────────

/**
 * POST /me/badges/seen — acknowledges that the unlock celebration for
 * `level` of `badgeId` has been shown. Idempotent and monotonic: the server
 * never lowers `seenLevel`.
 */
export const markBadgeSeenSchema = z.object({
  badgeId: z.string().min(1),
  level: z.number().int().min(1),
});

export type MarkBadgeSeenPayload = z.infer<typeof markBadgeSeenSchema>;
