import type { PetBooklet, UpdatePetBookletInput } from "@/types/booklet.types";
import { api } from "./api";

const base = (petId: string) => `/pets/${encodeURIComponent(petId)}/booklet`;

export const bookletApi = {
  /** Returns the pet's identity booklet, or `null` if none exists yet. */
  get: (petId: string) => api.get<PetBooklet | null>(base(petId)),

  /** Creates or updates the booklet (idempotent upsert). */
  update: (petId: string, input: UpdatePetBookletInput) =>
    api.put<PetBooklet>(base(petId), input),
} as const;
