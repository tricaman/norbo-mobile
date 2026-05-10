import type {
  CreatePetInput,
  Pet,
  SearchSpeciesParams,
  SpeciesResult,
  UpdatePetInput,
} from '@/types/pet.types';
import { api } from './api';

export const petsApi = {
  list: () => api.get<Pet[]>('/pets'),

  get: (petId: string) => api.get<Pet>(`/pets/${petId}`),

  create: (input: CreatePetInput) => api.post<Pet>('/pets', input),

  update: (petId: string, input: UpdatePetInput) =>
    api.patch<Pet>(`/pets/${petId}`, input),

  updatePhoto: (petId: string, mediaAssetId: string) =>
    api.patch<Pet>(`/pets/${petId}/photo`, { mediaAssetId }),

  delete: (petId: string) => api.delete(`/pets/${petId}`),

  searchSpecies: (params: SearchSpeciesParams) =>
    api.get<SpeciesResult[]>('/species', { params }),
} as const;
