import { geocodeAddress } from "@/components/tools/places/geocode";
import { placesApi } from "@/services/places.api";
import type {
  CitySearchHit,
  GeocodeResult,
  PlaceKind,
  PlaceSearchHit,
} from "@/types/place.types";
import React from "react";

const MIN_QUERY_LENGTH = 2;

export type SearchStatus = "idle" | "loading" | "done" | "degraded";

interface SearchState {
  cities: CitySearchHit[];
  places: PlaceSearchHit[];
  addresses: GeocodeResult[];
  status: SearchStatus;
}

const EMPTY: SearchState = {
  cities: [],
  places: [],
  addresses: [],
  status: "idle",
};

/**
 * Orchestrates address search for the places map.
 *
 * Always searches our own data first (free), and only asks a geocoder when
 * the server says the local answer wasn't good enough (`confident: false`).
 * That single flag is the cost control: the threshold behind it lives on
 * the server, so it can be retuned with a deploy instead of an app release.
 *
 * Results are memoised per session, so re-submitting a query the user
 * already ran — very common while panning back and forth — is free.
 */
export function useAddressSearch(kinds: PlaceKind[], origin: { lat: number; lng: number } | null) {
  const [query, setQuery] = React.useState("");
  const [state, setState] = React.useState<SearchState>(EMPTY);
  const cache = React.useRef(new Map<string, SearchState>());
  // Guards against a slow earlier search overwriting a newer one.
  const runId = React.useRef(0);

  const clear = React.useCallback(() => {
    setQuery("");
    setState(EMPTY);
  }, []);

  const submit = React.useCallback(async () => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) return;

    const key = `${q.toLowerCase()}|${[...kinds].sort().join(",")}`;
    const cached = cache.current.get(key);
    if (cached) {
      setState(cached);
      return;
    }

    const id = ++runId.current;
    setState((prev) => ({ ...prev, status: "loading" }));

    let local: Awaited<ReturnType<typeof placesApi.search>>["data"] | null = null;
    try {
      local = (await placesApi.search({ q, kinds, ...(origin ?? {}) })).data;
    } catch {
      // Our own search failing is not fatal — fall through to the geocoder.
      local = null;
    }
    if (id !== runId.current) return;

    let addresses: GeocodeResult[] = [];
    let degraded = false;
    if (!local || !local.confident) {
      addresses = await geocodeAddress(q);
      // Nothing anywhere, and the geocoder came back empty: say so rather
      // than leaving the user staring at a blank panel.
      degraded = addresses.length === 0 && !local;
    }
    if (id !== runId.current) return;

    const next: SearchState = {
      cities: local?.cities ?? [],
      places: local?.places ?? [],
      addresses,
      status: degraded ? "degraded" : "done",
    };
    cache.current.set(key, next);
    setState(next);
  }, [query, kinds, origin]);

  return { query, setQuery, submit, clear, ...state };
}
