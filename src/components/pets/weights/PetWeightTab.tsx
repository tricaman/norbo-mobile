import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { PeriodChips, type Period } from "@/components/ui/PeriodChips";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useWeightHistory } from "@/hooks/useWeightHistory";
import type { PetCategory } from "@/types/pet.types";
import { formatWeight } from "@/utils/weight";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, RefreshControl, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { WeightChart } from "./WeightChart";

interface PetWeightTabProps {
  petId: string;
  category: PetCategory;
  onScroll?: (event: any) => void;
  contentInsetTop?: number;
}

export function PetWeightTab({
  petId,
  category,
  onScroll,
  contentInsetTop = 0,
}: PetWeightTabProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [period, setPeriod] = useState<Period>("year");

  const {
    records,
    latest,
    isPending,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useWeightHistory(petId);

  // Fetch all pages to get full history
  React.useEffect(() => {
    if (hasNextPage) void fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  // Filter records by period
  const filteredRecords = useMemo(() => {
    if (period === "all") return records;
    const now = new Date();
    const cutoff = new Date();
    if (period === "month") {
      cutoff.setMonth(now.getMonth() - 1);
    } else {
      cutoff.setFullYear(now.getFullYear() - 1);
    }
    return records.filter((r) => new Date(r.occurredAt) >= cutoff);
  }, [records, period]);

  if (isPending) {
    return (
      <View style={[styles.centered, { paddingTop: contentInsetTop }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (records.length === 0) {
    return (
      <View
        style={[
          styles.emptyRoot,
          {
            paddingTop: contentInsetTop,
            paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom,
          },
        ]}
      >
        <View style={styles.emptyContent}>
          <IconSymbol
            name="chart.line.uptrend.xyaxis"
            size={32}
            tintColor={theme.colors.textTertiary}
          />
          <Text
            style={[styles.emptyText, { color: theme.colors.textTertiary }]}
          >
            {t("petDetail.weight.empty")}
          </Text>
        </View>

        <NorboPressable
          style={[styles.cta, { backgroundColor: theme.colors.primary }]}
          haptic="medium"
          onPress={() => router.push(`/pets/${petId}/weights/new` as never)}
        >
          <IconSymbol
            name="plus"
            size={16}
            tintColor={theme.colors.textOnPrimary}
          />
          <Text
            style={[styles.ctaLabel, { color: theme.colors.textOnPrimary }]}
          >
            {t("petDetail.weight.addCta")}
          </Text>
        </NorboPressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: contentInsetTop + theme.spacing.lg,
            paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom + 80,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            progressViewOffset={contentInsetTop}
          />
        }
      >
        <PeriodChips value={period} onChange={setPeriod} />

        {/* Latest weight card */}
        {latest && (
          <View
            style={[
              styles.latestCard,
              {
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Text
              style={[styles.latestLabel, { color: theme.colors.textTertiary }]}
            >
              {t("petDetail.weight.latest")}
            </Text>
            <Text
              style={[styles.latestValue, { color: theme.colors.textPrimary }]}
            >
              {formatWeight(latest.weightMg, { category })}
            </Text>
          </View>
        )}

        {/* Chart */}
        {filteredRecords.length >= 2 ? (
          <View style={{ marginHorizontal: theme.spacing.lg }}>
            <WeightChart records={filteredRecords} category={category} />
          </View>
        ) : (
          <View style={styles.chartEmpty}>
            <Text
              style={[
                styles.chartEmptyText,
                { color: theme.colors.textTertiary },
              ]}
            >
              {t("petDetail.weight.chartMinData")}
            </Text>
          </View>
        )}

        {/* Weight history list */}
        <Text
          style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}
        >
          {t("petDetail.weight.history")}
        </Text>
        {filteredRecords.map((record) => (
          <View
            key={record.event.id}
            style={[
              styles.historyRow,
              {
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.historyWeight,
                { color: theme.colors.textPrimary },
              ]}
            >
              {formatWeight(record.weightMg, { category })}
            </Text>
            <Text
              style={[styles.historyDate, { color: theme.colors.textTertiary }]}
            >
              {new Date(record.occurredAt).toLocaleDateString()}
            </Text>
          </View>
        ))}
      </Animated.ScrollView>

      {/* FAB */}
      <NorboPressable
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        haptic="medium"
        onPress={() => router.push(`/pets/${petId}/weights/new` as never)}
      >
        <IconSymbol
          name="plus"
          size={22}
          tintColor={theme.colors.textOnPrimary}
        />
      </NorboPressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyRoot: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
  },
  emptyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing["3xl"],
  },
  emptyText: {
    ...theme.typography.footnote,
    textAlign: "center",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing["2xl"],
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    marginBottom: theme.spacing.lg,
  },
  ctaLabel: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
  scroll: {
    gap: theme.spacing.md,
  },
  latestCard: {
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.xs,
    ...theme.card,
  },
  latestLabel: {
    ...theme.typography.caption,
  },
  latestValue: {
    ...theme.typography.display,
    fontWeight: "700",
  },
  chartEmpty: {
    marginHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing["2xl"],
    alignItems: "center",
  },
  chartEmptyText: {
    ...theme.typography.footnote,
    textAlign: "center",
  },
  sectionLabel: {
    ...theme.typography.caption,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  historyRow: {
    marginHorizontal: theme.spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    ...theme.card,
  },
  historyWeight: {
    ...theme.typography.body,
    fontWeight: "600",
  },
  historyDate: {
    ...theme.typography.footnote,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
}));
