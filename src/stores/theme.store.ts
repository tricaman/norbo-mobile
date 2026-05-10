import { usersApi } from "@/services/users.api";
import { useAuthStore } from "@/stores/auth.store";
import type { SupportedTheme } from "@/types/preferences.schema";
import { createMMKV } from "react-native-mmkv";
import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";
import { create } from "zustand";

/**
 * Theme store — single source of truth for the user's theme preference.
 *
 * Two responsibilities:
 *
 * 1. Persistence + sync. Stores the choice in MMKV (synchronous read at
 *    cold start so we never flash the wrong theme), keeps it in the
 *    Zustand store for React reactivity, and pushes it to the backend
 *    via `PATCH /auth/me/preferences` (debounced 500ms so rapid taps
 *    on the picker don't fire N requests).
 *
 * 2. Adaptive bridge. Translates the choice into `unistyles` runtime
 *    calls — `setAdaptiveThemes(true)` to follow the OS, otherwise
 *    `setTheme(name)` to force light/dark. We never read the OS theme
 *    ourselves — unistyles handles that when adaptive is on.
 *
 * Cold-start order matters: `bootstrapThemeFromStorage()` is called at
 * module load (before React mounts) so the very first render of the
 * StyleSheet config picks the right palette without a flash.
 */

const storage = createMMKV({ id: "norbo-theme" });
const STORAGE_KEY = "theme";
const DEBOUNCE_MS = 500;

function readPersistedTheme(): SupportedTheme {
  const raw = storage.getString(STORAGE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

function applyToUnistyles(theme: SupportedTheme): void {
  if (theme === "system") {
    UnistylesRuntime.setAdaptiveThemes(true);
    return;
  }
  // Forced theme: disable adaptive first, then pin the palette.
  UnistylesRuntime.setAdaptiveThemes(false);
  UnistylesRuntime.setTheme(theme);
}

/**
 * Synchronous bootstrap — invoked from `theme/unistyles.ts` immediately
 * after `StyleSheet.configure(...)`. Reads MMKV (sync), applies the
 * stored preference to unistyles, and seeds the Zustand initial state
 * via `setState`. Safe to call before React mounts.
 */
export function bootstrapThemeFromStorage(): SupportedTheme {
  const theme = readPersistedTheme();
  applyToUnistyles(theme);
  return theme;
}

interface ThemeState {
  /** User's theme preference. Local source of truth. */
  theme: SupportedTheme;
  /**
   * Local-only setter: applies + persists, no server sync. Use during
   * boot or when reconciling from a server response.
   */
  setThemeLocal: (theme: SupportedTheme) => void;
  /**
   * Public setter: applies + persists locally and triggers a debounced
   * `PATCH /auth/me/preferences` so the choice survives across devices.
   * Server failures are silent (the local choice still wins).
   */
  setTheme: (theme: SupportedTheme) => void;
  /**
   * Reconcile from the authenticated user's profile. Called once on
   * cold-start hydration if the server value differs from the cached
   * local value (server wins because the user might have changed it on
   * another device).
   */
  reconcileFromServer: (theme: SupportedTheme) => void;
}

let pendingSyncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleServerSync(theme: SupportedTheme): void {
  if (pendingSyncTimer) clearTimeout(pendingSyncTimer);
  pendingSyncTimer = setTimeout(() => {
    pendingSyncTimer = null;
    // Only sync when the user is authenticated. Pre-login theme changes
    // (e.g. during onboarding) are persisted locally and pushed when
    // the user is finally available — see `useTheme.flushPending()`.
    if (!useAuthStore.getState().isAuthed) return;
    void usersApi
      .updatePreferences({ theme })
      .then((res) => {
        // Backend returns the refreshed OwnProfile; merge so cached
        // user.theme matches the one we just pushed.
        useAuthStore.getState().setUser(res.data);
      })
      .catch(() => {
        // Silent: local preference already applied. A future cold-start
        // will reconcile from `me`.
      });
  }, DEBOUNCE_MS);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readPersistedTheme(),

  setThemeLocal: (theme) => {
    storage.set(STORAGE_KEY, theme);
    applyToUnistyles(theme);
    set({ theme });
  },

  setTheme: (theme) => {
    if (get().theme === theme) return;
    storage.set(STORAGE_KEY, theme);
    applyToUnistyles(theme);
    set({ theme });
    scheduleServerSync(theme);
  },

  reconcileFromServer: (theme) => {
    if (get().theme === theme) return;
    storage.set(STORAGE_KEY, theme);
    applyToUnistyles(theme);
    set({ theme });
  },
}));

// Touch StyleSheet so unistyles is registered before any setTheme call;
// `theme/unistyles.ts` already calls `StyleSheet.configure(...)` on
// import — this assertion guards future refactors that might decouple.
void StyleSheet;
