import { TabScreen } from "@/components/ui/TabScreen";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/**
 * Home tab — placeholder while the new norbo product surface is built.
 *
 * Phase 4 of the dit → norbo fork removed the legacy ping/contacts/profile
 * domain. The remaining shell (auth, settings, push tokens, design system)
 * is intentionally kept so feature work can resume on a clean foundation.
 */
export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <TabScreen title={t("tabs.profile")}>
      <View style={styles.body}>
        <Text style={styles.title}>norbo</Text>
        <Text style={styles.subtitle}>{t("common.continue")}</Text>
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing["3xl"],
    paddingBottom: SCREEN_BOTTOM_PADDING,
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: "DMMono-Medium",
    fontSize: 22,
    textAlign: "center",
  },
  subtitle: {
    color: theme.colors.textTertiary,
    fontFamily: "DMMono-Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
}));
