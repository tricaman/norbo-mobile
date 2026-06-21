import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";
import { detectDeviceLanguage } from "@/i18n/detect-language";
import type { AuthUser } from "@/types/auth.types";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/types/preferences.schema";

/**
 * Backfill Identity preferences for users whose MMKV cache was written
 * before the preferences fields were added to AuthUser. Without this,
 * `user.theme` / `user.notificationPreferences` would be `undefined` on
 * the first render after upgrade — long enough for the theme bridge to
 * crash. Defaults mirror the backend's Prisma defaults.
 */
function withPreferenceDefaults(user: AuthUser): AuthUser {
  return {
    ...user,
    notificationPreferences:
      user.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES,
    preferredLanguage: user.preferredLanguage ?? detectDeviceLanguage(),
    theme: user.theme ?? "system",
  };
}

const storage = createMMKV({ id: "norbo-auth" });

interface AuthState {
  user: AuthUser | null;
  sessionToken: string | null;
  isAuthed: boolean;
  isVerified: boolean;
  setUser: (user: AuthUser | null) => void;
  setSessionToken: (token: string | null) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  sessionToken: null,
  isAuthed: false,
  isVerified: false,

  setUser: (rawUser) => {
    const user = rawUser ? withPreferenceDefaults(rawUser) : null;
    if (user) {
      storage.set("user", JSON.stringify(user));
    } else {
      storage.remove("user");
    }
    set({
      user,
      isAuthed: !!user,
      isVerified: user?.emailVerified ?? false,
    });
  },

  setSessionToken: (sessionToken) => {
    if (sessionToken) {
      storage.set("sessionToken", sessionToken);
    } else {
      storage.remove("sessionToken");
    }
    set({ sessionToken });
  },

  clearAuth: () => {
    storage.remove("user");
    storage.remove("sessionToken");
    set({
      user: null,
      sessionToken: null,
      isAuthed: false,
      isVerified: false,
    });
  },

  /**
   * Called on app start. Restores user from MMKV for display.
   * Does NOT restore wsToken (always fetched fresh after session validation).
   */
  hydrate: () => {
    const raw = storage.getString("user");
    const sessionToken = storage.getString("sessionToken") ?? null;
    if (!raw) return;
    try {
      const user = withPreferenceDefaults(JSON.parse(raw) as AuthUser);
      set({
        user,
        sessionToken,
        isAuthed: true,
        isVerified: user.emailVerified,
      });
    } catch {
      storage.remove("user");
    }
  },
}));
