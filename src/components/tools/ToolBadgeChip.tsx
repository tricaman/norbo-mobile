import { BADGE_META, getToolBadgeMeta } from "@/components/tools/tool-badge-meta";
import type { ToolBadge } from "@/types/tool.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/** Everything a badge needs to paint itself AND its row, resolved once. */
export interface ToolBadgeTone {
  meta: (typeof BADGE_META)[ToolBadge];
  /** Label + icon colour. */
  fg: string;
  /** Pill fill — and the row wash on a highlighted row. */
  bg: string;
  border: string;
  /** Solid cover tile and the icon ink on it, for a highlighted row. */
  tile: string;
  ink: string;
  /** `BADGE_META.highlight` — does this badge promote its whole row? */
  highlight: boolean;
}

/**
 * useToolBadgeTone — the single resolver from a server badge value to theme
 * colours. Both the chip and `ToolRow` read it, so a badge and the row it sits
 * on can never drift apart. Returns null for a null or unknown badge.
 */
export function useToolBadgeTone(
  badge: string | null | undefined,
): ToolBadgeTone | null {
  const { theme } = useUnistyles();
  const meta = getToolBadgeMeta(badge);
  if (!meta) return null;

  const tone = {
    accent: {
      fg: theme.colors.accent,
      bg: theme.colors.accentSoft,
      border: theme.colors.accentBorder,
      tile: theme.colors.accent,
      ink: theme.colors.accentInk,
    },
    primary: {
      fg: theme.colors.primary,
      bg: theme.colors.primarySoft,
      border: theme.colors.primaryBorder,
      tile: theme.colors.primary,
      // Same ink as the solid category tiles in CategoryToolsCard.
      ink: "rgba(255,255,255,0.92)",
    },
    neutral: {
      fg: theme.colors.textSecondary,
      bg: theme.colors.surface2,
      border: theme.colors.border,
      tile: theme.colors.surface3,
      ink: theme.colors.textSecondary,
    },
  }[meta.tone];

  return { meta, ...tone, highlight: meta.highlight };
}

interface ToolBadgeChipProps {
  /** The server-sent badge value (unknown values render nothing). */
  badge: string | null | undefined;
  /**
   * "pill" (default) — the bordered, tinted chip.
   * "kicker" — icon + label only, for a row that already carries the tint and
   * would otherwise stack the same colour on itself.
   */
  variant?: "pill" | "kicker";
}

/**
 * ToolBadgeChip — the editorial highlight on a tool (e.g. "premium · free").
 * Purely presentational: it says nothing about access, which is `locked`'s job
 * (PremiumGate / PremiumPaywall). Renders null for a null or unknown badge, so
 * it is safe to drop anywhere unconditionally.
 */
export function ToolBadgeChip({
  badge,
  variant = "pill",
}: ToolBadgeChipProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const tone = useToolBadgeTone(badge);
  if (!tone) return null;

  const isKicker = variant === "kicker";

  return (
    <View
      style={
        isKicker
          ? styles.kicker
          : [styles.chip, { backgroundColor: tone.bg, borderColor: tone.border }]
      }
    >
      <MaterialCommunityIcons
        name={
          tone.meta.icon as React.ComponentProps<
            typeof MaterialCommunityIcons
          >["name"]
        }
        size={10}
        color={tone.fg}
      />
      <Text style={[styles.label, { color: tone.fg }]} numberOfLines={1}>
        {t(tone.meta.labelKey as never)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  chip: {
    // Never stretch: the chip now also sits in column layouts (above a title).
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: theme.hairline,
    borderRadius: theme.radius.pill,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.sm,
  },
  kicker: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.monoTypography.captionMono,
  },
}));
