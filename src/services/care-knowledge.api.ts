import type { ReptileEnvironmentProfile } from "@/types/care-knowledge.types";
import { api } from "./api";

export const careKnowledgeApi = {
  /** Curated reptile environment profiles (target temps/humidity). */
  reptileEnvironment: () =>
    api.get<ReptileEnvironmentProfile[]>("/care-knowledge/reptile-environment"),
} as const;
