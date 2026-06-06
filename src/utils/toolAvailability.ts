import type { ServiceToolId } from "@/shared/services-contract";
import type { ToolMetadata } from "@/types/tool.types";

/**
 * intersectAvailableTools — the client∩server rule, isolated as a pure,
 * testable function (never inlined in UI).
 *
 * Returns the server-provided tools (already category-filtered) for which
 * this app build ALSO has a local component. This protects against app/server
 * version skew and lets the server kill a tool without an app release: a tool
 * shows only when it exists on BOTH sides.
 */
export function intersectAvailableTools(
  serverTools: readonly ToolMetadata[],
  localToolIds: readonly ServiceToolId[],
): ToolMetadata[] {
  const local = new Set<ServiceToolId>(localToolIds);
  return serverTools.filter((tool) => local.has(tool.id));
}
