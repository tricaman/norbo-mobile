import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Screen } from "@/components/ui/Screen";
import { useMutation } from "@/hooks/useMutation";
import { authApi } from "@/services/auth.api";
import { useAuthStore } from "@/stores/auth.store";
import { extractError } from "@/utils/extract-error";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * Builds the public URL of the full disclaimer document, hosted on the
 * marketing site. The site only ships `it` and `en` — anything else falls
 * back to English.
 */
function disclaimerUrl(language: string): string {
  const lang = language.toLowerCase().startsWith("it") ? "it" : "en";
  return `https://norbo.app/${lang}/tools-disclaimer`;
}

/**
 * OnboardingToolsDisclaimerScreen — blocking acceptance step shown right
 * after the EULA (when user.toolsDisclaimerAcceptedAt is null).
 *
 * Behaviour mirrors the TOS screen:
 * - Shows a short summary, a link to the full disclaimer, and an unchecked
 *   checkbox.
 * - The continue button is disabled until the checkbox is ticked.
 * - On submit, POST /auth/accept-tools-disclaimer. On success the store is
 *   updated and the root layout moves the user forward.
 * - No back button: the user cannot bypass it.
 */
export default function OnboardingToolsDisclaimerScreen() {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.acceptToolsDisclaimer(),
    showErrorToast: false,
    onSuccess: (res) => {
      if (user) {
        setUser({
          ...user,
          toolsDisclaimerAcceptedAt: res.data.toolsDisclaimerAcceptedAt,
        });
      }
    },
    onError: (err) => {
      setError(extractError(err) || t("toolsDisclaimer.error"));
    },
  });

  const canContinue = accepted && !isPending;

  const points = [
    t("toolsDisclaimer.point1"),
    t("toolsDisclaimer.point2"),
    t("toolsDisclaimer.point3"),
    t("toolsDisclaimer.point4"),
  ];

  return (
    <Screen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t("toolsDisclaimer.title")}</Text>
        <Text style={styles.intro}>{t("toolsDisclaimer.intro")}</Text>

        <NorboPressable
          style={styles.linkRow}
          scale="row"
          haptic="light"
          onPress={() => void Linking.openURL(disclaimerUrl(i18n.language))}
        >
          <IconSymbol
            name="doc.text"
            size={18}
            tintColor={theme.colors.primary}
          />
          <Text style={styles.linkText}>{t("toolsDisclaimer.readLink")}</Text>
        </NorboPressable>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {t("toolsDisclaimer.summaryTitle")}
          </Text>
          {points.map((point, i) => (
            <View key={i} style={styles.pointRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.pointText}>{point}</Text>
            </View>
          ))}
        </View>

        <NorboPressable
          style={styles.checkboxRow}
          scale="row"
          haptic="light"
          onPress={() => setAccepted((v) => !v)}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted ? (
              <IconSymbol
                name="checkmark"
                size={14}
                tintColor={theme.colors.textOnPrimary}
              />
            ) : null}
          </View>
          <Text style={styles.checkboxLabel}>
            {t("toolsDisclaimer.checkbox")}
          </Text>
        </NorboPressable>
        <View style={styles.spacer} />

        <View style={styles.footer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <NorboPressable
            style={[styles.primaryBtn, !canContinue && styles.btnDisabled]}
            scale="cta"
            haptic="medium"
            disabled={!canContinue}
            onPress={() => {
              setError("");
              mutate();
            }}
          >
            <Text style={styles.primaryBtnText}>
              {isPending ? "..." : t("toolsDisclaimer.continue")}
            </Text>
          </NorboPressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing["3xl"],
    paddingBottom: theme.spacing["2xl"],
    gap: theme.spacing.lg,
  },
  spacer: {
    flexGrow: 1,
  },
  footer: {
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  title: {
    ...theme.typography.title1,
    color: theme.colors.textPrimary,
  },
  intro: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  linkText: {
    ...theme.typography.subhead,
    color: theme.colors.primary,
    textDecorationLine: "underline",
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
    ...theme.card,
  },
  summaryTitle: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  pointRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  bullet: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  pointText: {
    ...theme.typography.footnote,
    color: theme.colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  checkboxLabel: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  errorText: {
    ...theme.typography.footnote,
    color: theme.colors.error,
    textAlign: "center",
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.lg,
    alignItems: "center" as const,
  },
  btnDisabled: { opacity: 0.4 },
  primaryBtnText: {
    ...theme.typography.subhead,
    color: theme.colors.textOnPrimary,
  },
}));
