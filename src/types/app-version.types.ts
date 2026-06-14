export type AppPlatform = "ios" | "android";

/**
 * AppVersionStatus — response of `GET /app/version?platform=<ios|android>`.
 *
 * The backend owns the store-version data; the client compares its own
 * installed version against these fields to decide the gate level (see
 * `useAppVersion`):
 *   - installed < `minSupported`  → forced, blocking update.
 *   - installed < `latest`        → soft, dismissible prompt.
 *
 * NOTE: this endpoint must be implemented in `norbo-api`. It should be public
 * (no auth) so the check also runs on the auth/onboarding screens, and should
 * read the current values from configuration (not hardcoded), e.g.:
 *
 *   GET /app/version?platform=ios
 *   → { "latest": "1.6.0", "minSupported": "1.5.0",
 *       "storeUrl": "https://apps.apple.com/app/id000000000" }
 */
export interface AppVersionStatus {
  /** Latest version available on the store, e.g. "1.6.0". */
  latest: string;
  /** Oldest version still allowed to run; below it the app is blocked. */
  minSupported: string;
  /**
   * Deep link to the app's store page for this platform. Optional — when
   * absent the client builds a fallback URL from the bundle id / store id in
   * `app.config.ts` extra (see `fallbackStoreUrl`).
   */
  storeUrl?: string | null;
}
