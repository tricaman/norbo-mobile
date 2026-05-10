import { SettingsCard, SettingsRow } from "@/components/ui/SettingsRow";
import { TabScreen } from "@/components/ui/TabScreen";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform, ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const platformName = Platform.OS === "ios" ? "ios" : "android";

  return (
    <TabScreen title={t("settings.title")}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* The tab-level settings is now a thin entry point: the real
            hub lives at /settings/account so that all Identity & Access
            sub-screens share the same navigation root. */}
        <SettingsCard>
          <SettingsRow
            iconName="person.crop.circle"
            label={t("settings.account")}
            subtitle={t("settings.accountSubtitle")}
            onPress={() => router.push("/settings/account")}
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
