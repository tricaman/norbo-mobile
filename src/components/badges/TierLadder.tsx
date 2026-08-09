import { useRarityColors } from "@/components/badges/rarity-meta";
import type { BadgeTierView, MetricUnit } from "@/types/badge.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface TierLadderProps {
  tiers: readonly BadgeTierView[];
  unit: MetricUnit;
}

function TierRow({ tier, unit }: { tier: BadgeTierView; unit: MetricUnit }) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const colors = useRarityColors(tier.rarity);
  // `as never` is the repo's escape hatch for a dynamic i18n key; the extra
  // `as string` keeps the value usable as an interpolation param.
  const unitLabel = t(`badges.unit.${unit}` as never) as string;

  return (
    <View style={[styles.row, !tier.unlocked && styles.rowLocked]}>
      <View
        style={[
          styles.dot,
          { backgroundColor: colors.bg, borderColor: colors.border },
        ]}
      >
        {tier.unlocked ? (
          <MaterialCommunityIcons name="check" size={13} color={colors.fg} />
        ) : (
          <Text style={[styles.dotLevel, { color: theme.colors.textTertiary }]}>
            {tier.level}
          </Text>
        )}
      </View>

      <View style={styles.rowText}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {tier.title}
          </Text>
          <Text style={[styles.rarity, { color: colors.fg }]}>
            {t(`badges.rarity.${tier.rarity}` as never)}
          </Text>
        </View>
        <Text style={styles.rowDescription}>{tier.description}</Text>
        <Text style={styles.requirement}>
          {t("badges.requirement", {
            value: String(tier.threshold),
            unit: unitLabel,
          })}
        </Text>
      </View>
    </View>
  );
}

/**
 * The full ladder in the detail sheet.
 *
 * Tiers the user has NOT reached stay visible, only dimmed — answering "what do
 * I have to do" is the entire reason this sheet exists, so nothing is hidden
 * behind a spoiler.
 */
export function TierLadder({ tiers, unit }: TierLadderProps) {
  return (
    <View style={styles.ladder}>
      {tiers.map((tier) => (
        <TierRow key={tier.level} tier={tier} unit={unit} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  ladder: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: theme.spacing.md,
    alignItems: "flex-start",
  },
  rowLocked: {
    opacity: 0.55,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.pill,
    borderWidth: theme.hairline,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  dotLevel: {
    ...theme.monoTypography.captionMono,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  rowTitle: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
    flexShrink: 1,
  },
  rarity: {
    ...theme.monoTypography.captionMono,
    textTransform: "uppercase",
  },
  rowDescription: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  requirement: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
}));
