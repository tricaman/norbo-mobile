import { IconSymbol } from "@/components/ui/IconSymbol";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SettingsCard, SettingsRow } from "@/components/ui/SettingsRow";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useLanguageStore, type Language } from "@/stores/language.store";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const LANGUAGES = [
  { code: "it", labelKey: "languageScreen.it", flag: "🇮🇹" },
  { code: "en", labelKey: "languageScreen.en", flag: "🇬🇧" },
  { code: "ar", labelKey: "languageScreen.ar", flag: "🇸🇦" },
  { code: "de-DE", labelKey: "languageScreen.de-DE", flag: "🇩🇪" },
  { code: "es-ES", labelKey: "languageScreen.es-ES", flag: "🇪🇸" },
  { code: "fr-FR", labelKey: "languageScreen.fr-FR", flag: "🇫🇷" },
  { code: "hi-IN", labelKey: "languageScreen.hi-IN", flag: "🇮🇳" },
  { code: "id", labelKey: "languageScreen.id", flag: "🇮🇩" },
  { code: "ja-JP", labelKey: "languageScreen.ja-JP", flag: "🇯🇵" },
  { code: "pt-BR", labelKey: "languageScreen.pt-BR", flag: "🇧🇷" },
  { code: "ro", labelKey: "languageScreen.ro", flag: "🇷🇴" },
  { code: "ru-RU", labelKey: "languageScreen.ru-RU", flag: "🇷🇺" },
  { code: "tr-TR", labelKey: "languageScreen.tr-TR", flag: "🇹🇷" },
  { code: "ur", labelKey: "languageScreen.ur", flag: "🇵🇰" },
  { code: "bn-BD", labelKey: "languageScreen.bn-BD", flag: "🇧🇩" },
  { code: "zh-CN", labelKey: "languageScreen.zh-CN", flag: "🇨🇳" },
] as const satisfies readonly {
  code: Language;
  labelKey: string;
  flag: string;
}[];

export default function LanguageScreen() {
  const { theme } = useUnistyles();
  const { t } = useTranslation();
  const currentLanguage = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  return (
    <Screen>
      <ScreenHeader title={t("languageScreen.title")} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SettingsCard
          dividerInset={theme.spacing.xl}
          title={t("languageScreen.title")}
        >
          {LANGUAGES.map((lang) => (
            <SettingsRow
              key={lang.code}
              label={`${lang.flag}  ${t(lang.labelKey)}`}
              onPress={() => setLanguage(lang.code as Language)}
              right={
                currentLanguage === lang.code ? (
                  <IconSymbol
                    name="checkmark"
                    size={16}
                    tintColor={theme.colors.primary}
                  />
                ) : null
              }
            />
          ))}
        </SettingsCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing["2xl"],
    paddingBottom: SCREEN_BOTTOM_PADDING,
    gap: theme.spacing.lg,
  },
}));
