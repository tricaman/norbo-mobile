import type {
  PlaceDetail,
  PlaceKind,
  PlacesNearbyResponse,
} from "@/types/place.types";
import { api } from "./api";

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
} as const;
