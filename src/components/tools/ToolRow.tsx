import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import type { ToolMetadata } from "@/types/tool.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const COVER_SIZE = 40;

/**
 * ToolCover — the leading square for a tool row: the server cover image, or a
 * themed icon fallback when none is set yet.
 */
export function ToolCover({ tool }: { tool: ToolMetadata }): React.JSX.Element {
  const { theme } = useUnistyles();
  if (tool.coverImageUrl) {
    return (
      <Image
        source={{ uri: tool.coverImageUrl }}
        style={styles.cover}
        contentFit="cover"
        transition={150}
      />
    );
  }
  return (
    <View style={[styles.cover, styles.coverFallback]}>
      <MaterialCommunityIcons
        name={
          tool.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]
        }
        size={22}
        color={theme.colors.primary}
      />
    </View>
  );
}

interface ToolRowProps {
  tool: ToolMetadata;
  onPress: () => void;
  /** Extra content rendered before the chevron (e.g. pet badges, "all pets"). */
  right?: React.ReactNode;
}

/**
 * ToolRow — a single tool entry: cover, localized title/description, an
 * optional `right` slot, the premium chip, and a chevron. Used both inside the
 * Services "for everyone" card and on the per-category tools screen. Meant to
 * sit inside a `Card` (the surface/divider chrome is the parent's job).
 */
export function ToolRow({ tool, onPress, right }: ToolRowProps): React.JSX.Element {
  const { theme } = useUnistyles();
  return (
    <NorboPressable
      style={styles.row}
      scale="row"
      haptic="light"
      onPress={onPress}
    >
      <ToolCover tool={tool} />
      <View style={styles.rowContent}>
        <Text style={styles.title} numberOfLines={1}>
          {tool.title}
        </Text>
        <Text style={styles.caption} numberOfLines={2}>
          {tool.description}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {right}
        {tool.isPremium ? (
          <View style={styles.premiumChip}>
            <Text style={styles.premiumLabel}>premium</Text>
          </View>
        ) : null}
        <IconSymbol
          name="chevron.right"
          size={13}
          tintColor={theme.colors.textTertiary}
        />
      </View>
    </NorboPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  cover: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: theme.radius.sm,
  },
  coverFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primarySoft,
  },
  rowContent: { flex: 1, gap: 2 },
  title: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
    textTransform: "lowercase",
  },
  caption: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  premiumChip: {
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  premiumLabel: {
    ...theme.monoTypography.captionMono,
    color: theme.colors.textSecondary,
  },
}));
