import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { SettingsCard } from "@/components/ui/SettingsRow";
import { TabScreen } from "@/components/ui/TabScreen";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useAvailableTools } from "@/hooks/useTools";
import { petsApi } from "@/services/pets.api";
import type { Pet } from "@/types/pet.types";
import type { ToolMetadata } from "@/types/tool.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const MAX_PET_BADGES = 3;
const COVER_SIZE = 40;

/**
 * ServicesTab — entry point of the Services Tool System. Lists the tools
 * available to the user (filtered to the categories of pets they own) using
 * the same grouped card chrome as the rest of the app (see `SettingsCard`),
 * with server-localized title/description and a cover image (themed fallback).
 */
export default function ServicesTab(): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const query = useAvailableTools();
  // Pets power the per-tool badges. Same query key as the rest of the app, so
  // it's typically already warm from the Home tab (no extra fetch on entry).
  const petsQuery = useQuery({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
  });
  const pets = petsQuery.data ?? [];

  return (
    <TabScreen title={t("tabs.services")}>
      <QueryBoundary query={query} EmptyComponent={ToolsEmpty}>
        {(tools) => {
          // Only keep tools that apply to at least one pet the user owns —
          // a tool for a category you don't have is noise.
          const visibleTools = tools.filter((tool) =>
            pets.some((pet) => tool.categories.includes(pet.category)),
          );
          return (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={query.isRefetching || petsQuery.isRefetching}
                  onRefresh={() => {
                    void query.refetch();
                    void petsQuery.refetch();
                  }}
                  tintColor={theme.colors.primary}
                  colors={[theme.colors.primary]}
                />
              }
            >
              {visibleTools.length > 0 ? (
                visibleTools.map((tool) => (
                  <SettingsCard key={tool.id}>
                    <ToolRow tool={tool} pets={pets} />
                  </SettingsCard>
                ))
              ) : petsQuery.isPending ? null : (
                <ToolsEmpty />
              )}
            </ScrollView>
          );
        }}
      </QueryBoundary>
    </TabScreen>
  );
}

function ToolCover({ tool }: { tool: ToolMetadata }): React.JSX.Element {
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
  // Themed fallback when no cover image is set yet.
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

function ToolRow({
  tool,
  pets,
}: {
  tool: ToolMetadata;
  pets: Pet[];
}): React.JSX.Element {
  const { theme } = useUnistyles();
  const router = useRouter();
  // Which of the user's pets this tool applies to (matched by category).
  const matchingPets = pets.filter((pet) =>
    tool.categories.includes(pet.category),
  );
  const visiblePets = matchingPets.slice(0, MAX_PET_BADGES);
  const overflow = matchingPets.length - visiblePets.length;

  return (
    <NorboPressable
      style={styles.row}
      scale="row"
      haptic="light"
      onPress={() => router.push(`/tool/${tool.id}` as never)}
    >
      <ToolCover tool={tool} />
      <View style={styles.rowContent}>
        <Text style={styles.title} numberOfLines={1}>
          {tool.title}
        </Text>
        <Text style={styles.caption} numberOfLines={2}>
          {tool.description}
        </Text>
        {matchingPets.length > 0 ? (
          <View style={styles.petBadges}>
            {visiblePets.map((pet) => (
              <View key={pet.id} style={styles.petBadge}>
                <Text style={styles.petBadgeLabel} numberOfLines={1}>
                  {pet.name}
                </Text>
              </View>
            ))}
            {overflow > 0 ? (
              <View style={styles.petBadge}>
                <Text style={styles.petBadgeLabel}>{`+${overflow}`}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={styles.rowRight}>
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

function ToolsEmpty(): React.JSX.Element {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>—</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing.md,
    paddingBottom: SCREEN_BOTTOM_PADDING,
    gap: theme.spacing.sm,
  },
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
  petBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  petBadge: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.pill,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.sm,
    maxWidth: 140,
  },
  petBadgeLabel: {
    ...theme.typography.caption,
    color: theme.colors.primary,
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
  empty: {
    alignItems: "center",
    paddingTop: theme.spacing["3xl"],
  },
  emptyText: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
}));
