import { petEventsApi } from "@/services/pet-events.api";
import {
  PetEventStatus,
  PetEventType,
  type PetEvent,
  type PetEventTimeline,
} from "@/types/pet-event.types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export interface WeightRecord {
  event: PetEvent;
  weightMg: number;
  occurredAt: string;
  notes: string | null;
}

/**
 * useWeightHistory — derives WEIGHT_RECORD events from the standard
 * pet timeline query, sorted desc by occurredAt. Re-uses the same
 * query key as `PetTimeline` so a successful weight log invalidation
 * refreshes both views simultaneously.
 *
 * MVP: client-side filter on the timeline pages. Once the backend
 * accepts a `?type=WEIGHT_RECORD` param this hook should switch to a
 * dedicated query.
 */
export function useWeightHistory(petId: string) {
  const query = useInfiniteQuery({
    queryKey: ["pet-events", petId],
    queryFn: ({ pageParam }) =>
      petEventsApi
        .list(petId, { cursor: pageParam as string | undefined, limit: 20 })
        .then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: PetEventTimeline) => last.nextCursor ?? undefined,
    enabled: !!petId,
  });

  const records = useMemo<WeightRecord[]>(() => {
    if (!query.data) return [];
    const all: PetEvent[] = [];
    for (const page of query.data.pages) {
      all.push(...page.past, ...page.upcoming);
    }
    return all
      .filter(
        (e) =>
          e.type === PetEventType.WEIGHT_RECORD &&
          e.status === PetEventStatus.OCCURRED &&
          e.occurredAt &&
          typeof (e.extra as { weightMg?: unknown })?.weightMg === "number",
      )
      .map((event) => ({
        event,
        weightMg: (event.extra as { weightMg: number }).weightMg,
        occurredAt: event.occurredAt as string,
        notes: event.description,
      }))
      .sort((a, b) => (a.occurredAt > b.occurredAt ? -1 : 1));
  }, [query.data]);

  const latest = records[0] ?? null;

  return {
    records,
    latest,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isRefetching: query.isRefetching,
  };
}
