import { queryClient } from "@/app/_layout";
import { useMutation } from "@/hooks/useMutation";
import {
  readToolInputs,
  writeToolInputs,
} from "@/services/tool-inputs.cache";
import { toolsApi } from "@/services/tools.api";
import {
  isPersistedInputCompatible,
  type ServiceToolId,
} from "@/shared/services-contract";
import type { PersistedToolInputs } from "@/types/tool.types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

function queryKey(toolId: ServiceToolId, petId: string | null) {
  return ["tool-result", toolId, petId ?? "user"] as const;
}

export interface UseToolInputsResult {
  /** Restored inputs (compatible only), or null. */
  inputs: Record<string, unknown> | null;
  isSyncing: boolean;
  /** Persist inputs (upsert). Resolves once cache + query are updated. */
  save: (inputs: Record<string, unknown>) => Promise<void>;
}

/**
 * useToolInputs — offline-first persistence for a tool's inputs.
 *
 * Reads the MMKV cache synchronously as `initialData` (instant restore,
 * works fully offline), then React Query syncs in the background with the
 * step-2 endpoints. Both the cache read and the query guard against an
 * incompatible `schemaVersion`, discarding stale-shaped inputs. Successful
 * saves write through to the cache and the query so the UI stays consistent.
 *
 * `enabled` is the tool's `persistsResult` flag: when false, nothing is read,
 * fetched or stored.
 */
export function useToolInputs(
  toolId: ServiceToolId,
  petId: string | null,
  enabled: boolean,
): UseToolInputsResult {
  const cached = enabled ? readToolInputs(toolId, petId) : null;

  const query = useQuery({
    queryKey: queryKey(toolId, petId),
    enabled,
    initialData: cached ?? undefined,
    queryFn: async (): Promise<PersistedToolInputs | null> => {
      const { data } = await toolsApi.getResult(toolId, petId);
      if (!data) return null;
      // Server already discards incompatible records; double-check defensively.
      if (!isPersistedInputCompatible(toolId, data.schemaVersion)) return null;
      return { schemaVersion: data.schemaVersion, inputs: data.inputs };
    },
  });

  // Mirror the latest synced value into MMKV for the next offline launch.
  useEffect(() => {
    if (query.data) writeToolInputs(toolId, petId, query.data);
  }, [query.data, toolId, petId]);

  const saveMutation = useMutation({
    mutationFn: (inputs: Record<string, unknown>) =>
      toolsApi.saveResult(toolId, { petId, inputs }).then((r) => r.data),
    onSuccess: (saved) => {
      const value: PersistedToolInputs = {
        schemaVersion: saved.schemaVersion,
        inputs: saved.inputs,
      };
      writeToolInputs(toolId, petId, value);
      queryClient.setQueryData(queryKey(toolId, petId), value);
    },
  });

  return {
    inputs: query.data?.inputs ?? null,
    isSyncing: query.isFetching,
    save: async (inputs: Record<string, unknown>) => {
      await saveMutation.mutateAsync(inputs);
    },
  };
}
