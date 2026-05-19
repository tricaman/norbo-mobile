import { CategoryBreakdown } from "@/components/expenses/CategoryBreakdown";
import { ExpenseHistoryRow } from "@/components/expenses/ExpenseHistoryRow";
import { ExpensesHero } from "@/components/expenses/ExpensesHero";
import { PeriodChips } from "@/components/expenses/PeriodChips";
import { PetFilterChips } from "@/components/expenses/PetFilterChips";
import { PageTitle } from "@/components/ui/PageTitle";
import { Screen } from "@/components/ui/Screen";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { ownerExpensesApi } from "@/services/owner-expenses.api";
import { petsApi } from "@/services/pets.api";
import type {
  ExpensePeriod,
  OwnerExpenseHistoryPage,
  OwnerExpenseSummary,
} from "@/types/owner-expense.types";
import type { Pet } from "@/types/pet.types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const HISTORY_LIMIT = 20;

/**
 * Global "Spese" tab — cross-pet expense overview.
 *
 * Layered shape:
 *   - title + subtitle (top of screen)
 *   - hero card (totale del periodo + trend + media mensile)
 *   - period chips (mese / anno / sempre)
 *   - pet filter chips
 *   - donut breakdown by category
 *   - paginated history list
 *
 * All filters drive both queries (summary + history) via the same
 * dependency array, keeping FE state simple.
 */
export default function ExpensesTab(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [period, setPeriod] = useState<ExpensePeriod>("year");
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);

  const petsQuery = useQuery({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
  });

  const summaryKey = useMemo(
    () => ["owner-expense-summary", period, [...selectedPetIds].sort()],
    [period, selectedPetIds],
  );

  const summaryQuery = useQuery({
    queryKey: summaryKey,
    queryFn: () =>
      ownerExpensesApi
        .summary({ period, petIds: selectedPetIds })
        .then((r) => r.data),
  });

  const historyQuery = useInfiniteQuery({
    queryKey: ["owner-expense-history", period, [...selectedPetIds].sort()],
    queryFn: ({ pageParam }) =>
      ownerExpensesApi
        .history({
          period,
          petIds: selectedPetIds,
          cursor: pageParam as string | null,
          limit: HISTORY_LIMIT,
        })
        .then((r) => r.data),
    initialPageParam: null as string | null,
    getNextPageParam: (last: OwnerExpenseHistoryPage) =>
      last.nextCursor ?? undefined,
  });

  const summary: OwnerExpenseSummary | undefined = summaryQuery.data;
  const pets: Pet[] = petsQuery.data ?? [];
  const petsById = useMemo(() => {
    const map = new Map<string, Pet>();
    for (const p of pets) map.set(p.id, p);
    return map;
  }, [pets]);

  const historyRows = useMemo(
    () => historyQuery.data?.pages.flatMap((p) => p.rows) ?? [],
    [historyQuery.data],
  );

  const onRefresh = (): void => {
    void summaryQuery.refetch();
    void historyQuery.refetch();
    void petsQuery.refetch();
  };

  const onEndReached = (): void => {
    if (historyQuery.hasNextPage && !historyQuery.isFetchingNextPage) {
      void historyQuery.fetchNextPage();
    }
  };

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={summaryQuery.isFetching || historyQuery.isFetching}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const distanceToBottom =
            contentSize.height - (layoutMeasurement.height + contentOffset.y);
          if (distanceToBottom < 240) onEndReached();
        }}
        scrollEventThrottle={200}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block */}
        <PageTitle
          title={t("expenses.title")}
          subtitle={t("expenses.subtitle")}
        />

        {/* Hero */}
        <View style={styles.heroWrap}>
          {summary ? (
            <ExpensesHero summary={summary} />
          ) : (
            <View
              style={[
                styles.heroPlaceholder,
                { backgroundColor: theme.colors.primarySoft },
              ]}
            >
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          )}
        </View>

        {/* Period chips */}
        <PeriodChips value={period} onChange={setPeriod} />

        {/* Pet filter */}
        {pets.length > 0 && (
          <PetFilterChips
            pets={pets}
            selected={selectedPetIds}
            onChange={setSelectedPetIds}
          />
        )}

        {/* Category breakdown */}
        {summary && summary.byCategory.length > 0 ? (
          <View style={styles.section}>
            <CategoryBreakdown summary={summary} />
          </View>
        ) : null}

        {/* History */}
        <View style={styles.historyHeaderWrap}>
          <Text
            style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}
          >
            {t("expenses.history")}
          </Text>
        </View>

        {historyRows.length > 0 ? (
          <View
            style={[
              styles.historyCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {historyRows.map((item, index) => (
              <View key={item.id}>
                {index > 0 && (
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: theme.colors.border },
                    ]}
                  />
                )}
                <ExpenseHistoryRow
                  item={item}
                  pet={petsById.get(item.petId)}
                  onPress={() => router.push(`/pets/${item.petId}`)}
                />
              </View>
            ))}
            {historyQuery.isFetchingNextPage && (
              <View style={styles.loadingMore}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            )}
          </View>
        ) : summaryQuery.isPending ? (
          <View style={styles.empty}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <View style={styles.empty}>
            <Text
              style={[styles.emptyText, { color: theme.colors.textTertiary }]}
            >
              {t("expenses.empty")}
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  heroWrap: {
    paddingHorizontal: theme.spacing.lg,
  },
  heroPlaceholder: {
    height: 160,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
  },
  historyHeaderWrap: {
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.sm,
  },
  sectionLabel: {
    ...theme.typography.caption,
  },
  historyCard: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    overflow: "hidden",
  },
  divider: {
    height: theme.hairline,
    marginLeft: theme.spacing.lg + 38 + theme.spacing.md,
  },
  loadingMore: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  empty: {
    marginHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing["3xl"],
    alignItems: "center",
  },
  emptyText: {
    ...theme.typography.footnote,
    textAlign: "center",
  },
}));
