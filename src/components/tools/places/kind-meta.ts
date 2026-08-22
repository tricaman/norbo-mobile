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
 * The SPECIES-NEUTRAL layers: the pet services every owner needs, whatever
 * animal they live with. Nothing here mentions a species, so these are the
 * layers every user gets by default.
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

/** One filter section in the map's layer drawer. */
export interface KindGroup {
  /** Stable id — also the key for anything per-group we add later. */
  id: string;
  labelKey: string;
  kinds: PlaceKind[];
}

/**
 * The drawer's sections, in render order. This is the ONE place that decides
 * how layers are grouped: `PlaceFilterDrawer` renders it blindly, so a new
 * group (other species, amenity filters) is one entry here plus one i18n key —
 * no UI change. Services come first: they are relevant to every owner, and
 * `kinds[0]` doubles as the default kind of the add-place form, which must
 * stay species-neutral.
 */
export const KIND_GROUPS: KindGroup[] = [
  {
    id: "services",
    labelKey: "tools.places.group.services",
    kinds: PET_SERVICE_KINDS,
  },
  { id: "dogs", labelKey: "tools.places.group.dogs", kinds: DOG_ONLY_KINDS },
];

/**
 * Every layer the places map exposes, in group order. Derived from
 * `KIND_GROUPS` so the two can never disagree.
 */
export const ALL_PLACE_KINDS: PlaceKind[] = KIND_GROUPS.flatMap((g) => g.kinds);

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
