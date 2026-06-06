import type {
  BcsScale,
  ReptileEnvironmentProfile,
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
} as const;
