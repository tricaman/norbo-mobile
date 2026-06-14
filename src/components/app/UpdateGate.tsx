import { IconSymbol } from "@/components/ui/IconSymbol";
import { PetWizardButton } from "@/components/pets/wizard/PetWizardButton";
import { useAppVersion } from "@/hooks/useAppVersion";
import { useAppUpdateStore } from "@/stores/app-update.store";
import React from "react";
import { useTranslation } from "react-i18next";
import { Linking, Modal, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * UpdateGate — backend-driven "new version available" prompt.
 *
 * Wraps the app. It always renders its children and layers, on top:
 *   - a dismissible bottom sheet when a newer store version exists
 *     (remembered per `latest` version so it doesn't nag every launch);
 *   - a non-dismissible full-screen screen when the installed version is
 *     below the minimum supported one (forced update).
 *
 * Fail-open: when the version check can't run, `level` is "ok" and nothing
 * shows. See `useAppVersion`.
 */
export function UpdateGate({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const { level, latest, storeUrl } = useAppVersion();
  const dismissedVersion = useAppUpdateStore((s) => s.dismissedVersion);
  const dismiss = useAppUpdateStore((s) => s.dismiss);

  const openStore = () => {
    if (storeUrl) void Linking.openURL(storeUrl);
  };
  const dismissSoft = () => {
    if (latest) dismiss(latest);
  };

  const showSoft =
    level === "available" && latest != null && dismissedVersion !== latest;
  const showForced = level === "required";

  return (
    <>
      {children}

      {/* Soft, dismissible — bottom sheet */}
      <Modal
        visible={showSoft}
        transparent
        animationType="slide"
        onRequestClose={dismissSoft}
      >
        {/* gesture-handler pressables need their own root inside a Modal */}
        <GestureHandlerRootView style={styles.backdrop}>
          <Pressable style={styles.backdropTap} onPress={dismissSoft} />
          <View style={styles.sheet}>
            <Icon />
            <Text style={styles.title}>{t("appUpdate.availableTitle")}</Text>
            <Text style={styles.body}>{t("appUpdate.availableBody")}</Text>
            <View style={styles.actions}>
              <PetWizardButton
                label={t("appUpdate.updateNow")}
                onPress={openStore}
              />
              <PetWizardButton
                label={t("appUpdate.later")}
                onPress={dismissSoft}
                variant="ghost"
              />
            </View>
          </View>
        </GestureHandlerRootView>
      </Modal>

      {/* Forced, blocking — full screen, no dismiss */}
      <Modal visible={showForced} animationType="fade" onRequestClose={() => {}}>
        <GestureHandlerRootView
          style={[styles.forced, { backgroundColor: theme.colors.background }]}
        >
          <Icon />
          <Text style={styles.title}>{t("appUpdate.requiredTitle")}</Text>
          <Text style={styles.body}>{t("appUpdate.requiredBody")}</Text>
          <View style={styles.forcedAction}>
            <PetWizardButton
              label={t("appUpdate.updateNow")}
              onPress={openStore}
            />
          </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}

function Icon(): React.JSX.Element {
  const { theme } = useUnistyles();
  return (
    <View style={styles.iconCircle}>
      <IconSymbol
        name="arrow.triangle.2.circlepath"
        size={30}
        tintColor={theme.colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  /* Soft sheet */
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing["2xl"],
    paddingBottom: theme.spacing["4xl"],
    alignItems: "center",
    gap: theme.spacing.md,
  },
  actions: {
    alignSelf: "stretch",
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },

  /* Forced screen */
  forced: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing["4xl"],
    gap: theme.spacing.md,
  },
  forcedAction: {
    alignSelf: "stretch",
    marginTop: theme.spacing.xl,
  },

  /* Shared */
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.title2,
    color: theme.colors.textPrimary,
    textAlign: "center",
    textTransform: "lowercase",
  },
  body: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
}));
