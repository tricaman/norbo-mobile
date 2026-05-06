import type { AuthUser } from "@/types/auth.types";
import { api } from "./api";

export interface UpdateProfilePayload {
  name?: string;
  avatarUrl?: string;
}

export const usersApi = {
  /** PATCH /users/me — update display name and/or avatar. */
  updateProfile: (payload: UpdateProfilePayload) =>
    api.patch<AuthUser>("/auth/me", payload),
} as const;
