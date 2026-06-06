import {
  isPersistedInputCompatible,
  type ServiceToolId,
} from "@/shared/services-contract";
import type { PersistedToolInputs } from "@/types/tool.types";
import { createMMKV } from "react-native-mmkv";

/**
 * Offline-first cache for tool INPUTS. Dedicated MMKV instance (per the
 * per-concern `createMMKV({ id })` convention used by the stores). One entry
 * per (toolId, petId-or-"user"). Reads discard entries whose stored
 * schemaVersion no longer matches the contract — the saved shape is
 * incompatible and must not be restored.
 */
const storage = createMMKV({ id: "norbo-tool-inputs" });

function cacheKey(toolId: ServiceToolId, petId: string | null): string {
  return `${toolId}:${petId ?? "user"}`;
}

export function readToolInputs(
  toolId: ServiceToolId,
  petId: string | null,
): PersistedToolInputs | null {
  const key = cacheKey(toolId, petId);
  const raw = storage.getString(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedToolInputs;
    if (!isPersistedInputCompatible(toolId, parsed.schemaVersion)) {
      storage.remove(key);
      return null;
    }
    return parsed;
  } catch {
    storage.remove(key);
    return null;
  }
}

export function writeToolInputs(
  toolId: ServiceToolId,
  petId: string | null,
  value: PersistedToolInputs,
): void {
  storage.set(cacheKey(toolId, petId), JSON.stringify(value));
}

export function clearToolInputs(
  toolId: ServiceToolId,
  petId: string | null,
): void {
  storage.remove(cacheKey(toolId, petId));
}
