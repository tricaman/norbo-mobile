import type {
  GeocodeResult,
  PlaceDetail,
  PlaceKind,
  PlaceSearchResponse,
  PlacesNearbyResponse,
} from "@/types/place.types";
import { api } from "./api";

export interface SearchParams {
  q: string;
  kinds?: PlaceKind[];
  /** Map center — a tiebreaker for equally-relevant hits. */
  lat?: number;
  lng?: number;
}

export interface NearbyParams {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
  /** Omitted = all kinds. Serialized comma-separated. */
  kinds?: PlaceKind[];
  /** Distance origin; the server defaults to the bbox center. */
  lat?: number;
  lng?: number;
  limit?: number;
}

export interface SubmitPlaceInput {
  kind: PlaceKind;
  name: string;
  lat: number;
  lng: number;
  fenced?: boolean | null;
  offLeash?: boolean | null;
  hasWater?: boolean | null;
  lit?: boolean | null;
}

export const placesApi = {
  nearby: ({ kinds, ...box }: NearbyParams) =>
    api.get<PlacesNearbyResponse>("/places/nearby", {
      params: { ...box, kinds: kinds?.join(",") },
    }),
  get: (id: string) =>
    api.get<PlaceDetail>(`/places/${encodeURIComponent(id)}`),
  /** Moderation-first: the place is PENDING until an admin approves it. */
  submit: (input: SubmitPlaceInput) => api.post<{ id: string }>("/places", input),
  /** Search our own places + cities. Free — always tried before any geocoder. */
  search: ({ kinds, ...rest }: SearchParams) =>
    api.get<PlaceSearchResponse>("/places/search", {
      params: { ...rest, kinds: kinds?.join(",") },
    }),
  /**
   * Address geocoding proxy. ANDROID ONLY — the server refuses anything
   * else, because Google's terms forbid pairing these results with the
   * Apple map iOS renders. iOS goes through `geocode.ts` instead.
   */
  geocode: (params: { q: string; platform: "android" }) =>
    api.get<{ results: GeocodeResult[]; unavailable: boolean }>(
      "/places/geocode",
      { params },
    ),
} as const;
