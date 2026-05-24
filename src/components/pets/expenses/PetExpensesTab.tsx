import { NorboPressable } from "@/components/CustomPressable";
import { CategoryBreakdown } from "@/components/expenses/CategoryBreakdown";
import { ExpenseHistoryRow } from "@/components/expenses/ExpenseHistoryRow";
import { PeriodChips } from "@/components/expenses/PeriodChips";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { expensesApi } from "@/services/expenses.api";
import type { ExpensePeriod } from "@/types/expense.types";
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
import { formatCurrency } from "@/components/expenses/expense-format";

interface PetExpensesTabProps {
  petId: string;
}

export function PetExpensesTab({ petId }: PetExpensesTabProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [period, setPeriod] = useState<ExpensePeriod>("year");

  const summaryQuery = useQuery({
    queryKey: ["expenses-summary", { period, petId }],
    queryFn: () => expensesApi.summary({ period, petId }).then((r) => r.data),
    enabled: !!petId,
  });

  const listQuery = useInfiniteQuery({
    queryKey: ["expenses", { period, petId }],
    queryFn: ({ pageParam }) =>
      expensesApi.list({ period, petId, cursor: pageParam as string | undefined, limit: 20 }).then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!petId,
  });

  const allExpenses = useMemo(() => listQuery.data?.pages.flatMap((p) => p.rows) ?? [], [listQuery.data]);


  const summary = summaryQuery.data;

  return (
    <FlatList
      data={allExpenses}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ExpenseHistoryRow
          item={item}
          onPress={() => router.push(`/expense/${item.id}` as never)}
        />
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <PeriodChips value={period} onChange={setPeriod} />

          {summaryQuery.isPending ? (
            <View style={styles.centered}><ActivityIndicator color={theme.colors.primary} /></View>
          ) : summary ? (
            <>
              <View
                style={[styles.totalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <Text style={[styles.totalLabel, { color: theme.colors.textTertiary }]}>
                  {t("petDetail.expenses.spentIn", { year: String(new Date().getFullYear()) })}
                </Text>
                <Text style={[styles.totalValue, { color: theme.colors.textPrimary }]}>
                  {formatCurrency(summary.total.amount, summary.total.currency)}
                </Text>
              </View>
              {summary.byCategory.length > 0 && <CategoryBreakdown summary={summary} />}
            </>
          ) : null}

          {allExpenses.length > 0 && (
            <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>
              {t("expenses.history").toUpperCase()}
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={
        listQuery.isPending ? null : (
          <View style={styles.emptyBlock}>
            <IconSymbol name="creditcard" size={28} tintColor={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>
              {t("petDetail.expenses.empty")}
            </Text>
            <NorboPressable
              style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
              haptic="medium"
              onPress={() => router.push(`/expense/new?petId=${petId}` as never)}
            >
              <Text style={[styles.addBtnLabel, { color: theme.colors.textOnPrimary }]}>
                {t("expenses.emptyAdd")}
              </Text>
            </NorboPressable>
          </View>
        )
      }
      ListFooterComponent={
        listQuery.isFetchingNextPage ? (
          <View style={styles.footer}><ActivityIndicator size="small" color={theme.colors.primary} /></View>
        ) : null
      }
      onEndReached={() => { if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) void listQuery.fetchNextPage(); }}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={listQuery.isRefetching || summaryQuery.isRefetching}
          onRefresh={() => { void listQuery.refetch(); void summaryQuery.refetch(); }}
        />
      }
      contentContainerStyle={[
        styles.content,
        { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom },
        allExpenses.length === 0 && styles.centeredContent,
      ]}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  header: { gap: theme.spacing.md, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg },
  centered: { alignItems: "center", justifyContent: "center", paddingVertical: theme.spacing["2xl"] },
  totalCard: { borderRadius: theme.radius.lg, borderWidth: theme.hairline, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.lg, gap: theme.spacing.xs },
  totalLabel: { ...theme.typography.caption },
  totalValue: { ...theme.typography.display, fontWeight: "700" },
  sectionLabel: { ...theme.typography.caption, paddingTop: theme.spacing.sm },
  content: { flexGrow: 1, paddingTop: 0 },
  centeredContent: { flex: 1, justifyContent: "center" },
  emptyBlock: { alignItems: "center", gap: theme.spacing.md, paddingVertical: theme.spacing["3xl"] },
  emptyText: { ...theme.typography.footnote, textAlign: "center" },
  addBtn: { paddingHorizontal: theme.spacing["2xl"], paddingVertical: theme.spacing.sm, borderRadius: theme.radius.pill },
  addBtnLabel: { ...theme.typography.subhead, fontWeight: "600" },
  footer: { paddingVertical: theme.spacing.lg, alignItems: "center" },
}));
