import { useDebounce } from "@/hooks/useDebounce";
import type { MapRegion } from "@/hooks/usePlaces";

/**
 * Debounced map region. `onRegionChangeComplete` already fires only at
 * gesture end; the 500 ms debounce is insurance against momentum scrolling
 * chaining several "completes". Combined with the bbox snapping in
 * usePlacesNearby, a full pan down Italy costs about five requests.
 */
export function useDebouncedRegion(
  region: MapRegion | null,
  delayMs = 500,
): MapRegion | null {
  return useDebounce(region, delayMs);
}
