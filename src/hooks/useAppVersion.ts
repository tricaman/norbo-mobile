import { appVersionApi } from "@/services/app-version.api";
import { checkPlayUpdate, startStoreUpdate } from "@/services/in-app-updates";
import { fallbackStoreUrl } from "@/utils/store-url";
import { compareVersions } from "@/utils/version";
import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useCallback, useEffect } from "react";
import { AppState, Platform } from "react-native";

export type UpdateLevel = "ok" | "available" | "required";

export interface AppVersionGate {
  /** "required" → block; "available" → header icon + card; "ok" → nothing. */
  level: UpdateLevel;
  /**
   * Runs the update: in-app (Play Core) on Android when Play can serve it,
   * the store page otherwise (always the case on iOS).
   */
  startUpdate: () => void;
}

const CURRENT = Constants.expoConfig?.version ?? "0.0.0";
const IS_NATIVE = Platform.OS === "ios" || Platform.OS === "android";
const STALE_TIME = 1000 * 60 * 30;

/**
 * DEV ONLY: forces the level so the card / blocking screen can be exercised
 * locally, where no store serves a real update to a local build. Set
 * `EXPO_PUBLIC_APP_UPDATE_DEV_LEVEL=available|required` in `.env` and reload;
 * the download is simulated too (see `in-app-updates.ts`). Always off in
 * production (`__DEV__` false).
 */
const DEV_LEVEL: UpdateLevel | undefined = __DEV__
  ? (process.env.EXPO_PUBLIC_APP_UPDATE_DEV_LEVEL as UpdateLevel | undefined)
  : undefined;

/**
 * useAppVersion — update gate.
 *
 * Two sources, with different jobs:
 *   - the backend (`GET /app/version`) owns WHETHER a newer version exists
 *     (`latest`, read live from the stores) and whether this one is too old
 *     to keep running (`minSupported`, an env-only ops decision);
 *   - Play Core (Android only) owns HOW to install it: it answers "can this
 *     device update in-app right now?", which is false for sideloaded APKs
 *     and during a staged rollout that hasn't reached the device yet.
 *
 * On Android the two are OR-ed for detection, so the prompt still appears if
 * one of them is blind (e.g. no Play service account configured on the API).
 * Blocking additionally REQUIRES something installable: a forced screen whose
 * button leads nowhere is a dead end, so `required` only fires when an update
 * was actually detected.
 *
 * Deliberately FAIL-OPEN: while the requests load or if they error (offline,
 * app not published yet), the level stays "ok" and the app is never blocked
 * by a check that couldn't run.
 */
export function useAppVersion(): AppVersionGate {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  // With the dev override on we skip both queries (no store/backend calls).
  const enabled = IS_NATIVE && !DEV_LEVEL;

  const { data, refetch: refetchStatus } = useQuery({
    queryKey: ["app-version", platform, CURRENT],
    queryFn: () => appVersionApi.status(platform, CURRENT).then((r) => r.data),
    enabled,
    staleTime: STALE_TIME,
    retry: 1,
  });

  const { data: playHasUpdate, refetch: refetchPlay } = useQuery({
    queryKey: ["app-version", "play", CURRENT],
    queryFn: () => checkPlayUpdate(CURRENT),
    enabled: enabled && platform === "android",
    staleTime: STALE_TIME,
    retry: 1,
  });

  // Re-check on every return to foreground, not just at cold start: a release
  // published (or a minimum version raised) while the app sat in the
  // background is then caught the first time the user comes back.
  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void refetchStatus();
      void refetchPlay();
    });
    return () => sub.remove();
  }, [enabled, refetchStatus, refetchPlay]);

  const inApp = playHasUpdate === true;

  // `||` (not `??`) on purpose: the backend may return an empty string for a
  // missing store URL, and that must fall back to the built one — `??` would
  // only catch null/undefined and leave "", silently disabling the gate below.
  const storeUrl = data?.storeUrl || fallbackStoreUrl();

  const level = DEV_LEVEL ?? resolveLevel(data, inApp, storeUrl);

  const startUpdate = useCallback(() => {
    void startStoreUpdate({
      forced: level === "required",
      inApp,
      storeUrl,
    });
  }, [level, inApp, storeUrl]);

  return { level, startUpdate };
}

function resolveLevel(
  data: { latest: string; minSupported: string } | undefined,
  inApp: boolean,
  storeUrl: string | null,
): UpdateLevel {
  // Nothing actionable: no in-app flow and nowhere to send the user (e.g. iOS
  // before the App Store id is known). Staying silent beats a dead button.
  if (!inApp && !storeUrl) return "ok";

  const backendHasUpdate = data
    ? compareVersions(CURRENT, data.latest) < 0
    : false;
  if (!backendHasUpdate && !inApp) return "ok";

  const belowMinimum = data
    ? compareVersions(CURRENT, data.minSupported) < 0
    : false;
  return belowMinimum ? "required" : "available";
}
