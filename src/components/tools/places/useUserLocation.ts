import * as Location from "expo-location";
import React from "react";

/**
 * On-demand user location for the places map.
 *
 * Rules (the feature is won or lost here):
 * - NEVER auto-prompts on mount — `request()` is called from the "near me"
 *   FAB, after the in-app rationale.
 * - Granted → last-known position first (instant recenter), then a Balanced
 *   `getCurrentPositionAsync` refine. NEVER `watchPositionAsync` — needless
 *   battery drain for a static map.
 * - Denied → nothing breaks; `canAskAgain: false` means the system prompt
 *   won't show again and the caller should point to Settings instead.
 * - Location services off system-wide → getCurrentPositionAsync throws;
 *   caught, surfaced as null.
 */
export interface UserLocationState {
  granted: boolean;
  /** False once iOS/Android will no longer show the system prompt. */
  canAskAgain: boolean;
  coords: { latitude: number; longitude: number } | null;
}

export function useUserLocation() {
  const [state, setState] = React.useState<UserLocationState>({
    granted: false,
    canAskAgain: true,
    coords: null,
  });

  // Reflect an already-granted permission (e.g. a previous session) without
  // ever prompting.
  React.useEffect(() => {
    let alive = true;
    void Location.getForegroundPermissionsAsync().then((p) => {
      if (alive) {
        setState((s) => ({ ...s, granted: p.granted, canAskAgain: p.canAskAgain }));
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  /** Ask (if needed) and locate. Returns the coords, or null. */
  const request = React.useCallback(async (): Promise<{
    latitude: number;
    longitude: number;
  } | null> => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setState((s) => ({
          ...s,
          granted: false,
          canAskAgain: perm.canAskAgain,
        }));
        return null;
      }
      // Instant recenter from the cache…
      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        const coords = {
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
        };
        setState({ granted: true, canAskAgain: true, coords });
      }
      // …then refine.
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setState({ granted: true, canAskAgain: true, coords });
      return coords;
    } catch {
      // Location services off system-wide, or a transient failure.
      return null;
    }
  }, []);

  return { ...state, request };
}
