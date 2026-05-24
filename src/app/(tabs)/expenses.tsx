import { NorboPressable } from "@/components/CustomPressable";
import { CategoryBreakdown } from "@/components/expenses/CategoryBreakdown";
import { ExpenseHistoryRow } from "@/components/expenses/ExpenseHistoryRow";
import { ExpensesHero } from "@/components/expenses/ExpensesHero";
import { PeriodChips } from "@/components/expenses/PeriodChips";
import { PetFilterChips } from "@/components/expenses/PetFilterChips";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { TabScreen } from "@/components/ui/TabScreen";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { expensesApi } from "@/services/expenses.api";
import { petsApi } from "@/services/pets.api";
import type { ExpensePeriod } from "@/types/expense.types";
import type { Pet } from "@/types/pet.types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export default function ExpensesTab(): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [period, setPeriod] = useState<ExpensePeriod>("month");
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);

  const petsQuery = useQuery({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
  });
  const pets = petsQuery.data ?? [];

  // Stable cache key irrespective of selection ordering.
  const sortedPetIds = useMemo(
    () => [...selectedPetIds].sort(),
    [selectedPetIds],
  );
  const petIdsParam = sortedPetIds.length > 0 ? sortedPetIds : undefined;

  const summaryQuery = useQuery({
    queryKey: ["expenses-summary", { period, petIds: sortedPetIds }],
    queryFn: () =>
      expensesApi.summary({ period, petIds: petIdsParam }).then((r) => r.data),
  });

  const listQuery = useInfiniteQuery({
    queryKey: ["expenses", { period, petIds: sortedPetIds }],
    queryFn: ({ pageParam }) =>
      expensesApi
        .list({
          period,
          petIds: petIdsParam,
          cursor: pageParam as string | undefined,
          limit: 20,
        })
        .then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const allExpenses = useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.rows) ?? [],
    [listQuery.data],
  );

  const petsById = useMemo(() => {
    const map = new Map<string, Pet>();
    for (const p of petsQuery.data ?? []) map.set(p.id, p);
    return map;
  }, [petsQuery.data]);

  const summary = summaryQuery.data;

  return (
    <TabScreen title={t("expenses.title")} edges={["top"]}>
      <FlatList
        data={allExpenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExpenseHistoryRow
            item={item}
            petName={petsById.get(item.petId)?.name}
            onPress={() => router.push(`/expense/${item.id}` as never)}
          />
        )}
        ItemSeparatorComponent={() => (
          <View
            style={[
              styles.rowDivider,
              { backgroundColor: theme.colors.border },
            ]}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <PeriodChips value={period} onChange={setPeriod} />
            {pets.length > 1 && (
              <PetFilterChips
                pets={pets}
                selected={selectedPetIds}
                onChange={setSelectedPetIds}
              />
            )}
            {summary && (
              <View style={styles.heroWrap}>
                <ExpensesHero summary={summary} period={period} />
              </View>
            )}
            {summary && summary.byCategory.length > 0 && (
              <View style={styles.section}>
                <CategoryBreakdown summary={summary} />
              </View>
            )}
            {summary && summary.byPet.length > 1 && (
              <View style={styles.section}>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {t("expenses.byPet")}
                  </Text>
                  {summary.byPet.map((row) => (
                    <View key={row.petId} style={styles.petRow}>
                      <Text
                        style={[
                          styles.petName,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {row.petName}
                      </Text>
                      <Text
                        style={[
                          styles.petAmount,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: summary.total.currency,
                          maximumFractionDigits: 0,
                        }).format(row.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {allExpenses.length > 0 && (
              <Text
                style={[
                  styles.sectionLabel,
                  { color: theme.colors.textTertiary },
                ]}
              >
                {t("expenses.history").toUpperCase()}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          listQuery.isPending ? (
            <View style={styles.centered}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyBlock}>
              <IconSymbol
                name="creditcard"
                size={28}
                tintColor={theme.colors.textTertiary}
              />
              <Text
                style={[styles.emptyText, { color: theme.colors.textTertiary }]}
              >
                {t("expenses.empty")}
              </Text>
              <NorboPressable
                style={[
                  styles.emptyBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
                haptic="medium"
                onPress={() => router.push("/expense/new" as never)}
              >
                <Text
                  style={[
                    styles.emptyBtnLabel,
                    { color: theme.colors.textOnPrimary },
                  ]}
                >
                  {t("expenses.emptyAdd")}
                </Text>
              </NorboPressable>
            </View>
          )
        }
        ListFooterComponent={
          listQuery.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (listQuery.hasNextPage && !listQuery.isFetchingNextPage)
            void listQuery.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={listQuery.isRefetching || summaryQuery.isRefetching}
            onRefresh={() => {
              void listQuery.refetch();
              void summaryQuery.refetch();
            }}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Suppress the FAB when the empty-state CTA is showing so they
          don't overlap visually. */}
      {allExpenses.length > 0 ? (
        <NorboPressable
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          haptic="medium"
          onPress={() => router.push("/expense/new" as never)}
        >
          <IconSymbol
            name="plus"
            size={22}
            tintColor={theme.colors.textOnPrimary}
          />
        </NorboPressable>
      ) : null}
    </TabScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: { gap: theme.spacing.md, paddingTop: theme.spacing.sm },
  heroWrap: { paddingHorizontal: theme.spacing.lg },
  section: { paddingHorizontal: theme.spacing.lg },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cardTitle: { ...theme.typography.subhead, fontWeight: "600" },
  petRow: { flexDirection: "row", justifyContent: "space-between" },
  petName: { ...theme.typography.subhead },
  petAmount: { ...theme.typography.subhead, fontWeight: "600" },
  sectionLabel: {
    ...theme.typography.caption,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  listContent: { flexGrow: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
  },
  emptyBlock: {
    alignItems: "center",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing["3xl"],
  },
  emptyText: { ...theme.typography.footnote, textAlign: "center" },
  emptyBtn: {
    paddingHorizontal: theme.spacing["2xl"],
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
  },
  emptyBtnLabel: { ...theme.typography.subhead, fontWeight: "600" },
  footer: { paddingVertical: theme.spacing.lg, alignItems: "center" },
  rowDivider: {
    height: theme.hairline,
    marginLeft: theme.spacing.lg + 38 + theme.spacing.md,
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
