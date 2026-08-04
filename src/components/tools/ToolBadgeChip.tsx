import { getToolBadgeMeta } from "@/components/tools/tool-badge-meta";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface ToolBadgeChipProps {
  /** The server-sent badge value (unknown values render nothing). */
  badge: string | null | undefined;
}

/**
 * ToolBadgeChip — the editorial highlight pill on a tool (e.g. "premium ·
 * free"). Purely presentational: it says nothing about access, which is
 * `locked`'s job (PremiumGate / PremiumPaywall). Renders null for a null or
 * unknown badge, so it is safe to drop anywhere unconditionally.
 */
export function ToolBadgeChip({ badge }: ToolBadgeChipProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const meta = getToolBadgeMeta(badge);
  if (!meta) return null;

  const tone = {
    accent: {
      fg: theme.colors.accent,
      bg: theme.colors.accentSoft,
      border: theme.colors.accentBorder,
    },
    primary: {
      fg: theme.colors.primary,
      bg: theme.colors.primarySoft,
      border: theme.colors.primaryBorder,
    },
    neutral: {
      fg: theme.colors.textSecondary,
      bg: theme.colors.surface2,
      border: theme.colors.border,
    },
  }[meta.tone];

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: tone.bg, borderColor: tone.border },
      ]}
    >
      <MaterialCommunityIcons
        name={
          meta.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]
        }
        size={10}
        color={tone.fg}
      />
      <Text style={[styles.label, { color: tone.fg }]} numberOfLines={1}>
        {t(meta.labelKey as never)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: theme.hairline,
    borderRadius: theme.radius.pill,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.sm,
  },
  label: {
    ...theme.monoTypography.captionMono,
  },
}));
