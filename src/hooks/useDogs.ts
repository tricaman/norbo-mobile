import { petsApi } from "@/services/pets.api";
import { PetCategory, type Pet } from "@/types/pet.types";
import { useQuery } from "@tanstack/react-query";

/**
 * useDogs — the user's dogs (MAMMAL_DOG), for dog-specific tools that read the
 * pet profile. Reuses the shared `["pets"]` query so it is typically warm.
 */
function usePetsByCategory(category: PetCategory): {
  pets: Pet[];
  isPending: boolean;
} {
  const query = useQuery({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
  });
  const pets = (query.data ?? []).filter((p) => p.category === category);
  return { pets, isPending: query.isPending };
}

export function useDogs(): { dogs: Pet[]; isPending: boolean } {
  const { pets, isPending } = usePetsByCategory(PetCategory.MAMMAL_DOG);
  return { dogs: pets, isPending };
}

export function useCats(): { cats: Pet[]; isPending: boolean } {
  const { pets, isPending } = usePetsByCategory(PetCategory.MAMMAL_CAT);
  return { cats: pets, isPending };
}

export function useSmallMammals(): { smallMammals: Pet[]; isPending: boolean } {
  const { pets, isPending } = usePetsByCategory(PetCategory.MAMMAL_SMALL);
  return { smallMammals: pets, isPending };
}

/** Known small-mammal care-knowledge species ids and their match aliases. */
export const SMALL_MAMMAL_SPECIES = [
  "rabbit",
  "hamster",
  "guinea-pig",
  "ferret",
  "chinchilla",
] as const;

const SPECIES_ALIASES: Record<string, string[]> = {
  rabbit: ["rabbit", "coniglio", "bunny"],
  hamster: ["hamster", "criceto"],
  "guinea-pig": ["guinea", "porcellino", "cavia"],
  ferret: ["ferret", "furetto"],
  chinchilla: ["chinchilla", "cincill"],
};

/** Best-effort map a pet's free-text species to a known id, else "generic". */
export function matchSmallMammalSpecies(freetext: string | null): string {
  const hint = freetext?.toLowerCase().trim();
  if (!hint) return "generic";
  for (const [id, aliases] of Object.entries(SPECIES_ALIASES)) {
    if (aliases.some((a) => hint.includes(a))) return id;
  }
  return "generic";
}

/** Age in months from a birth date ISO string, or null. */
export function ageMonthsFrom(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate).getTime();
  if (Number.isNaN(birth)) return null;
  return Math.floor((Date.now() - birth) / (1000 * 60 * 60 * 24 * 30.44));
}
