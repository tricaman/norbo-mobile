export enum PetCategory {
  MAMMAL_DOG = 'MAMMAL_DOG',
  MAMMAL_CAT = 'MAMMAL_CAT',
  MAMMAL_SMALL = 'MAMMAL_SMALL',
  BIRD = 'BIRD',
  FISH_FRESHWATER = 'FISH_FRESHWATER',
  FISH_SALTWATER = 'FISH_SALTWATER',
  REPTILE = 'REPTILE',
  AMPHIBIAN = 'AMPHIBIAN',
  INVERTEBRATE = 'INVERTEBRATE',
  EQUINE = 'EQUINE',
  FARM = 'FARM',
}

export enum Sex {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN',
}

export enum WeightUnit {
  kg = 'kg',
  lb = 'lb',
}

export interface SpeciesResult {
  id: string;
  category: PetCategory;
  commonName: string;
  scientificName: string | null;
  aliases: string[];
  isGeneric: boolean;
}

export interface Pet {
  id: string;
  ownerId: string;
  category: PetCategory;
  name: string;
  speciesId: string | null;
  speciesLabelFreetext: string | null;
  photoUrl: string | null;
  birthDate: string | null;
  birthDateIsApproximate: boolean;
  acquiredAt: string | null;
  sex: Sex;
  sterilized: boolean | null;
  currentWeight: number | null;
  weightUnit: WeightUnit;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePetInput {
  category: PetCategory;
  name: string;
  speciesId?: string | null;
  speciesLabelFreetext?: string | null;
  photoMediaAssetId?: string | null;
  birthDate?: string | null;
  birthDateIsApproximate?: boolean;
  acquiredAt?: string | null;
  sex?: Sex;
  sterilized?: boolean | null;
  currentWeight?: number | null;
  weightUnit?: WeightUnit;
  notes?: string | null;
}

export interface UpdatePetInput {
  name?: string;
  speciesId?: string | null;
  speciesLabelFreetext?: string | null;
  birthDate?: string | null;
  birthDateIsApproximate?: boolean;
  acquiredAt?: string | null;
  sex?: Sex;
  sterilized?: boolean | null;
  currentWeight?: number | null;
  weightUnit?: WeightUnit;
  notes?: string | null;
}

export interface SearchSpeciesParams {
  category: PetCategory;
  q?: string;
  limit?: number;
  offset?: number;
}
