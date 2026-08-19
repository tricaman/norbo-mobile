import { NorboPressable } from "@/components/CustomPressable";
import { ToolBadgeChip, useToolBadgeTone } from "@/components/tools/ToolBadgeChip";
import type { ToolBadgeTone } from "@/components/tools/ToolBadgeChip";
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
 * themed icon fallback when none is set yet. On a highlighted row the fallback
 * tile is filled with the badge tone instead of the usual primary tint.
 */
export function ToolCover({
  tool,
  tone,
}: {
  tool: ToolMetadata;
  tone?: ToolBadgeTone | null;
}): React.JSX.Element {
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
  const solid = tone?.highlight ? tone : null;
  return (
    <View
      style={[
        styles.cover,
        styles.coverFallback,
        solid ? { backgroundColor: solid.tile } : null,
      ]}
    >
      <MaterialCommunityIcons
        name={
          tool.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]
        }
        size={22}
        color={solid ? solid.ink : theme.colors.primary}
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
 * ToolRow — a single tool entry: cover, localized title/description with its
 * optional editorial badge, an optional `right` slot, the premium chip, and a
 * chevron. Used both inside the Services "for everyone" card and on the
 * per-category tools screen. Meant to sit inside a `Card` (the surface/divider
 * chrome is the parent's job).
 *
 * Layout rule for badged tools: the badge sits ABOVE the title, never beside
 * it, and the `right` slot is dropped. Both used to compete with the title for
 * the same line, which left titles like "luoghi e servizi per animali" rendered
 * as a bare "…". A badge whose `BADGE_META.highlight` is on additionally tints
 * the row and fills the cover tile, so the flagship tool reads at a glance.
 */
export function ToolRow({ tool, onPress, right }: ToolRowProps): React.JSX.Element {
  const { theme } = useUnistyles();
  const tone = useToolBadgeTone(tool.badge);
  const highlighted = tone?.highlight ?? false;

  return (
    <NorboPressable
      style={[styles.row, highlighted && tone ? { backgroundColor: tone.bg } : null]}
      scale="row"
      haptic="light"
      onPress={onPress}
    >
      <ToolCover tool={tool} tone={tone} />
      <View style={[styles.rowContent, tone ? styles.rowContentBadged : null]}>
        {/* Editorial highlight (e.g. "premium · free"); renders nothing when
            the tool has no badge. Bare icon + label on a highlighted row —
            the row already carries the tint the pill would repeat. */}
        <ToolBadgeChip
          badge={tool.badge}
          variant={highlighted ? "kicker" : "pill"}
        />
        <Text
          style={[styles.title, highlighted ? styles.titleHighlighted : null]}
          numberOfLines={1}
        >
          {tool.title}
        </Text>
        <Text style={styles.caption} numberOfLines={2}>
          {tool.description}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {/* The badge is the badged row's right-hand meta: keeping "all pets"
            too would take the width back off the title. */}
        {tone ? null : right}
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
  /** Badge, title and description need a touch more air than title/caption. */
  rowContentBadged: { gap: theme.spacing.xs },
  title: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
    textTransform: "lowercase",
  },
  titleHighlighted: { fontWeight: "700" },
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
