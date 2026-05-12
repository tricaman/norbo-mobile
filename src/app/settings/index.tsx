import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SettingsCard, SettingsRow } from "@/components/ui/SettingsRow";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import Constants from "expo-constants";
import { Linking, Platform, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";

const TERMS_URL =
  "https://tricaman.github.io/norbo-policy/safety-standards.html";
const PRIVACY_URL = "https://tricaman.github.io/norbo-policy/";
const SUPPORT_EMAIL = "support@norbo.app";

/**
 * Settings hub — raggruppa tutte le impostazioni dell'app.
 *
 * Layout:
 *  1. Preferenze (notifiche, tema, lingua)
 *  2. Account (elimina account)
 *  3. Legale e supporto (ToS, privacy, supporto)
 *  4. Info app (versione)
 */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const platformName = Platform.OS === "ios" ? "ios" : "android";

  const handleSupport = async () => {
    const url = `mailto:${SUPPORT_EMAIL}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <Screen>
      <ScreenHeader title={t("settings.title")} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SettingsCard title={t("settings.preferencesSection")}>
          <SettingsRow
            iconName="bell"
            label={t("settings.notifications")}
            subtitle={t("settings.notificationsSubtitle")}
            onPress={() => router.push("/settings/notifications")}
          />
          <SettingsRow
            iconName="paintpalette"
            label={t("settings.theme")}
            subtitle={t("settings.themeSubtitle")}
            onPress={() => router.push("/settings/theme")}
          />
          <SettingsRow
            iconName="globe"
            label={t("settings.language")}
            subtitle={t("settings.languageSubtitle")}
            onPress={() => router.push("/settings/language")}
          />
        </SettingsCard>

        <SettingsCard title={t("settings.accountSection")}>
          <SettingsRow
            iconName="trash"
            label={t("settings.deleteAccount")}
            onPress={() => router.push("/settings/account/delete-account")}
          />
        </SettingsCard>

        <SettingsCard title={t("settings.legalSection")}>
          <SettingsRow
            iconName="doc.text"
            label={t("settings.termsOfService")}
            onPress={() => void Linking.openURL(TERMS_URL)}
          />
          <SettingsRow
            iconName="hand.raised"
            label={t("settings.privacyPolicy")}
            onPress={() => void Linking.openURL(PRIVACY_URL)}
          />
          <SettingsRow
            iconName="questionmark.circle"
            label={t("settings.support")}
            subtitle={t("settings.supportSubtitle")}
            onPress={() => void handleSupport()}
          />
        </SettingsCard>

        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>
            {t(
              platformName === "ios"
                ? "settings.appInfoIos"
                : "settings.appInfoAndroid",
            )}
          </Text>
          <Text style={styles.appInfoText}>
            {t("settings.version", { version: appVersion })}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing["3xl"],
    paddingBottom: SCREEN_BOTTOM_PADDING,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  appInfo: {
    marginTop: "auto",
    paddingTop: theme.spacing["2xl"],
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  appInfoText: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
}));
