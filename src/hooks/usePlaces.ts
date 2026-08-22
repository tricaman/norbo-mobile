import { placesApi } from "@/services/places.api";
import type { PlaceKind } from "@/types/place.types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

/**
 * Viewport-driven places queries for the places map (`pet-places`).
 *
 * Three load-bearing choices:
 * - the bbox is SNAPPED to 2 decimals (~1.1 km) so a small pan reuses the
 *   cached query key instead of refetching;
 * - `keepPreviousData` so markers stay put (no flicker) while panning;
 * - 24 h staleTime — the underlying OSM import refreshes monthly.
 */

/** Mirrors the server's bbox span cap (norbo-api places/domain/bbox.ts). */
export const MAX_SPAN_DEG = 3;

const SNAP = 100; // 2 decimals ≈ 1.1 km
const snap = (n: number) => Math.round(n * SNAP) / SNAP;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface Bbox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export function regionToBbox(region: MapRegion): Bbox {
  return {
    minLat: region.latitude - region.latitudeDelta / 2,
    minLng: region.longitude - region.longitudeDelta / 2,
    maxLat: region.latitude + region.latitudeDelta / 2,
    maxLng: region.longitude + region.longitudeDelta / 2,
  };
}

/** True at country-level zoom — the query is disabled and a hint is shown. */
export function isRegionTooWide(region: MapRegion): boolean {
  return (
    region.latitudeDelta > MAX_SPAN_DEG || region.longitudeDelta > MAX_SPAN_DEG
  );
}

export function usePlacesNearby(
  region: MapRegion | null,
  kinds: PlaceKind[],
) {
  const bbox = region ? regionToBbox(region) : null;
  const tooWide = region !== null && isRegionTooWide(region);
  const key = bbox
    ? [snap(bbox.minLat), snap(bbox.minLng), snap(bbox.maxLat), snap(bbox.maxLng)]
    : null;

  return useQuery({
    queryKey: ["places", "nearby", key, [...kinds].sort().join(",")],
    queryFn: () => {
      const b = bbox as Bbox;
      return placesApi
        .nearby({
          minLat: snap(b.minLat),
          minLng: snap(b.minLng),
          maxLat: snap(b.maxLat),
          maxLng: snap(b.maxLng),
          kinds,
        })
        .then((r) => r.data);
    },
    enabled: bbox !== null && !tooWide && kinds.length > 0,
    staleTime: DAY_MS,
    gcTime: 7 * DAY_MS,
    placeholderData: keepPreviousData,
  });
}

export function usePlace(id: string | null) {
  return useQuery({
    queryKey: ["places", "detail", id],
    queryFn: () => placesApi.get(id as string).then((r) => r.data),
    enabled: id !== null,
    staleTime: DAY_MS,
  });
}
