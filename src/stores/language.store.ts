import i18n from "@/i18n/i18n";
import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({ id: "dit-language" });

export type Language = "en" | "it";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  hydrate: () => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: "en",

  setLanguage: (language) => {
    storage.set("language", language);
    i18n.changeLanguage(language);
    set({ language });
  },

  hydrate: () => {
    const stored = storage.getString("language") as Language | undefined;
    const language = stored ?? "en";
    i18n.changeLanguage(language);
    set({ language });
  },
}));
