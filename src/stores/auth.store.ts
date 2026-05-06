import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";
import type { AuthUser } from "@/types/auth.types";

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

  setUser: (user) => {
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
      const user = JSON.parse(raw) as AuthUser;
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
