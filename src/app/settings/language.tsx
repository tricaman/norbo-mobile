import { IconSymbol } from "@/components/ui/IconSymbol";
import { SaveHeaderAction } from "@/components/ui/SaveHeaderAction";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SettingsCard, SettingsRow } from "@/components/ui/SettingsRow";
import { useLanguageStore, type Language } from "@/stores/language.store";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * Single-locale MVP: only Italian is selectable. Other languages will
 * be unlocked once their translation files reach parity with `it.ts`.
 * The list shape is kept generic so adding entries is a no-refactor
 * change.
 */
const LANGUAGES: {
  code: Language;
  labelKey: "languageScreen.en" | "languageScreen.it";
  enabled: boolean;
}[] = [
  { code: "it", labelKey: "languageScreen.it", enabled: true },
  { code: "en", labelKey: "languageScreen.en", enabled: false },
];

export default function LanguageScreen() {
  const { theme } = useUnistyles();
  const { t } = useTranslation();
  const router = useRouter();
  const currentLanguage = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const [selected, setSelected] = useState<Language>(currentLanguage);

  const handleSave = () => {
    setLanguage(selected);
    router.back();
  };

  return (
    <Screen>
      <ScreenHeader
        title={t("languageScreen.title")}
        right={<SaveHeaderAction onPress={handleSave} />}
      />

      <View style={styles.body}>
        <SettingsCard
          dividerInset={theme.spacing.xl}
          title={t("languageScreen.title")}
        >
          {LANGUAGES.map((lang) => (
            <SettingsRow
              key={lang.code}
              label={t(lang.labelKey)}
              onPress={lang.enabled ? () => setSelected(lang.code) : undefined}
              labelStyle={
                lang.enabled ? undefined : { color: theme.colors.textTertiary }
              }
              right={
                lang.enabled && selected === lang.code ? (
                  <IconSymbol
                    name="checkmark"
                    size={16}
                    tintColor={theme.colors.primary}
                  />
                ) : !lang.enabled ? (
                  <Text style={styles.comingSoon}>
                    {t("common.comingSoon")}
                  </Text>
                ) : null
              }
            />
          ))}
        </SettingsCard>
        <Text style={styles.description}>
          {t("languageScreen.description")}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing["2xl"],
    gap: theme.spacing.lg,
  },
  description: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.spacing.sm,
  },
  comingSoon: {
    ...theme.typography.footnote,
    color: theme.colors.textTertiary,
  },
}));
