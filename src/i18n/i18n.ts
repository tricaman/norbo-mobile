import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import it from "./locales/it";

export const defaultNS = "translation" as const;

export const resources = {
  en: { translation: en },
  it: { translation: it },
} as const;

// Default locale is Italian (MVP single-locale per task spec). English
// resources are kept as a future-proof fallback so adding new languages
// is a no-refactor change.
i18n.use(initReactI18next).init({
  lng: "it",
  fallbackLng: "it",
  defaultNS,
  resources,
  interpolation: { escapeValue: false },
});

export default i18n;
