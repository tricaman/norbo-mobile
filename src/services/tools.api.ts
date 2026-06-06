import type { ServiceToolId } from "@/shared/services-contract";
import type { SavedToolResult, ToolMetadata } from "@/types/tool.types";
import { api } from "./api";

export const toolsApi = {
  /** Tools available to the current user, filtered server-side by pet category. */
  list: () => api.get<ToolMetadata[]>("/tools"),

  /** Saved inputs for a tool (+ optional pet), or null when none/incompatible. */
  getResult: (toolId: ServiceToolId, petId?: string | null) =>
    api.get<SavedToolResult | null>(`/tools/${toolId}/result`, {
      params: petId ? { petId } : undefined,
    }),

  /** Upsert the saved inputs for a tool (+ optional pet). */
  saveResult: (
    toolId: ServiceToolId,
    body: { petId: string | null; inputs: Record<string, unknown> },
  ) => api.put<SavedToolResult>(`/tools/${toolId}/result`, body),
} as const;
