import type {
  AppPlatform,
  AppVersionStatus,
} from "@/types/app-version.types";
import { api } from "./api";

export const appVersionApi = {
  /**
   * GET /app/version — store-version status for the given platform. Public
   * endpoint (no auth required); the `version` query param carries the
   * installed app version so the backend can log/segment by it.
   */
  status: (platform: AppPlatform, version: string) =>
    api.get<AppVersionStatus>("/app/version", {
      params: { platform, version },
    }),
} as const;
