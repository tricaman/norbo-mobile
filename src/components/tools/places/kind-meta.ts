import type { PlaceKind } from "@/types/place.types";

/**
 * KIND_META — the single source for anything PlaceKind-specific in the UI
 * (mirrors the CATEGORY_META pattern): MaterialCommunityIcons glyph +
 * client-side i18n label key. Kind labels are a closed set localized here —
 * the server deliberately sends none.
 */
export const KIND_META: Record<
  PlaceKind,
  { icon: string; labelKey: string }
> = {
  DOG_PARK: { icon: "dog-side", labelKey: "tools.places.kind.DOG_PARK" },
  DOG_BEACH: { icon: "beach", labelKey: "tools.places.kind.DOG_BEACH" },
  DOG_FRIENDLY_VENUE: {
    icon: "silverware-fork-knife",
    labelKey: "tools.places.kind.DOG_FRIENDLY_VENUE",
  },
  DOG_GREEN_AREA: { icon: "tree", labelKey: "tools.places.kind.DOG_GREEN_AREA" },
  DOG_TRAIL: { icon: "hiking", labelKey: "tools.places.kind.DOG_TRAIL" },
  VETERINARY: { icon: "medical-bag", labelKey: "tools.places.kind.VETERINARY" },
  PET_SHOP: { icon: "paw", labelKey: "tools.places.kind.PET_SHOP" },
  PET_GROOMING: {
    icon: "content-cut",
    labelKey: "tools.places.kind.PET_GROOMING",
  },
  ANIMAL_SHELTER: {
    icon: "home-heart",
    labelKey: "tools.places.kind.ANIMAL_SHELTER",
  },
  ANIMAL_BOARDING: {
    icon: "bed-outline",
    labelKey: "tools.places.kind.ANIMAL_BOARDING",
  },
};

/**
 * Layers of the SPECIES-NEUTRAL tool (`pet-places`): the pet services every
 * owner needs, whatever animal they live with. Nothing here mentions a
 * species — that is what makes the tool public to all owners.
 */
export const PET_SERVICE_KINDS: PlaceKind[] = [
  "VETERINARY",
  "PET_SHOP",
  "PET_GROOMING",
  "ANIMAL_SHELTER",
  "ANIMAL_BOARDING",
];

/** The dog-only layers — places that exist BECAUSE the animal is a dog. */
export const DOG_ONLY_KINDS: PlaceKind[] = [
  "DOG_PARK",
  "DOG_BEACH",
  "DOG_FRIENDLY_VENUE",
  "DOG_GREEN_AREA",
  "DOG_TRAIL",
];

/**
 * Layers of the DOG tool (`dog-friendly-places`, all on by default): the
 * superset — dog-only layers PLUS the shared services, so a dog owner still
 * gets one single map instead of hopping between two tools.
 */
export const DOG_KINDS: PlaceKind[] = [
  ...DOG_ONLY_KINDS,
  ...PET_SERVICE_KINDS,
];

/**
 * Kinds for which the outdoor amenity flags (fenced / off-leash / water /
 * lit) are meaningful. On a vet or a boarding facility they are noise, so
 * the submission form hides them.
 */
const OUTDOOR_KINDS = new Set<PlaceKind>([
  "DOG_PARK",
  "DOG_BEACH",
  "DOG_GREEN_AREA",
  "DOG_TRAIL",
]);

export function supportsOutdoorAmenities(kind: PlaceKind): boolean {
  return OUTDOOR_KINDS.has(kind);
}

/**
 * Version-skew hardening: a newer server may serve kind values this build
 * doesn't know (e.g. via the detail endpoint after a reclassification).
 * Always deref KIND_META through this helper — a bare KIND_META[kind] throws
 * on unknown kinds.
 */
export function getKindMeta(kind: string): { icon: string; labelKey: string | null } {
  return (KIND_META as Record<string, { icon: string; labelKey: string }>)[
    kind
  ] ?? { icon: "paw", labelKey: null };
}

/** Human fallback when the label key is unknown to this build. */
export function fallbackKindLabel(kind: string): string {
  return kind.toLowerCase().replace(/_/g, " ");
}
