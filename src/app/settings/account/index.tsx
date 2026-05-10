import { AvatarUploader } from "@/components/media/AvatarUploader";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SettingsCard, SettingsRow } from "@/components/ui/SettingsRow";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/services/users.api";
import { useAuthStore } from "@/stores/auth.store";
import type { MediaAsset } from "@/types/media.types";
import { haptics } from "@/utils/haptics";
import { toast } from "@/utils/toast";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Linking, ScrollView, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const TERMS_URL =
  "https://tricaman.github.io/norbo-policy/safety-standards.html";
const PRIVACY_URL = "https://tricaman.github.io/norbo-policy/";
const SUPPORT_EMAIL = "support@norbo.app";

/**
 * Account hub — entry point for everything Identity & Access related.
 *
 * Layout follows the design system's grouped-card pattern:
 *  1. Profile (name + photo + email)
 *  2. Preferences (notifications, theme, language)
 *  3. Your data (export placeholder, delete account)
 *  4. Legal & support (ToS, privacy, support)
 *  5. Sign out (terminal action)
 */
export default function AccountHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useUnistyles();
  const user = useAuthStore((s) => s.user);
  const { signOut } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);

  const handleAvatarUploaded = async (asset: MediaAsset) => {
    const photoUrl = asset.thumbMdUrl ?? asset.originalUrl;
    if (!photoUrl || !user) return;
    try {
      const { data } = await usersApi.updateProfile({ photoUrl });
      setUser(data);
    } catch {
      toast.show({ type: "error", title: t("common.failedToSave") });
    }
  };

  const handleSignOut = async () => {
    haptics.medium();
    await signOut();
  };

  const handleSupport = async () => {
    const url = `mailto:${SUPPORT_EMAIL}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      toast.show({
        type: "error",
        title: SUPPORT_EMAIL,
      });
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <Screen>
      <ScreenHeader title={t("accountHub.title")} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── Profile ────────────────────────────────────────────── */}
        <SettingsCard title={t("accountHub.profileSection")}>
          <View style={styles.avatarRow}>
            <AvatarUploader
              name={user?.name}
              currentUrl={user?.photoUrl ?? user?.avatarUrl}
              onUploaded={(asset) => void handleAvatarUploaded(asset)}
              size="xl"
            />
          </View>
          <SettingsRow
            iconName="envelope"
            label={user?.email ?? "—"}
            subtitle={t("editInfo.email")}
          />
          <SettingsRow
            iconName="person.crop.circle"
            label={user?.name || t("common.tapToSet")}
            subtitle={t("accountHub.editProfileSubtitle")}
            onPress={() => router.push("/settings/account/name")}
          />
        </SettingsCard>

        {/* ── Preferences ────────────────────────────────────────── */}
        <SettingsCard title={t("accountHub.preferencesSection")}>
          <SettingsRow
            iconName="bell"
            label={t("accountHub.notifications")}
            subtitle={t("accountHub.notificationsSubtitle")}
            onPress={() => router.push("/settings/notifications")}
          />
          <SettingsRow
            iconName="paintpalette"
            label={t("accountHub.theme")}
            subtitle={t("accountHub.themeSubtitle")}
            onPress={() => router.push("/settings/theme")}
          />
          <SettingsRow
            iconName="globe"
            label={t("accountHub.language")}
            subtitle={t("accountHub.languageSubtitle")}
            onPress={() => router.push("/settings/language")}
          />
        </SettingsCard>

        {/* ── Your data ──────────────────────────────────────────── */}
        <SettingsCard title={t("accountHub.dataSection")}>
          <SettingsRow
            iconName="square.and.arrow.up"
            label={t("accountHub.exportData")}
            subtitle={t("accountHub.exportDataSubtitle")}
            onPress={() =>
              toast.show({
                type: "warning",
                title: t("common.comingSoon"),
              })
            }
          />
          <SettingsRow
            iconName="trash"
            iconColor={theme.colors.error}
            label={t("accountHub.deleteAccount")}
            labelStyle={{ color: theme.colors.error }}
            onPress={() => router.push("/settings/account/delete-account")}
          />
        </SettingsCard>

        {/* ── Legal & support ────────────────────────────────────── */}
        <SettingsCard title={t("accountHub.legalSection")}>
          <SettingsRow
            iconName="doc.text"
            label={t("accountHub.termsOfService")}
            onPress={() => void Linking.openURL(TERMS_URL)}
          />
          <SettingsRow
            iconName="hand.raised"
            label={t("accountHub.privacyPolicy")}
            onPress={() => void Linking.openURL(PRIVACY_URL)}
          />
          <SettingsRow
            iconName="questionmark.circle"
            label={t("accountHub.support")}
            subtitle={t("accountHub.supportSubtitle")}
            onPress={() => void handleSupport()}
          />
        </SettingsCard>

        {/* ── Sign out ───────────────────────────────────────────── */}
        <SettingsCard>
          <SettingsRow
            iconName="arrow.right.circle"
            iconColor={theme.colors.error}
            label={t("accountHub.signOut")}
            labelStyle={{ color: theme.colors.error }}
            onPress={() => void handleSignOut()}
          />
        </SettingsCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  avatarRow: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing["2xl"],
    paddingBottom: SCREEN_BOTTOM_PADDING,
    gap: theme.spacing.lg,
  },
}));
