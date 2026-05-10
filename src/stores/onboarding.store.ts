import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";

/**
 * Tracks whether the user has completed (or skipped) the post-signup
 * 3-step onboarding flow. Local-only flag — once set, the user is
 * never sent through onboarding again on this device.
 *
 * The backend has no `hasCompletedOnboarding` column yet (out of scope
 * for the current Identity Phase 1 task). When that lands, this store
 * should reconcile with the server value on hydration.
 */

const storage = createMMKV({ id: "norbo-onboarding" });
const KEY = "completed";

interface OnboardingState {
  hasCompleted: boolean;
  setCompleted: () => void;
  hydrate: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasCompleted: storage.getBoolean(KEY) ?? false,

  setCompleted: () => {
    storage.set(KEY, true);
    set({ hasCompleted: true });
  },

  hydrate: () => {
    set({ hasCompleted: storage.getBoolean(KEY) ?? false });
  },
}));
