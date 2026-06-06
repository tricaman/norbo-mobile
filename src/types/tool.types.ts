import type { ServiceToolId } from "@/shared/services-contract";
import type { PetCategory } from "@/types/pet.types";

/**
 * ToolMetadata — mirrors the `GET /tools` payload (the backend is the
 * authoritative source of commercial/availability metadata). The server has
 * already filtered the list to the current user's pet categories and omits
 * the internal `available` kill-switch.
 *
 * `title`/`description` are already resolved to the request language
 * (Accept-Language) by the backend — no client-side i18n key lookup. `id` is
 * the single key shared with the contract and the frontend registry.
 */
export interface ToolMetadata {
  id: ServiceToolId;
  categories: PetCategory[];
  /** Shown regardless of the user's pet categories (even with no pets). */
  crossSpecies: boolean;
  isPremium: boolean;
  /**
   * Authoritative, server-computed premium gate for the current user
   * (`isPremium && !entitled`). The client trusts this rather than deciding
   * locally — premium state is owned by the backend.
   */
  locked: boolean;
  icon: string;
  /** Cover image URL, or null (render a themed fallback). */
  coverImageUrl: string | null;
  /** Already localized to the request language. */
  title: string;
  description: string;
}

/**
 * SavedToolResult — mirrors the `GET/PUT /tools/:toolId/result` payload. The
 * backend stores (and returns) the validated INPUTS, never a computed result.
 */
export interface SavedToolResult {
  toolId: ServiceToolId;
  petId: string | null;
  schemaVersion: number;
  inputs: Record<string, unknown>;
  updatedAt: string;
}

/**
 * PersistedToolInputs — the minimal shape kept both in the MMKV offline cache
 * and as React Query data: just enough to restore a tool's inputs and to
 * decide schemaVersion compatibility.
 */
export interface PersistedToolInputs {
  schemaVersion: number;
  inputs: Record<string, unknown>;
}
