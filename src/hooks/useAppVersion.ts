import { appVersionApi } from "@/services/app-version.api";
import { fallbackStoreUrl } from "@/utils/store-url";
import { compareVersions } from "@/utils/version";
import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Platform } from "react-native";

export type UpdateLevel = "ok" | "available" | "required";

export interface AppVersionGate {
  /** "required" → block; "available" → soft prompt; "ok" → nothing. */
  level: UpdateLevel;
  /** Latest store version, or null when unknown. */
  latest: string | null;
  /** Where the "update now" button should send the user, or null. */
  storeUrl: string | null;
}

const CURRENT = Constants.expoConfig?.version ?? "0.0.0";
const IS_NATIVE = Platform.OS === "ios" || Platform.OS === "android";

/**
 * useAppVersion — backend-driven update gate.
 *
 * Fetches the store-version status once per launch (cached 30 min) and
 * compares it with the installed version. Deliberately FAIL-OPEN: while the
 * request is loading or if it errors (offline, endpoint not deployed yet), it
 * returns "ok" so the app is never blocked by a check that couldn't run.
 */
export function useAppVersion(): AppVersionGate {
  const platform = Platform.OS === "ios" ? "ios" : "android";

  const { data } = useQuery({
    queryKey: ["app-version", platform, CURRENT],
    queryFn: () => appVersionApi.status(platform, CURRENT).then((r) => r.data),
    enabled: IS_NATIVE,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  if (!data) return { level: "ok", latest: null, storeUrl: null };

  // `||` (not `??`) on purpose: the backend may return an empty string for a
  // missing store URL, and that must fall back to the built one — `??` would
  // only catch null/undefined and leave "", silently disabling the gate below.
  const storeUrl = data.storeUrl || fallbackStoreUrl();

  // A prompt the user can't act on is worse than none. With no resolvable
  // store URL (e.g. iOS not on the App Store yet, so no id configured), keep
  // the gate fully off — this also prevents a forced block with a dead
  // "update now" button. So a platform stays silent until it's truly
  // installable from a store.
  if (!storeUrl) return { level: "ok", latest: data.latest, storeUrl: null };

  let level: UpdateLevel = "ok";
  if (compareVersions(CURRENT, data.minSupported) < 0) level = "required";
  else if (compareVersions(CURRENT, data.latest) < 0) level = "available";

  return { level, latest: data.latest, storeUrl };
}
