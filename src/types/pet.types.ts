export enum PetCategory {
  MAMMAL_DOG = "MAMMAL_DOG",
  MAMMAL_CAT = "MAMMAL_CAT",
  MAMMAL_SMALL = "MAMMAL_SMALL",
  BIRD = "BIRD",
  FISH_FRESHWATER = "FISH_FRESHWATER",
  FISH_SALTWATER = "FISH_SALTWATER",
  REPTILE = "REPTILE",
  AMPHIBIAN = "AMPHIBIAN",
  INVERTEBRATE = "INVERTEBRATE",
  EQUINE = "EQUINE",
  FARM = "FARM",
}

export enum Sex {
  MALE = "MALE",
  FEMALE = "FEMALE",
  UNKNOWN = "UNKNOWN",
}

export enum LifeStatus {
  ALIVE = "ALIVE",
  DECEASED = "DECEASED",
}

export interface SubcategoryResult {
  id: string;
  category: PetCategory;
  commonName: string;
  scientificName: string | null;
  aliases: string[];
  imageUrl: string | null;
  isGeneric: boolean;
}

export interface SpeciesResult {
  id: string;
  category: PetCategory;
  subcategoryId: string | null;
  commonName: string;
  scientificName: string | null;
  aliases: string[];
  isGeneric: boolean;
}

export interface Pet {
  id: string;
  ownerId: string;
  category: PetCategory;
  subcategoryId: string | null;
  /** Resolved, localized name of the linked subcategory (the "kind"). */
  subcategoryName: string | null;
  name: string;
  speciesId: string | null;
  /** Resolved, localized name of the linked species/breed. Prefer this
   *  over `speciesLabelFreetext` for display. */
  speciesName: string | null;
  speciesLabelFreetext: string | null;
  photoUrl: string | null;
  birthDate: string | null;
  birthDateIsApproximate: boolean;
  acquiredAt: string | null;
  sex: Sex;
  sterilized: boolean | null;
  notes: string | null;
  lifeStatus: LifeStatus;
  deceasedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePetInput {
  category: PetCategory;
  name: string;
  subcategoryId?: string | null;
  speciesId?: string | null;
  speciesLabelFreetext?: string | null;
  photoMediaAssetId?: string | null;
  birthDate?: string | null;
  birthDateIsApproximate?: boolean;
  acquiredAt?: string | null;
  sex?: Sex;
  sterilized?: boolean | null;
  notes?: string | null;
}

export interface UpdatePetInput {
  name?: string;
  subcategoryId?: string | null;
  speciesId?: string | null;
  speciesLabelFreetext?: string | null;
  birthDate?: string | null;
  birthDateIsApproximate?: boolean;
  acquiredAt?: string | null;
  sex?: Sex;
  sterilized?: boolean | null;
  notes?: string | null;
}

export interface SearchSpeciesParams {
  category: PetCategory;
  subcategoryId?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface SearchSubcategoriesParams {
  category: PetCategory;
  q?: string;
  limit?: number;
  offset?: number;
}
