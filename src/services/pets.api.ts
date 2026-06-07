import type {
  CreatePetInput,
  Pet,
  SearchSpeciesParams,
  SearchSubcategoriesParams,
  SpeciesResult,
  SubcategoryResult,
  UpdatePetInput,
} from "@/types/pet.types";
import { api } from "./api";

export const petsApi = {
  list: () => api.get<Pet[]>("/pets"),

  get: (petId: string) => api.get<Pet>(`/pets/${petId}`),

  create: (input: CreatePetInput) => api.post<Pet>("/pets", input),

  update: (petId: string, input: UpdatePetInput) =>
    api.patch<Pet>(`/pets/${petId}`, input),

  updatePhoto: (petId: string, mediaAssetId: string) =>
    api.patch<Pet>(`/pets/${petId}/photo`, { mediaAssetId }),

  deletePhoto: (petId: string) => api.delete<Pet>(`/pets/${petId}/photo`),

  delete: (petId: string) => api.delete(`/pets/${petId}`),

  markDeceased: (
    petId: string,
    input: { deceasedAt?: string; note?: string; mediaAssetIds?: string[] },
  ) => api.post(`/pets/${petId}/mark-deceased`, input),

  restore: (petId: string) => api.post(`/pets/${petId}/restore`),

  listDeceased: () =>
    api.get<Pet[]>("/pets", { params: { lifeStatus: "DECEASED" } }),

  searchSpecies: (params: SearchSpeciesParams) =>
    api.get<SpeciesResult[]>("/species", { params }),

  searchSubcategories: (params: SearchSubcategoriesParams) =>
    api.get<SubcategoryResult[]>("/subcategories", { params }),
} as const;
