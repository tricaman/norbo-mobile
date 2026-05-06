import { SettingsCard, SettingsRow } from "@/components/ui/SettingsRow";
import { TabScreen } from "@/components/ui/TabScreen";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Linking, Platform, ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useUnistyles();

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const platformName = Platform.OS === "ios" ? "ios" : "android";

  return (
    <TabScreen title={t("settings.title")}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SettingsCard>
          <SettingsRow
            iconName="person.crop.circle"
            label={t("settings.account")}
            subtitle={t("settings.accountSubtitle")}
            onPress={() => router.push("/settings/account")}
          />
          <SettingsRow
            iconName="globe"
            label={t("settings.language")}
            subtitle={t("settings.languageSubtitle")}
            onPress={() => router.push("/settings/language")}
          />
        </SettingsCard>

        <SettingsCard title={t("settings.help")}>
          <SettingsRow
            iconName="hand.raised"
            label={t("settings.privacyPolicy")}
            onPress={() =>
              Linking.openURL("https://tricaman.github.io/norbo-policy/")
            }
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
    </TabScreen>
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
