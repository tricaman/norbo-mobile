import { NorboPressable } from "@/components/CustomPressable";
import { getRarityMeta, useRarityColors } from "@/components/badges/rarity-meta";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { BadgeSummary } from "@/types/badge.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface BadgeTileProps {
  badge: BadgeSummary;
  width: number;
  onPress: () => void;
}

/**
 * One cell of the badge grid.
 *
 * The locked state deliberately keeps the TITLE readable and only swaps the
 * glyph for a padlock: a badge you cannot read the name of is not a goal, it is
 * just a grey square. The "how do I get it" copy is one tap away in the sheet.
 */
export function BadgeTile({ badge, width, onPress }: BadgeTileProps) {
  const { theme } = useUnistyles();
  const unlocked = badge.currentLevel > 0;
  const colors = useRarityColors(badge.currentRarity);
  const meta = getRarityMeta(badge.currentRarity);
  const isNew = badge.currentLevel > badge.seenLevel;

  const glyph = unlocked ? badge.icon : "lock-outline";

  return (
    <NorboPressable
      scale="card"
      haptic="light"
      onPress={onPress}
      premium={unlocked && meta?.glow === true}
      haloColor={colors.fg}
      style={[styles.tile, { width }]}
    >
      <View
        style={[
          styles.medallion,
          { backgroundColor: colors.bg, borderColor: colors.border },
        ]}
      >
        <MaterialCommunityIcons
          name={
            glyph as React.ComponentProps<typeof MaterialCommunityIcons>["name"]
          }
          size={28}
          color={unlocked ? colors.fg : theme.colors.textTertiary}
        />
        {isNew ? (
          <View
            style={[styles.newDot, { backgroundColor: theme.colors.accent }]}
          />
        ) : null}
      </View>

      <Text
        style={[
          styles.title,
          { color: unlocked ? theme.colors.textPrimary : theme.colors.textSecondary },
        ]}
        numberOfLines={2}
      >
        {badge.title}
      </Text>

      <Text style={[styles.tier, { color: colors.fg }]} numberOfLines={1}>
        {badge.currentTierTitle ?? ""}
      </Text>

      <ProgressBar value={badge.progress} color={colors.fg} height={3} />
    </NorboPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  tile: {
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  medallion: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.pill,
    borderWidth: theme.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  newDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: theme.radius.pill,
  },
  title: {
    ...theme.typography.subhead,
    textAlign: "center",
  },
  tier: {
    ...theme.typography.caption,
    textAlign: "center",
    minHeight: 14,
  },
}));
