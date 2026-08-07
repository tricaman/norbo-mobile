import { NorboPressable } from "@/components/CustomPressable";
import { PetWizardButton } from "@/components/pets/wizard/PetWizardButton";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAppVersion } from "@/hooks/useAppVersion";
import { completeFlexibleUpdate } from "@/services/in-app-updates";
import {
  useAppUpdateStore,
  type DownloadPhase,
} from "@/stores/app-update.store";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * UpdateGate — orchestrates the in-app update. Mounted once at the root
 * (see `app/_layout.tsx`); always renders its children and layers on top:
 *
 *   - OPTIONAL: nothing pops up. It publishes `available` to
 *     `useAppUpdateStore`, which makes `UpdateHeaderButton` appear in the tab
 *     headers; tapping it opens the compact card below. On Android the card
 *     drives the Play FLEXIBLE flow (progress bar → "restart now") so the
 *     update installs without leaving the app; on iOS "update now" opens the
 *     App Store, the only thing Apple allows.
 *   - FORCED: a non-dismissible full-screen gate (installed version below
 *     `minSupported`). On Android its button hands over to Play's own
 *     IMMEDIATE flow, which downloads, installs and restarts by itself.
 *
 * Fail-open: when the checks can't run, `level` is "ok" and nothing shows.
 * See `useAppVersion`.
 */
export function UpdateGate({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const { level, startUpdate } = useAppVersion();

  const open = useAppUpdateStore((s) => s.open);
  const setAvailable = useAppUpdateStore((s) => s.setAvailable);
  const setOpen = useAppUpdateStore((s) => s.setOpen);
  const phase = useAppUpdateStore((s) => s.phase);
  const progress = useAppUpdateStore((s) => s.progress);
  const resetDownload = useAppUpdateStore((s) => s.resetDownload);

  const available = level === "available";

  // Publish availability for the header icon, and make sure the card can't
  // linger once the update is gone (installed, or the check flipped back).
  useEffect(() => {
    setAvailable(available);
    if (!available) setOpen(false);
  }, [available, setAvailable, setOpen]);

  // Mid-download the card can't be dismissed: Play's consent dialog is the
  // only way out, and hiding the progress would look like a hang.
  const dismissable =
    phase === "idle" || phase === "downloaded" || phase === "failed";

  const closeCard = () => {
    setOpen(false);
    // A finished download survives the card being closed, so reopening it
    // still offers "restart now"; a failed one is cleared so the next open
    // starts from scratch.
    if (phase === "failed") resetDownload();
  };

  const action = cardAction(phase);
  const pct = Math.round(Math.min(Math.max(progress, 0), 1) * 100);

  return (
    <>
      {children}

      {/* Optional — compact card, opened from the header icon */}
      <Modal
        visible={available && open}
        transparent
        animationType="fade"
        onRequestClose={dismissable ? closeCard : undefined}
      >
        {/* gesture-handler pressables need their own root inside a Modal */}
        <GestureHandlerRootView style={styles.cardBackdrop}>
          <Pressable
            style={styles.backdropTap}
            onPress={dismissable ? closeCard : undefined}
          />
          <View style={[styles.card, { marginTop: insets.top + 8 }]}>
            <View style={styles.cardRow}>
              <PhaseIcon phase={phase} />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{t(phaseTitle(phase))}</Text>
                <Text style={styles.cardBody}>{t(phaseBody(phase))}</Text>
              </View>
              {dismissable && (
                <NorboPressable
                  scale="row"
                  haptic="light"
                  onPress={closeCard}
                  style={styles.close}
                >
                  <View
                    accessibilityRole="button"
                    accessibilityLabel={t("appUpdate.later")}
                  >
                    <IconSymbol
                      name="xmark"
                      size={16}
                      tintColor={theme.colors.textSecondary}
                    />
                  </View>
                </NorboPressable>
              )}
            </View>

            {phase === "downloading" && (
              <View style={styles.progressBlock}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.progressLabel}>{`${pct}%`}</Text>
              </View>
            )}

            {action && (
              <View style={styles.cardAction}>
                <PetWizardButton
                  label={t(action.label)}
                  onPress={
                    action.kind === "restart" ? completeFlexibleUpdate : startUpdate
                  }
                />
              </View>
            )}
          </View>
        </GestureHandlerRootView>
      </Modal>

      {/* Forced, blocking — full screen, no dismiss */}
      <Modal
        visible={level === "required"}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <GestureHandlerRootView
          style={[styles.forced, { backgroundColor: theme.colors.background }]}
        >
          <View style={styles.iconCircle}>
            <IconSymbol
              name="arrow.down.circle"
              size={30}
              tintColor={theme.colors.primary}
            />
          </View>
          <Text style={styles.title}>{t("appUpdate.requiredTitle")}</Text>
          <Text style={styles.body}>{t("appUpdate.requiredBody")}</Text>
          <View style={styles.forcedAction}>
            <PetWizardButton
              label={t("appUpdate.updateNow")}
              onPress={startUpdate}
            />
          </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}

/** Copy keys the card can render, kept literal so `t()` stays type-checked. */
type CopyKey =
  | "appUpdate.availableTitle"
  | "appUpdate.availableBody"
  | "appUpdate.downloadingTitle"
  | "appUpdate.downloadingBody"
  | "appUpdate.readyTitle"
  | "appUpdate.readyBody"
  | "appUpdate.failedTitle"
  | "appUpdate.failedBody";

type ActionKey =
  | "appUpdate.updateNow"
  | "appUpdate.restartNow"
  | "appUpdate.retry";

/** Which button the card shows, if any — none while work is in flight. */
function cardAction(
  phase: DownloadPhase,
): { label: ActionKey; kind: "start" | "restart" } | null {
  switch (phase) {
    case "idle":
      return { label: "appUpdate.updateNow", kind: "start" };
    case "downloaded":
      return { label: "appUpdate.restartNow", kind: "restart" };
    case "failed":
      return { label: "appUpdate.retry", kind: "start" };
    default:
      return null;
  }
}

function phaseTitle(phase: DownloadPhase): CopyKey {
  switch (phase) {
    case "downloaded":
      return "appUpdate.readyTitle";
    case "failed":
      return "appUpdate.failedTitle";
    case "downloading":
    case "installing":
      return "appUpdate.downloadingTitle";
    default:
      return "appUpdate.availableTitle";
  }
}

function phaseBody(phase: DownloadPhase): CopyKey {
  switch (phase) {
    case "downloaded":
      return "appUpdate.readyBody";
    case "failed":
      return "appUpdate.failedBody";
    case "downloading":
    case "installing":
      return "appUpdate.downloadingBody";
    default:
      return "appUpdate.availableBody";
  }
}

function PhaseIcon({ phase }: { phase: DownloadPhase }): React.JSX.Element {
  const { theme } = useUnistyles();
  const isError = phase === "failed";
  const name =
    phase === "downloaded"
      ? "checkmark.circle.fill"
      : isError
        ? "exclamationmark.triangle"
        : "arrow.down.circle";

  return (
    <View
      style={[
        styles.cardIcon,
        {
          backgroundColor: isError
            ? theme.colors.errorSoft
            : theme.colors.primarySoft,
        },
      ]}
    >
      <IconSymbol
        name={name}
        size={22}
        tintColor={isError ? theme.colors.error : theme.colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  /* Optional card */
  cardBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  backdropTap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    marginHorizontal: theme.spacing["3xl"],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
  },
  cardBody: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  close: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface2,
  },
  cardAction: {
    alignSelf: "stretch",
  },
  progressBlock: {
    gap: theme.spacing.xs,
  },
  progressTrack: {
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
  },
  progressLabel: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
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
