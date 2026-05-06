import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SettingsCard, SettingsRow } from "@/components/ui/SettingsRow";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth.store";
import { haptics } from "@/utils/haptics";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export default function EditInfoScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useUnistyles();
  const user = useAuthStore((s) => s.user);
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    haptics.medium();
    await signOut();
  };

  return (
    <Screen>
      <ScreenHeader title={t("editInfo.title")} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SettingsCard title={t("editInfo.yourInfo")}>
          <SettingsRow
            iconName="envelope"
            label={user?.email ?? "—"}
            subtitle={t("editInfo.email")}
          />
          <SettingsRow
            iconName="person"
            label={user?.name || t("common.tapToSet")}
            subtitle={t("editInfo.name")}
            onPress={() => router.push("/settings/account/name")}
          />
        </SettingsCard>

        {/* Sign out / danger zone */}
        <SettingsCard>
          <SettingsRow
            iconName="arrow.right.circle"
            iconColor={theme.colors.error}
            label={t("auth.signOut")}
            labelStyle={{ color: theme.colors.error }}
            onPress={() => void handleSignOut()}
          />
          <SettingsRow
            iconName="trash"
            iconColor={theme.colors.error}
            label={t("deleteAccount.title")}
            labelStyle={{ color: theme.colors.error }}
            onPress={() => router.push("/settings/account/delete-account")}
          />
        </SettingsCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scrollContent: {
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing["2xl"],
    paddingBottom: SCREEN_BOTTOM_PADDING,
    gap: theme.spacing.sm,
  },
  signOutBtn: {
    marginTop: theme.spacing["2xl"],
    backgroundColor: theme.colors.errorSoft,
    borderWidth: theme.hairline,
    borderColor: theme.colors.errorBorder,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
  },
  signOutText: { ...theme.typography.subhead, color: theme.colors.error },
}));
