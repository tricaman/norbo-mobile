import { useRarityColors } from "@/components/badges/rarity-meta";
import { TierLadder } from "@/components/badges/TierLadder";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useBadge } from "@/hooks/useBadges";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface BadgeDetailSheetProps {
  badgeId: string | null;
  onClose: () => void;
}

/**
 * Bottom-anchored badge detail — the PlaceDetailSheet pattern (transparent
 * Modal, tappable backdrop, rounded top). Not a route: the badge screen owns
 * the selection, so the grid stays a single screen and the deep link only has
 * to set a query param.
 */
export function BadgeDetailSheet({ badgeId, onClose }: BadgeDetailSheetProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const { data: badge, isPending } = useBadge(badgeId);
  const colors = useRarityColors(badge?.currentRarity);

  const unlocked = (badge?.currentLevel ?? 0) > 0;
  const atTop = badge != null && badge.nextThreshold === null;
  // A single-tier badge is a yes/no achievement: a "0 / 1" counter and a bar
  // that only ever reads 0% or 100% add nothing the tier row does not say.
  const oneShot = badge != null && badge.maxLevel === 1;
  const unitLabel = badge
    ? (t(`badges.unit.${badge.unit}` as never, {
        count: badge.nextThreshold ?? badge.currentValue,
      }) as string)
    : "";

  return (
    <Modal
      visible={badgeId !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={styles.sheet}>
          {isPending || !badge ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <View
                  style={[
                    styles.medallion,
                    { backgroundColor: colors.bg, borderColor: colors.border },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      (unlocked
                        ? badge.icon
                        : "lock-outline") as React.ComponentProps<
                        typeof MaterialCommunityIcons
                      >["name"]
                    }
                    size={34}
                    color={unlocked ? colors.fg : theme.colors.textTertiary}
                  />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.title} numberOfLines={2}>
                    {badge.title}
                  </Text>
                  <Text style={styles.subtitle}>
                    {!unlocked
                      ? t(oneShot ? "badges.notYet" : "badges.locked")
                      : oneShot
                        ? (badge.currentTierTitle ?? "")
                        : `${t("badges.currentTier")}: ${badge.currentTierTitle ?? ""}`}
                  </Text>
                </View>
              </View>

              <Text style={styles.description}>{badge.description}</Text>

              {oneShot ? null : (
                <View style={styles.progressBlock}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>
                      {atTop ? t("badges.maxTier") : t("badges.nextTier")}
                    </Text>
                    {!atTop ? (
                      <Text
                        style={[styles.progressValue, { color: colors.fg }]}
                      >
                        {t("badges.progress", {
                          current: String(badge.currentValue),
                          target: String(badge.nextThreshold ?? 0),
                          unit: unitLabel,
                        })}
                      </Text>
                    ) : null}
                  </View>
                  <ProgressBar value={badge.progress} color={colors.fg} />
                </View>
              )}

              <View style={styles.hintBlock}>
                <Text style={styles.hintLabel}>{t("badges.howToUnlock")}</Text>
                <Text style={styles.hint}>{badge.hint}</Text>
              </View>

              <TierLadder tiers={badge.tiers} unit={badge.unit} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  backdropTap: { flex: 1 },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: "85%",
  },
  loading: {
    paddingVertical: theme.spacing["3xl"],
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing["3xl"],
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  medallion: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.pill,
    borderWidth: theme.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...theme.typography.title2,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  progressBlock: {
    gap: theme.spacing.sm,
  },
  progressLabels: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textTransform: "uppercase",
  },
  progressValue: {
    ...theme.monoTypography.captionMono,
  },
  hintBlock: {
    gap: 4,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  hintLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textTransform: "uppercase",
  },
  hint: {
    ...theme.typography.footnote,
    color: theme.colors.textPrimary,
  },
}));
