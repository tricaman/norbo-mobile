import type {
  AmphibianEnvironmentProfile,
  BcsScale,
  BirdEnvironmentProfile,
  BirdFeedingGuideline,
  BirdHousingGuideline,
  CatFoodEnergy,
  CatHydration,
  CatLitterGuidance,
  ChickenCoopConfig,
  DogActivityGuideline,
  DogBreedStandard,
  DogSize,
  EnclosureGuideline,
  ForageGuideline,
  HayConfig,
  PuppyMilestone,
  RationGuideline,
  ReptileEnvironmentProfile,
  SafeTemperature,
  SnakeFeedingGuideline,
  ToxicityItem,
  TurtleTankGuideline,
  WaterGuideline,
} from "@/types/care-knowledge.types";
import type { PetCategory } from "@/types/pet.types";
import { api } from "./api";

export const careKnowledgeApi = {
  /** Curated reptile environment profiles (target temps/humidity). */
  reptileEnvironment: () =>
    api.get<ReptileEnvironmentProfile[]>("/care-knowledge/reptile-environment"),

  /** Curated food/plant toxicity entries for an animal category. */
  toxicity: (category: PetCategory) =>
    api.get<ToxicityItem[]>("/care-knowledge/toxicity", {
      params: { category },
    }),

  /** Body-condition scale for an animal category (or null). */
  bcs: (category: PetCategory) =>
    api.get<BcsScale | null>("/care-knowledge/bcs", { params: { category } }),

  /** Dog exercise guidelines (all; filter client-side by size + age band). */
  dogActivity: () =>
    api.get<DogActivityGuideline[]>("/care-knowledge/dog-activity"),

  /** Non-clinical puppy milestones for a dog size. */
  puppyMilestones: (size: DogSize) =>
    api.get<PuppyMilestone[]>("/care-knowledge/puppy-milestones", {
      params: { size },
    }),

  /** Dog breed standards (+ size fallbacks). */
  dogBreeds: () => api.get<DogBreedStandard[]>("/care-knowledge/dog-breeds"),

  /** Cat litter guidance. */
  catLitter: () => api.get<CatLitterGuidance>("/care-knowledge/cat-litter"),

  /** Cat food caloric densities + maintenance factor. */
  catFoodEnergy: () =>
    api.get<CatFoodEnergy>("/care-knowledge/cat-food-energy"),

  /** Cat hydration coefficients + tips. */
  catHydration: () => api.get<CatHydration>("/care-knowledge/cat-hydration"),

  /** Safe temperature guidance for a small-mammal species (generic fallback). */
  smallMammalTemperatures: (species: string) =>
    api.get<SafeTemperature>("/care-knowledge/small-mammal-temperatures", {
      params: { species },
    }),

  /** Daily ration guideline for a small-mammal species. */
  smallMammalRation: (species: string) =>
    api.get<RationGuideline>("/care-knowledge/small-mammal-ration", {
      params: { species },
    }),

  /** Minimum enclosure guideline for a small-mammal species. */
  smallMammalEnclosure: (species: string) =>
    api.get<EnclosureGuideline>("/care-knowledge/small-mammal-enclosure", {
      params: { species },
    }),

  /** Rabbit hay autonomy coefficient. */
  rabbitHay: () => api.get<HayConfig>("/care-knowledge/rabbit-hay"),

  /** Minimum cage sizing for a bird species group (generic fallback). */
  birdHousing: (species: string) =>
    api.get<BirdHousingGuideline>("/care-knowledge/bird-housing", {
      params: { species },
    }),

  /** Daily ration coefficients for a bird species group. */
  birdFeeding: (species: string) =>
    api.get<BirdFeedingGuideline>("/care-knowledge/bird-feeding", {
      params: { species },
    }),

  /** Curated bird environment profiles (temps/humidity/light/hazards). */
  birdEnvironment: () =>
    api.get<BirdEnvironmentProfile[]>("/care-knowledge/bird-environment"),

  /** Prey sizing + feeding-interval bands for a snake species. */
  snakeFeeding: (species: string) =>
    api.get<SnakeFeedingGuideline>("/care-knowledge/snake-feeding", {
      params: { species },
    }),

  /** Aquatic-turtle tank sizing coefficients for a species. */
  turtleTank: (species: string) =>
    api.get<TurtleTankGuideline>("/care-knowledge/turtle-tank", {
      params: { species },
    }),

  /** Curated amphibian environment profiles. */
  amphibianEnvironment: () =>
    api.get<AmphibianEnvironmentProfile[]>(
      "/care-knowledge/amphibian-environment",
    ),

  /** Per-hen coop sizing coefficients. */
  chickenCoop: () =>
    api.get<ChickenCoopConfig>("/care-knowledge/chicken-coop"),

  /** Daily water-need band for a livestock/equine species. */
  livestockWater: (species: string) =>
    api.get<WaterGuideline>("/care-knowledge/livestock-water", {
      params: { species },
    }),

  /** Daily forage band (dry-matter % of body weight) for a herbivore. */
  forageRation: (species: string) =>
    api.get<ForageGuideline>("/care-knowledge/forage-ration", {
      params: { species },
    }),
} as const;
