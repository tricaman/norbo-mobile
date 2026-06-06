import { NorboPressable } from "@/components/CustomPressable";
import { toast } from "@/utils/toast";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * PremiumPaywall — the real gate UI shown by `PremiumGate` when a tool is
 * locked. Generic (no per-tool knowledge). The subscribe CTA is a stub:
 * store payment-provider / receipt integration is a separate piece of work,
 * so for now it just acknowledges intent.
 */
export function PremiumPaywall(): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>{t("paywall.badge")}</Text>
      <Text style={styles.title}>{t("paywall.title")}</Text>
      <Text style={styles.description}>{t("paywall.description")}</Text>
      <NorboPressable
        scale="cta"
        haptic="medium"
        style={[styles.cta, { backgroundColor: theme.colors.primary }]}
        onPress={() => toast.show({ type: "success", title: t("paywall.comingSoon") })}
      >
        <Text style={[styles.ctaLabel, { color: theme.colors.textOnPrimary }]}>
          {t("paywall.cta")}
        </Text>
      </NorboPressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  badge: {
    ...theme.monoTypography.captionMono,
    color: theme.colors.primary,
  },
  title: {
    ...theme.typography.title2,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  description: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  cta: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing["2xl"],
    borderRadius: theme.radius.pill,
  },
  ctaLabel: {
    ...theme.typography.subhead,
    fontFamily: theme.fonts.monoMd,
  },
}));
