import { getLocales } from "expo-localization";

/**
 * Display languages the app ships translations for. These codes are the
 * canonical values used everywhere on the client: i18n resource keys, the
 * `Accept-Language` header (see `services/api.ts`) and the account's
 * `preferredLanguage` pushed to the backend.
 *
 * Region-tagged codes (e.g. `pt-BR`) are kept where the translation is
 * region-specific; the rest use the bare ISO-639-1 code.
 */
export const DISPLAY_LANGUAGES = [
  "en",
  "it",
  "ar",
  "de-DE",
  "es-ES",
  "fr-FR",
  "hi-IN",
  "id",
  "ja-JP",
  "pt-BR",
  "ro",
  "ru-RU",
  "tr-TR",
  "ur",
  "bn-BD",
  "zh-CN",
] as const;

export type Language = (typeof DISPLAY_LANGUAGES)[number];

/**
 * International default. Used when the device language doesn't match any
 * shipped translation — English, never Italian, so users worldwide get a
 * sane first experience.
 */
export const FALLBACK_LANGUAGE: Language = "en";

/** Maps a bare ISO-639-1 code to our canonical (possibly region-tagged) one. */
const BASE_TO_LANGUAGE: Record<string, Language> = {
  en: "en",
  it: "it",
  ar: "ar",
  de: "de-DE",
  es: "es-ES",
  fr: "fr-FR",
  hi: "hi-IN",
  id: "id",
  ja: "ja-JP",
  pt: "pt-BR",
  ro: "ro",
  ru: "ru-RU",
  tr: "tr-TR",
  ur: "ur",
  bn: "bn-BD",
  zh: "zh-CN",
};

export function isSupportedLanguage(value: unknown): value is Language {
  return (
    typeof value === "string" &&
    (DISPLAY_LANGUAGES as readonly string[]).includes(value)
  );
}

/**
 * Resolve the app display language from the device's locale settings.
 *
 * `getLocales()` returns the user's preferred locales in priority order,
 * so we walk them and pick the first that maps to a shipped translation:
 *   1. exact match on the full BCP-47 tag (keeps `pt-BR` vs `pt-PT`,
 *      `zh-CN` vs `zh-TW` distinctions when the device is that specific);
 *   2. otherwise fall back to the base language code (`de-AT` → `de-DE`).
 * If nothing matches we return English.
 *
 * Synchronous — safe to call at module load (i18n init) before React mounts.
 */
export function detectDeviceLanguage(): Language {
  for (const locale of getLocales()) {
    const tag = locale.languageTag?.toLowerCase();
    if (tag) {
      const exact = DISPLAY_LANGUAGES.find((l) => l.toLowerCase() === tag);
      if (exact) return exact;
    }
    const base = (
      locale.languageCode ??
      locale.languageTag?.split("-")[0] ??
      ""
    ).toLowerCase();
    const mapped = BASE_TO_LANGUAGE[base];
    if (mapped) return mapped;
  }
  return FALLBACK_LANGUAGE;
}
