/**
 * analytics — telemetry seam.
 *
 * No analytics SDK is wired into the app yet (only
 * `@react-native-firebase/messaging`, for push). This is the single,
 * centralized point where a provider (Firebase Analytics, PostHog, …) will
 * plug in — mirroring the `PremiumGate` passthrough. For now events are
 * dev-logged and dropped in production. When an SDK is adopted, replace the
 * body of `track`; nothing else in the app needs to change.
 */
type AnalyticsProps = Record<
  string,
  string | number | boolean | null | undefined
>;

export const analytics = {
  track(event: string, props?: AnalyticsProps): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[analytics] ${event}`, props ?? {});
    }
  },
};

/** Tool-loader telemetry event names, kept in one place. */
export const ToolAnalyticsEvents = {
  OPENED: "tool_opened",
  COMPLETED: "tool_completed",
} as const;
