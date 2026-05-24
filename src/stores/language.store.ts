import i18n from "@/i18n/i18n";
import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({ id: "norbo-language" });

export type Language =
  | "en"
  | "it"
  | "ar"
  | "de-DE"
  | "es-ES"
  | "fr-FR"
  | "hi-IN"
  | "id"
  | "ja-JP"
  | "pt-BR"
  | "ro"
  | "ru-RU"
  | "tr-TR"
  | "ur"
  | "bn-BD"
  | "zh-CN";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  hydrate: () => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: "it",

  setLanguage: (language) => {
    storage.set("language", language);
    set({ language });
    void i18n.changeLanguage(language);
  },

  hydrate: () => {
    const stored = storage.getString("language") as Language | undefined;
    const language = stored ?? "it";
    set({ language });
    void i18n.changeLanguage(language);
  },
}));
