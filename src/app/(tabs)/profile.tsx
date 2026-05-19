import { PageTitle } from "@/components/ui/PageTitle";
import { SettingsCard, SettingsRow } from "@/components/ui/SettingsRow";
import { TabScreen } from "@/components/ui/TabScreen";
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
import { ScrollView } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * Profile tab — hub per profilo utente + entry point per impostazioni.
 *
 * Layout:
 *  1. Profilo (avatar + nome + email)
 *  2. CTA impostazioni → /settings
 *  3. Sign out
 */
export default function ProfileScreen() {
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

  return (
    <TabScreen title={t("tabs.profile")} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SettingsCard title={t("profile.profileSection")}>
          <SettingsRow
            iconName="envelope"
            label={user?.email ?? "—"}
            subtitle={t("editInfo.email")}
          />
          <SettingsRow
            iconName="person.crop.circle"
            label={user?.name || t("common.tapToSet")}
            subtitle={t("profile.editNameSubtitle")}
            onPress={() => router.push("/settings/account/name")}
          />
        </SettingsCard>

        <SettingsCard>
          <SettingsRow
            iconName="gearshape"
            label={t("profile.settings")}
            subtitle={t("profile.settingsSubtitle")}
            onPress={() => router.push("/settings")}
          />
        </SettingsCard>

        <SettingsCard>
          <SettingsRow
            iconName="arrow.right.square"
            iconColor={theme.colors.error}
            label={t("auth.signOut")}
            labelStyle={{ color: theme.colors.error }}
            onPress={() => void handleSignOut()}
          />
        </SettingsCard>
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
  avatarRow: {
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
}));
