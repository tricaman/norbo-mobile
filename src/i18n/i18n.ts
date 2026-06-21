import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { detectDeviceLanguage } from "./detect-language";
import en from "./locales/en";
import it from "./locales/it";
import ar from "./locales/ar";
import de from "./locales/de";
import es from "./locales/es";
import fr from "./locales/fr";
import hi from "./locales/hi";
import id from "./locales/id";
import ja from "./locales/ja";
import pt from "./locales/pt";
import ro from "./locales/ro";
import ru from "./locales/ru";
import tr from "./locales/tr";
import ur from "./locales/ur";
import bn from "./locales/bn";
import zh from "./locales/zh";

export const defaultNS = "translation" as const;

export const resources = {
  en: { translation: en },
  it: { translation: it },
  ar: { translation: ar },
  "de-DE": { translation: de },
  "es-ES": { translation: es },
  "fr-FR": { translation: fr },
  "hi-IN": { translation: hi },
  id: { translation: id },
  "ja-JP": { translation: ja },
  "pt-BR": { translation: pt },
  ro: { translation: ro },
  "ru-RU": { translation: ru },
  "tr-TR": { translation: tr },
  ur: { translation: ur },
  "bn-BD": { translation: bn },
  "zh-CN": { translation: zh },
} as const;

// Initialise to the device language so the very first render is already in
// the user's language (no flash of Italian). The language store may override
// this on hydration if the user previously picked a language in Settings.
// `fallbackLng` is English — the international default — never Italian.
i18n.use(initReactI18next).init({
  lng: detectDeviceLanguage(),
  fallbackLng: "en",
  defaultNS,
  resources,
  interpolation: { escapeValue: false },
});

export default i18n;
