import { PetCategory } from "@/types/pet.types";

/**
 * Per-category presentation metadata for the pet creation wizard.
 *
 * `icon`     — MaterialCommunityIcons glyph used everywhere a category
 *              is depicted (selection card, hero card, confirm screen).
 * `tint`     — warm illustrative background used by the hero / empty
 *              state. Must read well against `colors.textPrimary` and
 *              be theme-agnostic (we always render the icon in white
 *              with a coloured background, like an iOS app icon).
 * `taglineKey` — i18n key for the short subtitle on the category card.
 */
export interface PetCategoryMeta {
  icon: string;
  tint: string;
  taglineKey: `petWizard.taglines.${PetCategory}`;
}

export const CATEGORY_META: Record<PetCategory, PetCategoryMeta> = {
  [PetCategory.MAMMAL_DOG]: {
    icon: "dog",
    tint: "#A87358",
    taglineKey: "petWizard.taglines.MAMMAL_DOG",
  },
  [PetCategory.MAMMAL_CAT]: {
    icon: "cat",
    tint: "#C18B5C",
    taglineKey: "petWizard.taglines.MAMMAL_CAT",
  },
  [PetCategory.MAMMAL_SMALL]: {
    icon: "rabbit",
    tint: "#B58A6B",
    taglineKey: "petWizard.taglines.MAMMAL_SMALL",
  },
  [PetCategory.BIRD]: {
    icon: "bird",
    tint: "#7AA1B8",
    taglineKey: "petWizard.taglines.BIRD",
  },
  [PetCategory.FISH_FRESHWATER]: {
    icon: "fish",
    tint: "#5C8FB8",
    taglineKey: "petWizard.taglines.FISH_FRESHWATER",
  },
  [PetCategory.FISH_SALTWATER]: {
    icon: "fish",
    tint: "#3F7AAB",
    taglineKey: "petWizard.taglines.FISH_SALTWATER",
  },
  [PetCategory.REPTILE]: {
    icon: "snake",
    tint: "#7A8B5C",
    taglineKey: "petWizard.taglines.REPTILE",
  },
  [PetCategory.AMPHIBIAN]: {
    icon: "frog",
    tint: "#6B9A6B",
    taglineKey: "petWizard.taglines.AMPHIBIAN",
  },
  [PetCategory.INVERTEBRATE]: {
    icon: "spider",
    tint: "#8A7A8B",
    taglineKey: "petWizard.taglines.INVERTEBRATE",
  },
  [PetCategory.EQUINE]: {
    icon: "horse",
    tint: "#9C6B4F",
    taglineKey: "petWizard.taglines.EQUINE",
  },
  [PetCategory.FARM]: {
    icon: "cow",
    tint: "#A88962",
    taglineKey: "petWizard.taglines.FARM",
  },
};

/**
 * Curated quick-pick name suggestions per category. Eight entries max
 * — the chip row should stay scrollable but not feel infinite.
 */
export const NAME_SUGGESTIONS: Record<PetCategory, string[]> = {
  [PetCategory.MAMMAL_DOG]: [
    "Luna",
    "Rocky",
    "Bella",
    "Charlie",
    "Lucky",
    "Max",
    "Nala",
    "Leo",
  ],
  [PetCategory.MAMMAL_CAT]: [
    "Mia",
    "Milo",
    "Oliver",
    "Luna",
    "Felix",
    "Simba",
    "Bella",
    "Coco",
  ],
  [PetCategory.MAMMAL_SMALL]: [
    "Hopper",
    "Coco",
    "Pepper",
    "Biscotto",
    "Nuvola",
    "Tofu",
  ],
  [PetCategory.BIRD]: ["Kiwi", "Sky", "Pio", "Mango", "Sole", "Cielo"],
  [PetCategory.FISH_FRESHWATER]: [
    "Bubbles",
    "Nemo",
    "Sushi",
    "Goldie",
    "Coral",
    "Nuvola",
  ],
  [PetCategory.FISH_SALTWATER]: [
    "Marlin",
    "Coral",
    "Reef",
    "Azul",
    "Pearl",
    "Indigo",
  ],
  [PetCategory.REPTILE]: ["Rex", "Loki", "Goji", "Slim", "Kai", "Echo"],
  [PetCategory.AMPHIBIAN]: ["Kermit", "Mochi", "Pepper", "Fango", "Lily"],
  [PetCategory.INVERTEBRATE]: ["Spider", "Goliath", "Tank", "Sage"],
  [PetCategory.EQUINE]: ["Storm", "Apollo", "Luna", "Pepper", "Shadow"],
  [PetCategory.FARM]: ["Bella", "Daisy", "Margherita", "Olivo", "Stella"],
};
