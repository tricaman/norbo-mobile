import { create } from "zustand";

/**
 * Phase of the in-app (Play Core FLEXIBLE) download.
 * - `idle`: nothing downloading — the card shows "update now".
 * - `downloading`: Play is downloading in the background → progress bar.
 * - `downloaded`: ready, waiting for the user to tap "restart now".
 * - `installing`: restart/install in flight.
 * - `failed`: download cancelled or errored → the card offers "retry".
 */
export type DownloadPhase =
  | "idle"
  | "downloading"
  | "downloaded"
  | "installing"
  | "failed";

interface AppUpdateState {
  /** True when an optional update exists (published by `UpdateGate`). */
  available: boolean;
  /** True when the compact card is open (opened from the header icon). */
  open: boolean;
  phase: DownloadPhase;
  /** Download progress, 0..1 (meaningful while `downloading`). */
  progress: number;
  setAvailable: (available: boolean) => void;
  setOpen: (open: boolean) => void;
  setStatus: (phase: DownloadPhase, progress?: number) => void;
  resetDownload: () => void;
}

/**
 * EPHEMERAL (not persisted) state of the in-app update:
 * - `UpdateGate` (which runs `useAppVersion`) publishes `available`;
 * - `UpdateHeaderButton` shows the badge when `available` and opens the card;
 * - `in-app-updates.ts` pushes `phase`/`progress` from Play Core events;
 * - `UpdateGate` reads it all to render the card and its progress bar.
 *
 * Nothing is remembered across launches on purpose: the entry point is a
 * header icon, not a popup, so there is nothing to nag about and no
 * "dismissed version" to store.
 */
export const useAppUpdateStore = create<AppUpdateState>((set) => ({
  available: false,
  open: false,
  phase: "idle",
  progress: 0,
  setAvailable: (available) => set({ available }),
  setOpen: (open) => set({ open }),
  setStatus: (phase, progress = 0) => set({ phase, progress }),
  resetDownload: () => set({ phase: "idle", progress: 0 }),
}));
