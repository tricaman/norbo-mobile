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

export function useBirds(): { birds: Pet[]; isPending: boolean } {
  const { pets, isPending } = usePetsByCategory(PetCategory.BIRD);
  return { birds: pets, isPending };
}

export function useReptiles(): { reptiles: Pet[]; isPending: boolean } {
  const { pets, isPending } = usePetsByCategory(PetCategory.REPTILE);
  return { reptiles: pets, isPending };
}

export function useFarmAnimals(): { farmAnimals: Pet[]; isPending: boolean } {
  const { pets, isPending } = usePetsByCategory(PetCategory.FARM);
  return { farmAnimals: pets, isPending };
}

export function useEquines(): { equines: Pet[]; isPending: boolean } {
  const { pets, isPending } = usePetsByCategory(PetCategory.EQUINE);
  return { equines: pets, isPending };
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

/** Shared alias matcher: first entry whose alias substring hits, else "generic". */
function matchByAliases(
  aliases: Record<string, string[]>,
  freetext: string | null,
): string {
  const hint = freetext?.toLowerCase().trim();
  if (!hint) return "generic";
  for (const [id, list] of Object.entries(aliases)) {
    if (list.some((a) => hint.includes(a))) return id;
  }
  return "generic";
}

/** Bird species-group ids known to care-knowledge (picker chips; no generic). */
export const BIRD_SPECIES_GROUPS = [
  "finch-canary",
  "budgie-parakeet",
  "cockatiel-lovebird",
  "medium-parrot",
  "large-parrot",
] as const;

// Order matters: most-specific groups first (first-match-wins). "ara " keeps
// its trailing space on purpose to avoid substring false positives.
const BIRD_GROUP_ALIASES: Record<string, string[]> = {
  "cockatiel-lovebird": [
    "cockatiel",
    "calopsitta",
    "nymph",
    "lovebird",
    "inseparabile",
    "agapornis",
    "roseicollis",
    "personatus",
    "fischer",
  ],
  "large-parrot": [
    "african grey",
    "grey parrot",
    "cenerino",
    "amazon",
    "amazzone",
    "macaw",
    "ara ",
    "ararauna",
    "cockatoo",
    "cacatua",
    "galah",
    "eclectus",
    "ecletto",
  ],
  "medium-parrot": [
    "conure",
    "conuro",
    "monk",
    "monaco",
    "quaker",
    "ringneck",
    "collare",
    "rosella",
    "senegal",
    "meyer",
    "pionus",
    "caique",
    "caicco",
    "king parrot",
  ],
  "budgie-parakeet": [
    "budgie",
    "budgerigar",
    "cocorita",
    "ondulata",
    "pappagallino",
    "bourke",
    "lineolated",
    "barrato",
    "kakariki",
    "turquoise",
    "turchese",
  ],
  "finch-canary": [
    "canary",
    "canarino",
    "finch",
    "diamante",
    "mandarino",
    "gould",
    "society",
    "siskin",
    "cardinalino",
    "usignolo",
    "nightingale",
  ],
};

/** Best-effort map a bird's free-text species to a group id, else "generic". */
export function matchBirdSpeciesGroup(freetext: string | null): string {
  return matchByAliases(BIRD_GROUP_ALIASES, freetext);
}

/** Snake species ids known to care-knowledge (picker chips; no generic). */
export const SNAKE_SPECIES = [
  "ball-python",
  "corn-snake",
  "boa",
  "king-milk",
  "garter",
  "hognose",
] as const;

const SNAKE_ALIASES: Record<string, string[]> = {
  "ball-python": ["ball python", "royal python", "python regius", "pitone reale"],
  "corn-snake": ["corn snake", "pantherophis", "guttatus", "serpente del grano", "elaphe"],
  boa: ["boa", "constrictor", "imperator", "rosy boa", "lichanura"],
  "king-milk": [
    "kingsnake",
    "king snake",
    "milk snake",
    "lampropeltis",
    "serpente reale",
    "serpente del latte",
    "falso corallo",
  ],
  garter: ["garter", "thamnophis", "giarrettiera", "biscia"],
  hognose: ["hognose", "heterodon"],
};

/** Best-effort map a snake's free-text species to a known id, else "generic". */
export function matchSnakeSpecies(freetext: string | null): string {
  return matchByAliases(SNAKE_ALIASES, freetext);
}

/** Aquatic-turtle species ids known to care-knowledge (picker chips). */
export const TURTLE_SPECIES = [
  "yellow-bellied-slider",
  "musk-turtle",
  "map-turtle",
] as const;

const TURTLE_ALIASES: Record<string, string[]> = {
  "yellow-bellied-slider": ["slider", "trachemys", "scripta", "orecchie gialle"],
  "musk-turtle": ["musk", "sternotherus", "kinosternon", "muschiata"],
  "map-turtle": ["map turtle", "graptemys", "mappa"],
};

/** Best-effort map a turtle's free-text species to a known id, else "generic". */
export function matchTurtleSpecies(freetext: string | null): string {
  return matchByAliases(TURTLE_ALIASES, freetext);
}

/** Tortoise hints — the turtle tool redirects these to the reptile guide. */
export const TORTOISE_HINT_ALIASES = [
  "tortoise",
  "testudo",
  "testuggine",
  "hermann",
  "graeca",
  "marginata",
  "tartaruga di terra",
] as const;

/** Livestock species ids for the water tool (picker chips; no generic). */
export const LIVESTOCK_WATER_SPECIES = [
  "cow-lactating",
  "cow-dry",
  "calf",
  "pig",
  "goat",
  "sheep",
  "chicken-flock",
  "horse",
  "donkey",
] as const;

// Bare "mucca/cow" maps to cow-dry (maintenance baseline); the user picks the
// lactating chip to upgrade. calf listed before cow so "vitello" wins.
const LIVESTOCK_ALIASES: Record<string, string[]> = {
  calf: ["calf", "vitell"],
  "cow-dry": ["cow", "mucca", "vacca", "bovin", "bue", "toro", "ox", "bufal", "buffalo"],
  pig: ["pig", "maial", "scrofa", "sow", "suin", "porc"],
  goat: ["goat", "capr"],
  sheep: ["sheep", "pecor", "ariete", "ram", "agnell", "lamb"],
  "chicken-flock": [
    "chicken",
    "gallin",
    "gallo",
    "rooster",
    "pulcino",
    "hen",
    "anatra",
    "duck",
    "oca",
    "goose",
    "papera",
    "tacchino",
    "turkey",
    "faraona",
    "quail",
    "quagl",
  ],
  horse: [
    "horse",
    "cavall",
    "pony",
    "purosangue",
    "frison",
    "haflinger",
    "murgese",
    "lipizzan",
    "quarter",
    "thoroughbred",
  ],
  donkey: ["donkey", "asin", "mule", "mulo"],
};

/** Best-effort map livestock free-text to a water-tool species id. */
export function matchLivestockSpecies(freetext: string | null): string {
  return matchByAliases(LIVESTOCK_ALIASES, freetext);
}

/** Herbivore species ids for the forage tool (picker chips; no generic). */
export const FORAGE_SPECIES = [
  "horse",
  "donkey",
  "cow",
  "goat",
  "sheep",
  "alpaca",
] as const;

const FORAGE_ALIASES: Record<string, string[]> = {
  horse: [
    "horse",
    "cavall",
    "pony",
    "purosangue",
    "frison",
    "haflinger",
    "murgese",
    "lipizzan",
    "quarter",
    "thoroughbred",
  ],
  donkey: ["donkey", "asin", "mule", "mulo"],
  cow: ["cow", "mucca", "vacca", "bovin", "bue", "toro", "vitell", "bufal", "buffalo"],
  goat: ["goat", "capr"],
  sheep: ["sheep", "pecor", "ariete", "agnell", "lamb"],
  alpaca: ["alpaca", "llama", "lama"],
};

/** Best-effort map a herbivore's free-text species to a forage id. */
export function matchForageSpecies(freetext: string | null): string {
  return matchByAliases(FORAGE_ALIASES, freetext);
}

/** Age in months from a birth date ISO string, or null. */
export function ageMonthsFrom(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate).getTime();
  if (Number.isNaN(birth)) return null;
  return Math.floor((Date.now() - birth) / (1000 * 60 * 60 * 24 * 30.44));
}
