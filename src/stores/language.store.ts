import i18n from "@/i18n/i18n";
import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({ id: "norbo-language" });

export type Language = "en" | "it";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  hydrate: () => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: "it",

  setLanguage: (language) => {
    storage.set("language", language);
    i18n.changeLanguage(language);
    set({ language });
  },

  hydrate: () => {
    const stored = storage.getString("language") as Language | undefined;
    const language = stored ?? "it";
    i18n.changeLanguage(language);
    set({ language });
  },
}));
