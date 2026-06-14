import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";

/**
 * Remembers which `latest` version the user dismissed the soft update prompt
 * for, so the dismissible "update available" sheet doesn't nag on every
 * launch. When a newer `latest` ships, the stored value no longer matches and
 * the prompt shows again. The forced/blocking gate ignores this — it can't be
 * dismissed.
 */
const storage = createMMKV({ id: "norbo-app-update" });
const KEY = "dismissedVersion";

interface AppUpdateState {
  dismissedVersion: string | null;
  /** Hide the soft prompt for this `latest` version. */
  dismiss: (version: string) => void;
}

export const useAppUpdateStore = create<AppUpdateState>((set) => ({
  dismissedVersion: storage.getString(KEY) ?? null,
  dismiss: (version) => {
    storage.set(KEY, version);
    set({ dismissedVersion: version });
  },
}));
