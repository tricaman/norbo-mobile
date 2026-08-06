import { placesApi } from "@/services/places.api";
import type { GeocodeResult } from "@/types/place.types";
import * as Location from "expo-location";
import { Platform } from "react-native";

/** Street-level zoom for a geocoded address. */
const ADDRESS_SPAN_DEG = 0.01;

/**
 * Address geocoding — the ONLY place in the app that branches on platform.
 *
 * iOS uses Apple's native geocoder (CLGeocoder via expo-location); Android
 * uses our server proxy in front of the Google Geocoding API.
 *
 * This split is a LEGAL requirement, not a preference. Google Maps Platform
 * Service Specific Terms §6.2 forbid using Geocoding results "in
 * conjunction with a non-Google map", and §3.2.3(e) of the main ToS extends
 * that to "with or near". On iOS we render Apple Maps (PROVIDER_DEFAULT in
 * PlacesMapView), so Google results must never reach that screen. On
 * Android we render Google Maps, so the proxy is compliant there.
 *
 * ⚠️ NEVER add a fallback from the iOS branch to the proxy. If Apple's
 * geocoder fails, the correct degradation is "local results only" — routing
 * to Google would recreate exactly the violation this split exists to
 * prevent. The server enforces the same rule independently (it only accepts
 * platform=android), so a mistake here fails loudly rather than silently.
 *
 * Never throws: callers treat an empty array as "no address results".
 */
export async function geocodeAddress(q: string): Promise<GeocodeResult[]> {
  try {
    if (Platform.OS === "ios") {
      // Resolves the string against Apple's service. Free, keyless, and —
      // unlike the Android platform geocoder — needs no location permission,
      // because it geocodes a string rather than reading the device position.
      const results = await Location.geocodeAsync(q);
      return results.slice(0, 3).map((r) => ({
        // CLGeocoder returns coordinates only; the query is the best label
        // we have without a second reverse-geocode round trip.
        formattedAddress: q,
        lat: r.latitude,
        lng: r.longitude,
        spanDeg: ADDRESS_SPAN_DEG,
      }));
    }

    const { data } = await placesApi.geocode({ q, platform: "android" });
    return data.results;
  } catch {
    // Apple throttles CLGeocoder per app/device, and the proxy can be off or
    // rate-limited. Either way the map still works from local results.
    return [];
  }
}
