import { IconSymbol } from "@/components/ui/IconSymbol";
import { SaveHeaderAction } from "@/components/ui/SaveHeaderAction";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SettingsCard, SettingsRow } from "@/components/ui/SettingsRow";
import { useLanguageStore, type Language } from "@/stores/language.store";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const LANGUAGES: {
  code: Language;
  labelKey: "languageScreen.en" | "languageScreen.it";
}[] = [
  { code: "en", labelKey: "languageScreen.en" },
  { code: "it", labelKey: "languageScreen.it" },
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
              onPress={() => setSelected(lang.code)}
              right={
                selected === lang.code ? (
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
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing["2xl"],
    gap: theme.spacing.sm,
  },
}));
