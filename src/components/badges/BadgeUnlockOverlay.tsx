import { NorboPressable } from "@/components/CustomPressable";
import { getRarityMeta, useRarityColors } from "@/components/badges/rarity-meta";
import type { BadgeSummary } from "@/types/badge.types";
import { haptics } from "@/utils/haptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface BadgeUnlockOverlayProps {
  badge: BadgeSummary;
  /** The tier being celebrated — not necessarily `badge.currentLevel`: a user
   *  who crossed two tiers at once sees each one in turn. */
  tierTitle: string;
  rarity: string | null;
  onDismiss: () => void;
}

/**
 * The unlock celebration.
 *
 * Deliberately built from what the app already has — reanimated entering
 * animations, the theme's rarity colours and `haptics.success()` — rather than
 * pulling in a confetti library for one screen. The staggered entrance is the
 * ConfirmStep pattern from the pet wizard.
 */
export function BadgeUnlockOverlay({
  badge,
  tierTitle,
  rarity,
  onDismiss,
}: BadgeUnlockOverlayProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const colors = useRarityColors(rarity);
  const meta = getRarityMeta(rarity);

  useEffect(() => {
    haptics.success();
  }, []);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.card}>
          <Animated.View
            entering={ZoomIn.springify().damping(14).stiffness(180)}
            style={[
              styles.medallion,
              { backgroundColor: colors.bg, borderColor: colors.border },
            ]}
          >
            <MaterialCommunityIcons
              name={
                badge.icon as React.ComponentProps<
                  typeof MaterialCommunityIcons
                >["name"]
              }
              size={52}
              color={colors.fg}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(120)}
            style={styles.text}
          >
            <Text style={[styles.kicker, { color: colors.fg }]}>
              {t("badges.celebration.title")}
            </Text>
            <Text style={styles.tier}>{tierTitle}</Text>
            <Text style={styles.badgeName}>{badge.title}</Text>
            {rarity ? (
              <Text style={[styles.rarity, { color: colors.fg }]}>
                {t(`badges.rarity.${rarity}` as never)}
              </Text>
            ) : null}
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(240)}
            style={styles.ctaWrap}
          >
            <NorboPressable
              scale="cta"
              haptic="light"
              onPress={onDismiss}
              premium={meta?.glow === true}
              haloColor={colors.fg}
              style={[styles.cta, { backgroundColor: theme.colors.primary }]}
            >
              <Text
                style={[
                  styles.ctaLabel,
                  { color: theme.colors.textOnPrimary },
                ]}
              >
                {t("badges.celebration.cta")}
              </Text>
            </NorboPressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: theme.spacing["3xl"],
  },
  card: {
    width: "100%",
    alignItems: "center",
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    paddingVertical: theme.spacing["3xl"],
    paddingHorizontal: theme.spacing.lg,
  },
  medallion: {
    width: 108,
    height: 108,
    borderRadius: theme.radius.pill,
    borderWidth: theme.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    alignItems: "center",
    gap: 4,
  },
  kicker: {
    ...theme.monoTypography.captionMono,
    textTransform: "uppercase",
  },
  tier: {
    ...theme.typography.title1,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  badgeName: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  rarity: {
    ...theme.monoTypography.captionMono,
    textTransform: "uppercase",
    marginTop: 2,
  },
  ctaWrap: {
    width: "100%",
  },
  cta: {
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  ctaLabel: {
    ...theme.typography.subhead,
    fontWeight: "700",
  },
}));
