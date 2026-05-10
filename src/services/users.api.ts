import type { AuthUser } from "@/types/auth.types";
import type { UpdatePreferencesInput } from "@/types/preferences.schema";
import { api } from "./api";

export interface UpdateProfilePayload {
  name?: string;
  avatarUrl?: string;
  photoUrl?: string;
}

export const usersApi = {
  /** PATCH /auth/me — update display name and/or avatar/photo URL. */
  updateProfile: (payload: UpdateProfilePayload) =>
    api.patch<AuthUser>("/auth/me", payload),

  /**
   * PATCH /auth/me/preferences — partial update of Identity preferences
   * (notification toggles, preferred language, theme).
   *
   * Validation runs server-side via the shared Zod schema. The mobile
   * caller is responsible for parsing the payload through
   * `updatePreferencesSchema` before invocation when the input comes
   * from a form to surface field-level errors.
   */
  updatePreferences: (payload: UpdatePreferencesInput) =>
    api.patch<AuthUser>("/auth/me/preferences", payload),
} as const;
