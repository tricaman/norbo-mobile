import { IconSymbol } from "@/components/ui/IconSymbol";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SettingsCard, SettingsRow } from "@/components/ui/SettingsRow";
import { useThemeStore } from "@/stores/theme.store";
import type { SupportedTheme } from "@/types/preferences.schema";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const THEMES: {
  code: SupportedTheme;
  labelKey:
    | "themeScreen.light"
    | "themeScreen.dark"
    | "themeScreen.system";
}[] = [
  { code: "light", labelKey: "themeScreen.light" },
  { code: "dark", labelKey: "themeScreen.dark" },
  { code: "system", labelKey: "themeScreen.system" },
];

/**
 * Theme picker — light / dark / system.
 *
 * Selecting a row applies the change immediately (no Save button) so
 * the user can preview the result. The store handles MMKV persistence
 * and the debounced server sync.
 */
export default function ThemeScreen() {
  const { theme } = useUnistyles();
  const { t } = useTranslation();
  const current = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <Screen>
      <ScreenHeader title={t("themeScreen.title")} />

      <View style={styles.body}>
        <SettingsCard
          dividerInset={theme.spacing.xl}
          title={t("themeScreen.sectionLabel")}
        >
          {THEMES.map((entry) => (
            <SettingsRow
              key={entry.code}
              label={t(entry.labelKey)}
              onPress={() => setTheme(entry.code)}
              right={
                current === entry.code ? (
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
        <Text style={styles.description}>{t("themeScreen.description")}</Text>
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
}));
