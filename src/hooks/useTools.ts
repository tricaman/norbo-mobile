import { LOCAL_TOOL_IDS } from "@/components/tools/registry";
import { toolsApi } from "@/services/tools.api";
import type { ToolMetadata } from "@/types/tool.types";
import { intersectAvailableTools } from "@/utils/toolAvailability";
import { useQuery } from "@tanstack/react-query";

export const TOOLS_QUERY_KEY = ["tools"] as const;

/**
 * useAvailableTools — server state for the Services tab.
 *
 * Fetches the tools the backend exposes for the current user (already
 * filtered to their pet categories) and intersects them with the tools this
 * app build can render. React Query caches the result so the list survives
 * brief offline periods.
 */
export function useAvailableTools() {
  return useQuery({
    queryKey: TOOLS_QUERY_KEY,
    queryFn: () => toolsApi.list().then((r) => r.data),
    select: (tools: ToolMetadata[]) =>
      intersectAvailableTools(tools, LOCAL_TOOL_IDS),
  });
}
