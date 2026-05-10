import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Screen } from "@/components/ui/Screen";
import { SettingsCard, SettingsRow } from "@/components/ui/SettingsRow";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useOnboardingStore } from "@/stores/onboarding.store";
import { useThemeStore } from "@/stores/theme.store";
import type { SupportedTheme } from "@/types/preferences.schema";
import notifee from "@notifee/react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const THEMES: {
  code: SupportedTheme;
  labelKey: "themeScreen.light" | "themeScreen.dark" | "themeScreen.system";
}[] = [
  { code: "light", labelKey: "themeScreen.light" },
  { code: "dark", labelKey: "themeScreen.dark" },
  { code: "system", labelKey: "themeScreen.system" },
];

const TOTAL_STEPS = 3;

/**
 * Post-signup 3-step onboarding (welcome → theme → notifications).
 *
 * Each step is independently skippable. The flag that suppresses the
 * flow on subsequent launches lives in `useOnboardingStore` (MMKV-backed,
 * device-local). The notifications step requests OS permission via
 * Notifee — preference toggles default to ON server-side; the user can
 * fine-tune them later from `settings/notifications`.
 */
export default function OnboardingWelcomeScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const setCompleted = useOnboardingStore((s) => s.setCompleted);
  const currentTheme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const [step, setStep] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const finish = () => {
    setCompleted();
    router.replace("/(tabs)");
  };

  const next = () => {
    if (step === TOTAL_STEPS - 1) {
      finish();
      return;
    }
    setPermissionDenied(false);
    setStep((s) => s + 1);
  };

  const enableNotifications = async () => {
    try {
      const settings = await notifee.requestPermission();
      // 0 = denied. 1+ = various granted states (authorized, provisional…).
      if (settings.authorizationStatus < 1) {
        setPermissionDenied(true);
        return;
      }
      next();
    } catch {
      // Notifee can throw on some Android emulators with broken Play
      // Services. Treat as a soft failure and let the user move on.
      next();
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.stepProgress}>
          {t("onboarding.stepProgress", {
            current: String(step + 1),
            total: String(TOTAL_STEPS),
          })}
        </Text>
        <NorboPressable scale="row" haptic="light" onPress={finish}>
          <Text style={styles.skipButton}>{t("onboarding.skip")}</Text>
        </NorboPressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <View style={styles.stepBody}>
            <Text style={styles.title}>{t("onboarding.welcomeTitle")}</Text>
            <Text style={styles.body}>{t("onboarding.welcomeBody")}</Text>
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepBody}>
            <Text style={styles.title}>{t("onboarding.themeStepTitle")}</Text>
            <Text style={styles.body}>{t("onboarding.themeStepBody")}</Text>
            <SettingsCard dividerInset={theme.spacing.xl}>
              {THEMES.map((entry) => (
                <SettingsRow
                  key={entry.code}
                  label={t(entry.labelKey)}
                  onPress={() => setTheme(entry.code)}
                  right={
                    currentTheme === entry.code ? (
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
        )}

        {step === 2 && (
          <View style={styles.stepBody}>
            <Text style={styles.title}>
              {t("onboarding.notificationsStepTitle")}
            </Text>
            <Text style={styles.body}>
              {t("onboarding.notificationsStepBody")}
            </Text>
            <NorboPressable
              style={styles.secondaryBtn}
              scale="cta"
              haptic="medium"
              onPress={() => void enableNotifications()}
            >
              <Text style={styles.secondaryBtnText}>
                {t("onboarding.notificationsEnable")}
              </Text>
            </NorboPressable>
            {permissionDenied ? (
              <Text style={styles.errorText}>
                {t("onboarding.notificationsDenied")}
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <NorboPressable
          style={styles.primaryBtn}
          scale="cta"
          haptic="medium"
          onPress={next}
        >
          <Text style={styles.primaryBtnText}>
            {step === TOTAL_STEPS - 1
              ? t("onboarding.finish")
              : t("onboarding.next")}
          </Text>
        </NorboPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  stepProgress: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  skipButton: {
    ...theme.typography.subhead,
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing["2xl"],
    paddingBottom: theme.spacing["2xl"],
    flexGrow: 1,
  },
  stepBody: {
    gap: theme.spacing.lg,
  },
  title: {
    ...theme.typography.title1,
    color: theme.colors.textPrimary,
  },
  body: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  footer: {
    paddingHorizontal: theme.spacing["3xl"],
    paddingBottom: SCREEN_BOTTOM_PADDING,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
  },
  primaryBtnText: {
    ...theme.typography.subhead,
    color: theme.colors.textOnPrimary,
  },
  secondaryBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
  },
  secondaryBtnText: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
  },
  errorText: {
    ...theme.typography.footnote,
    color: theme.colors.warning,
    textAlign: "center",
  },
}));
