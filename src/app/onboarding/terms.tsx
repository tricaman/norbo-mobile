import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Screen } from "@/components/ui/Screen";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useMutation } from "@/hooks/useMutation";
import { authApi } from "@/services/auth.api";
import { useAuthStore } from "@/stores/auth.store";
import { extractError } from "@/utils/extract-error";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const TERMS_URL =
  "https://tricaman.github.io/norbo-policy/safety-standards.html";

/**
 * OnboardingTermsScreen — blocking EULA acceptance step shown after the
 * first successful login (when user.termsAcceptedAt is null).
 *
 * Behaviour:
 * - Shows a TOS link, a zero-tolerance statement, and an unchecked checkbox.
 * - The continue button is disabled until the checkbox is ticked.
 * - On submit, POST /auth/accept-terms. On success, the store is
 *   updated and the root layout redirects the user to the main tabs.
 * - This screen has no back button: the user cannot bypass it.
 */
export default function OnboardingTermsScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.acceptTerms(),
    showErrorToast: false,
    onSuccess: (res) => {
      // Backend returns the updated own profile (including termsAcceptedAt).
      // Merge into existing store shape so AuthUser stays consistent.
      if (user) {
        setUser({ ...user, termsAcceptedAt: res.data.termsAcceptedAt });
      }
    },
    onError: (err) => {
      setError(extractError(err) || t("terms.error"));
    },
  });

  const canContinue = accepted && !isPending;

  return (
    <Screen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t("terms.title")}</Text>
        <Text style={styles.intro}>{t("terms.intro")}</Text>

        <NorboPressable
          style={styles.linkRow}
          scale="row"
          haptic="light"
          onPress={() => void Linking.openURL(TERMS_URL)}
        >
          <IconSymbol
            name="doc.text"
            size={18}
            tintColor={theme.colors.primary}
          />
          <Text style={styles.linkText}>{t("terms.readLink")}</Text>
        </NorboPressable>

        <View style={styles.warningCard}>
          <Text style={styles.warningText}>{t("terms.zeroTolerance")}</Text>
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
          <Text style={styles.checkboxLabel}>{t("terms.checkbox")}</Text>
        </NorboPressable>
      </ScrollView>

      {/* Bottom-anchored CTA — mirrors the login button placement so the
          user always sees the primary action low on the screen. */}
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
            {isPending ? "..." : t("terms.continue")}
          </Text>
        </NorboPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing["3xl"],
    paddingBottom: theme.spacing["2xl"],
    gap: theme.spacing.lg,
  },
  footer: {
    paddingHorizontal: theme.spacing["3xl"],
    paddingBottom: SCREEN_BOTTOM_PADDING,
    paddingTop: theme.spacing.md,
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
  warningCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
  },
  warningText: {
    ...theme.typography.footnote,
    color: theme.colors.textPrimary,
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
