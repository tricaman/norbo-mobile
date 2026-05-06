import { DitDot } from "@/components/DitDot";
import { DitPressable } from "@/components/DitPressable";
import { useAuth } from "@/hooks/useAuth";
import type {
  AuthScreen as AuthScreenType,
  SocialProvider,
} from "@/types/auth.types";
import { extractError } from "@/utils/extract-error";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { ErrorMessage } from "../ErrorMessage";
import { SocialButton } from "../SocialButton";

interface Props {
  onNavigate: (screen: AuthScreenType) => void;
}

export function LandingView({ onNavigate }: Props) {
  const { theme } = useUnistyles();
  const { t } = useTranslation();
  const { signInWithSocial } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSocial = async (provider: SocialProvider) => {
    try {
      setError("");
      setLoading(true);
      await signInWithSocial(provider);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <DitDot size={28} />
          <Text style={styles.wordmark}>norbo</Text>
          <Text style={styles.tagline}>{t("auth.tagline")}</Text>
        </View>

        {/* Social login */}
        <View style={styles.social}>
          {error ? <ErrorMessage message={error} /> : null}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>{t("auth.signingIn")}</Text>
            </View>
          ) : (
            <>
              <SocialButton
                provider="google"
                onPress={() => handleSocial("google")}
              />
              {/* TODO: re-enable once Facebook/Microsoft OAuth is fully configured
              <SocialButton
                provider="facebook"
                onPress={() => handleSocial("facebook")}
              />
              <SocialButton
                provider="microsoft"
                onPress={() => handleSocial("microsoft")}
              />
              */}
            </>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t("auth.or")}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email option */}
        <View style={styles.email}>
          <DitPressable
            style={styles.primaryBtn}
            scale="cta"
            haptic="medium"
            onPress={() => onNavigate("email-input")}
          >
            <Text style={styles.primaryBtnText}>
              {t("auth.continueWithEmail")}
            </Text>
          </DitPressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  root: {
    flex: 1,
    paddingHorizontal: theme.spacing["3xl"],
    justifyContent: "flex-end" as const,
    paddingBottom: theme.spacing["5xl"],
  },
  logoArea: {
    alignItems: "center" as const,
    flex: 1,
    justifyContent: "center" as const,
    gap: theme.spacing.md,
  },
  wordmark: {
    ...theme.typography.display,
    color: theme.colors.textPrimary,
    letterSpacing: 8,
  },
  tagline: {
    fontFamily: "DMMono-Regular",
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "lowercase" as const,
    color: theme.colors.textTertiary,
  },
  social: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  divider: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  email: {
    gap: theme.spacing.sm,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.lg,
    alignItems: "center" as const,
  },
  primaryBtnText: {
    ...theme.typography.subhead,
    color: theme.colors.textOnPrimary,
  },
  loadingContainer: {
    paddingVertical: theme.spacing["2xl"],
    alignItems: "center" as const,
    gap: theme.spacing.md,
  },
  loadingText: {
    ...theme.typography.subhead,
    color: theme.colors.textSecondary,
  },
}));
