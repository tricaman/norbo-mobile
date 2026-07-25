// ⚠️  AUTO-GENERATED — DO NOT EDIT.
// Source of truth: norbo-api/src/shared/news-contract/index.ts
// Regenerate with `pnpm sync:contracts` in norbo-api.

/**
 * news-contract — the shared contract for the News / Announcements feature.
 *
 * Single source of truth, defined once and consumed by BOTH norbo-api
 * and norbo-mobile. Framework-free on purpose: NO Nest, NO React, only
 * `zod`. The mobile copy under `norbo-mobile/src/shared/news-contract`
 * is generated from this file by `scripts/sync-shared-contracts.mjs`
 * (run `pnpm sync:contracts` in norbo-api) — never edit it by hand.
 *
 * Separation of concerns — this file owns ONLY what crosses the wire and
 * must be identical on both sides:
 *   - `NewsCategory`   the closed enum used for the badge/icon/filter. It
 *                      never changes routing or behaviour — purely cosmetic.
 *   - `ResolvedNews`   the wire shape the mobile app receives (already
 *                      resolved to one language; other translations never
 *                      reach the client).
 *
 * What does NOT belong here:
 *   - the per-item translated title/body → lives DB-side (the `translations`
 *     JSON on the `news` row), served already resolved. Matching the
 *     services-contract discipline: the contract owns the enum + wire shape,
 *     never the content.
 *
 * INVARIANT: the members of `NewsCategory` here MUST be identical to the
 * Prisma `NewsCategory` enum in `prisma/schema.prisma`.
 */
import { z } from 'zod';

/**
 * Closed set of news categories. Cosmetic only (badge/icon/filter) — it does
 * NOT change behaviour or routing. Mirrors the Prisma `NewsCategory` enum.
 */
export enum NewsCategory {
  PRODUCT = 'PRODUCT',
  CARE_TIP = 'CARE_TIP',
  MAINTENANCE = 'MAINTENANCE',
  GENERAL = 'GENERAL',
}

/** Zod enum built from the members above (for wire/DTO validation). */
export const newsCategoryEnum = z.enum(
  Object.values(NewsCategory) as [NewsCategory, ...NewsCategory[]],
);

/**
 * ResolvedNews — a news item as served to the mobile app for a given locale.
 * `title`/`body` are already resolved to the request language (translation if
 * present, else base English). `publishedAt` is an ISO timestamp string on the
 * wire. The client never sees the other translations or the draft state.
 */
export const resolvedNewsSchema = z.object({
  id: z.string(),
  category: newsCategoryEnum,
  title: z.string(),
  body: z.string(),
  coverImageUrl: z.string().nullable(),
  publishedAt: z.string(),
});

export type ResolvedNews = z.infer<typeof resolvedNewsSchema>;
