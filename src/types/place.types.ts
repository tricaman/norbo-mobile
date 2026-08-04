/**
 * Places types — hand-written mirror of the API's places DTOs
 * (norbo-api/src/modules/places/domain/place.ts), following the
 * tool.types.ts convention.
 *
 * Place names are proper nouns from OSM and arrive untranslated; `kind` and
 * `dogAccess` are closed sets localized client-side under
 * `tools.places.*`.
 */

export const PLACE_KINDS = [
  "DOG_PARK",
  "DOG_BEACH",
  "DOG_FRIENDLY_VENUE",
  "DOG_GREEN_AREA",
  "DOG_TRAIL",
  "VETERINARY",
  "PET_SHOP",
  "PET_GROOMING",
  "ANIMAL_SHELTER",
  "ANIMAL_BOARDING",
] as const;

export type PlaceKind = (typeof PLACE_KINDS)[number];

export interface LatLng {
  lat: number;
  lng: number;
}

/** What a map pin needs — the /places/nearby projection. */
export interface PlaceSummary {
  id: string;
  kind: PlaceKind;
  name: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
  city: string | null;
  fenced: boolean | null;
  offLeash: boolean | null;
  lengthKm: number | null;
}

export interface PlacesNearbyResponse {
  items: PlaceSummary[];
  /** True when the server limit clipped the result — show "zoom in". */
  truncated: boolean;
  /** ODbL attribution — MUST be visible on the map surface. */
  attribution: string;
}

/** Everything the detail sheet renders — the /places/:id projection. */
export interface PlaceDetail {
  id: string;
  kind: PlaceKind;
  name: string | null;
  lat: number;
  lng: number;
  geometry: LatLng[] | null;
  lengthKm: number | null;
  country: string;
  region: string | null;
  city: string | null;
  street: string | null;
  housenumber: string | null;
  postcode: string | null;
  phone: string | null;
  website: string | null;
  /** Raw OSM `opening_hours` syntax — rendered verbatim, never parsed. */
  openingHours: string | null;
  fenced: boolean | null;
  offLeash: boolean | null;
  hasWater: boolean | null;
  lit: boolean | null;
  surface: string | null;
  dogAccess: string | null;
  /** openstreetmap.org element URL — powers "report an issue". */
  osmUrl: string | null;
}
