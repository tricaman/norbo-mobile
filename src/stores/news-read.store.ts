import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";

/**
 * Tracks which news items the user has already opened, purely client-side.
 * There is no server-side "read" concept — read/unread is a local UX aid so
 * the Profile CTA can show an unread count and the list can dim seen items.
 *
 * Persisted as a JSON array of ids under a single MMKV key (mirrors the
 * onboarding / auth stores). A `Set` is kept alongside the array for O(1)
 * membership checks without re-scanning on every render.
 */

const storage = createMMKV({ id: "norbo-news-read" });
const KEY = "readIds";

function loadReadIds(): string[] {
  try {
    const parsed = JSON.parse(storage.getString(KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function persist(ids: string[]): void {
  storage.set(KEY, JSON.stringify(ids));
}

interface NewsReadState {
  readIds: string[];
  /** Internal fast-lookup mirror of `readIds`. */
  readSet: Set<string>;
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  unreadCount: (allIds: string[]) => number;
  hydrate: () => void;
  reset: () => void;
}

export const useNewsReadStore = create<NewsReadState>((set, get) => {
  const initial = loadReadIds();
  return {
    readIds: initial,
    readSet: new Set(initial),

    isRead: (id) => get().readSet.has(id),

    markRead: (id) => {
      const { readSet, readIds } = get();
      if (readSet.has(id)) return; // no-op if already read
      const nextIds = [...readIds, id];
      persist(nextIds);
      set({ readIds: nextIds, readSet: new Set(nextIds) });
    },

    unreadCount: (allIds) => {
      const { readSet } = get();
      let count = 0;
      for (const id of allIds) if (!readSet.has(id)) count += 1;
      return count;
    },

    hydrate: () => {
      const ids = loadReadIds();
      set({ readIds: ids, readSet: new Set(ids) });
    },

    reset: () => {
      persist([]);
      set({ readIds: [], readSet: new Set() });
    },
  };
});
