import { bookletApi } from "@/services/booklet.api";
import { useQuery } from "@tanstack/react-query";

/**
 * Loads a pet's identity booklet. `data` is `null` when the pet has no
 * booklet yet (the upsert endpoint creates one on first save).
 */
export function useBooklet(petId: string) {
  return useQuery({
    queryKey: ["booklet", petId],
    queryFn: () => bookletApi.get(petId).then((r) => r.data),
    enabled: !!petId,
  });
}
