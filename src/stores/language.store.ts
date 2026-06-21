import i18n from "@/i18n/i18n";
import {
  detectDeviceLanguage,
  isSupportedLanguage,
  type Language,
} from "@/i18n/detect-language";
import { usersApi } from "@/services/users.api";
import { useAuthStore } from "@/stores/auth.store";
import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";

/**
 * Language store — single source of truth for the app display language.
 *
 * Default behaviour matters: a fresh install has NO persisted choice, so
 * the app follows the device language (English fallback for unsupported
 * locales). Italian is no longer special — it's just one more language.
 * The user can pin a language in Settings; that explicit pick is persisted
 * to MMKV and from then on wins over the device locale.
 *
 * It also keeps the account's `preferredLanguage` in sync via
 * `PATCH /auth/me/preferences` so server-sent push notifications (which
 * can't read a live `Accept-Language` header) are localised to match what
 * the user sees. Synced on explicit change and on every login.
 */

// Re-exported so existing `import { Language } from "@/stores/language.store"`
// call sites keep working; the canonical definition lives in the i18n module.
export type { Language };

const storage = createMMKV({ id: "norbo-language" });
const STORAGE_KEY = "language";
const DEBOUNCE_MS = 500;

/**
 * The effective language: the user's explicit choice if they made one,
 * otherwise the current device language. We deliberately do NOT persist
 * the detected value, so the app keeps tracking the device locale until
 * the user pins a language in Settings.
 */
function readEffectiveLanguage(): Language {
  const stored = storage.getString(STORAGE_KEY);
  if (isSupportedLanguage(stored)) return stored;
  return detectDeviceLanguage();
}

let pendingSyncTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced `PATCH /auth/me/preferences` — only fires when authenticated. */
function scheduleServerSync(language: Language): void {
  if (pendingSyncTimer) clearTimeout(pendingSyncTimer);
  pendingSyncTimer = setTimeout(() => {
    pendingSyncTimer = null;
    if (!useAuthStore.getState().isAuthed) return;
    // Skip the round-trip if the account already matches.
    if (useAuthStore.getState().user?.preferredLanguage === language) return;
    void usersApi
      .updatePreferences({ preferredLanguage: language })
      .then((res) => {
        useAuthStore.getState().setUser(res.data);
      })
      .catch(() => {
        // Silent: the local language already applies. A future login will
        // reconcile the account value.
      });
  }, DEBOUNCE_MS);
}

interface LanguageState {
  language: Language;
  /** Explicit user pick from Settings: applies, persists, syncs to server. */
  setLanguage: (lang: Language) => void;
  /** Cold-start: applies the effective language to i18n and syncs the account. */
  hydrate: () => void;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: readEffectiveLanguage(),

  setLanguage: (language) => {
    if (get().language === language) return;
    storage.set(STORAGE_KEY, language);
    set({ language });
    void i18n.changeLanguage(language);
    scheduleServerSync(language);
  },

  hydrate: () => {
    const language = readEffectiveLanguage();
    set({ language });
    void i18n.changeLanguage(language);
    // Make sure the account's preferredLanguage matches the device/app
    // language so notifications are localised correctly.
    scheduleServerSync(language);
  },
}));

// Push the app language to the account on every login transition. Covers
// fresh signups (where hydrate ran before the session existed) and restored
// sessions whose stored `preferredLanguage` predates this device.
let wasAuthed = useAuthStore.getState().isAuthed;
useAuthStore.subscribe((state) => {
  if (state.isAuthed && !wasAuthed) {
    scheduleServerSync(useLanguageStore.getState().language);
  }
  wasAuthed = state.isAuthed;
});
