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
  DOG_PARK: { icon: "dog-side", labelKey: "tools.dogFriendlyPlaces.kind.DOG_PARK" },
  DOG_BEACH: { icon: "beach", labelKey: "tools.dogFriendlyPlaces.kind.DOG_BEACH" },
  DOG_FRIENDLY_VENUE: {
    icon: "silverware-fork-knife",
    labelKey: "tools.dogFriendlyPlaces.kind.DOG_FRIENDLY_VENUE",
  },
  DOG_GREEN_AREA: { icon: "tree", labelKey: "tools.dogFriendlyPlaces.kind.DOG_GREEN_AREA" },
  DOG_TRAIL: { icon: "hiking", labelKey: "tools.dogFriendlyPlaces.kind.DOG_TRAIL" },
  VETERINARY: { icon: "medical-bag", labelKey: "tools.dogFriendlyPlaces.kind.VETERINARY" },
  PET_SHOP: { icon: "paw", labelKey: "tools.dogFriendlyPlaces.kind.PET_SHOP" },
  PET_GROOMING: {
    icon: "content-cut",
    labelKey: "tools.dogFriendlyPlaces.kind.PET_GROOMING",
  },
  ANIMAL_SHELTER: {
    icon: "home-heart",
    labelKey: "tools.dogFriendlyPlaces.kind.ANIMAL_SHELTER",
  },
  ANIMAL_BOARDING: {
    icon: "bed-outline",
    labelKey: "tools.dogFriendlyPlaces.kind.ANIMAL_BOARDING",
  },
};

/** Layers of the DOG tool (all on by default). */
export const DOG_KINDS: PlaceKind[] = [
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
];

/** Layers of the CAT tool: what OSM data actually supports for cats. */
export const CAT_KINDS: PlaceKind[] = [
  "VETERINARY",
  "PET_SHOP",
  "PET_GROOMING",
  "ANIMAL_SHELTER",
  "ANIMAL_BOARDING",
];

/** @deprecated alias kept for the dog tool's existing import. */
export const DEFAULT_KINDS = DOG_KINDS;
