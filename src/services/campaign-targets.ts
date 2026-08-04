/**
 * Symbolic push-campaign target → app route.
 *
 * The API never sends an app path. It sends a SYMBOL (`target`) plus flat
 * string params, and this file is the only place those become expo-router
 * routes. Two consequences worth protecting:
 *
 *  - renaming a route here is a one-file change, and campaigns already
 *    delivered to devices keep working;
 *  - a `target` this build has never heard of resolves to `null`, so an app
 *    older than the campaign just opens normally instead of navigating to a
 *    screen it does not have.
 *
 * Routes are written WITHOUT the expo-router group segment (`/expenses`, not
 * `/(tabs)/expenses`): groups are transparent in URLs, and the same string
 * has to work both for `Linking.openURL("norbo://…")` (push tap) and for
 * `router.push()` (inbox row tap).
 *
 * LOCKSTEP — this table mirrors `enum PushLinkTarget` in norbo-api's
 * prisma/schema.prisma and `LINK_TARGETS` in its push-campaign domain.
 * A member added there needs a case here or campaigns using it will no-op.
 */

/** Discriminator the API writes into every campaign push's `data` map. */
export const CAMPAIGN_DATA_TYPE = "campaign";

/** Non-empty string out of an FCM data bag (all values arrive as strings). */
function str(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

const CAMPAIGN_ROUTES: Record<
  string,
  (data: Record<string, unknown>) => string | null
> = {
  // No navigation: tapping just opens the app where it was.
  NONE: () => null,

  // Per-recipient targets — `petId` was resolved server-side at fan-out.
  // A missing petId still yields null rather than a malformed route, even
  // though the server is not supposed to emit one without it.
  PET_DETAIL: (d) => {
    const id = str(d, "petId");
    return id ? `/pets/${id}` : null;
  },
  PET_ADD_WEIGHT: (d) => {
    const id = str(d, "petId");
    return id ? `/pets/${id}/weights/new` : null;
  },
  PET_ADD_EVENT: (d) => {
    const id = str(d, "petId");
    return id ? `/pets/${id}/events/new` : null;
  },
  PET_BOOKLET: (d) => {
    const id = str(d, "petId");
    return id ? `/pets/${id}/booklet/edit` : null;
  },

  // Static targets.
  PET_LIST: () => "/pets",
  ADD_PET: () => "/pets/new",
  REMINDERS: () => "/reminders",
  ADD_REMINDER: () => "/reminder/new",
  EXPENSES: () => "/expenses",
  NEWS_LIST: () => "/news",
  NEWS_DETAIL: (d) => {
    const id = str(d, "newsId");
    return id ? `/news/${id}` : null;
  },
  TOOLS_HUB: () => "/services",
  TOOL_DETAIL: (d) => {
    const id = str(d, "toolId");
    return id ? `/tool/${id}` : null;
  },
  NOTIFICATIONS: () => "/notifications",
  SETTINGS_NOTIFICATIONS: () => "/settings/notifications",
};

/**
 * Route for a campaign payload, or `null` when it carries nothing navigable
 * (including an unknown target — see the version-skew note above).
 */
export function resolveCampaignTarget(
  data: Record<string, unknown>,
): string | null {
  const target = str(data, "target");
  if (!target) return null;
  return CAMPAIGN_ROUTES[target]?.(data) ?? null;
}
