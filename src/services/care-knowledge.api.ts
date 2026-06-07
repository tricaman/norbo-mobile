import type {
  BcsScale,
  CatFoodEnergy,
  CatHydration,
  CatLitterGuidance,
  DogActivityGuideline,
  DogBreedStandard,
  DogSize,
  EnclosureGuideline,
  HayConfig,
  PuppyMilestone,
  RationGuideline,
  ReptileEnvironmentProfile,
  SafeTemperature,
  ToxicityItem,
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
} as const;
