import { AvatarUploader } from "@/components/media/AvatarUploader";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SettingsCard, SettingsRow } from "@/components/ui/SettingsRow";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { usersApi } from "@/services/users.api";
import { useAuthStore } from "@/stores/auth.store";
import type { MediaAsset } from "@/types/media.types";
import { toast } from "@/utils/toast";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/**
 * Account detail — edit name only.
 * This screen is now simplified; other settings moved to /settings.
 */
export default function AccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
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

  return (
    <Screen>
      <ScreenHeader title={t("accountHub.title")} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
