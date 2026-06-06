import type {
  ExpenseCategoryBreakdown,
  ExpenseSummary,
} from "@/types/expense.types";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { CategoryDonut } from "./CategoryDonut";
import { EXPENSE_CATEGORY_COLORS, formatCurrency } from "./expense-format";

interface CategoryBreakdownProps {
  summary: ExpenseSummary;
}

export function CategoryBreakdown({
  summary,
}: CategoryBreakdownProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const slices = useMemo(
    () =>
      summary.byCategory.map((row) => ({
        key: row.category,
        value: row.amount,
        color: EXPENSE_CATEGORY_COLORS[row.category] ?? theme.colors.primary,
      })),
    [summary.byCategory, theme.colors.primary],
  );

  const totalAmount = summary.total.amount;
  const currency = summary.total.currency;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        {t("expenses.byCategory")}
      </Text>
      <View style={styles.body}>
        <CategoryDonut
          slices={slices}
          total={totalAmount}
          centerLabel={t("expenses.total")}
          centerValue={formatCurrency(totalAmount, currency)}
        />
        <View style={styles.legend}>
          {summary.byCategory.map((row) => (
            <LegendRow
              key={row.category}
              row={row}
              total={totalAmount}
              currency={currency}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function LegendRow({
  row,
  total,
  currency,
}: {
  row: ExpenseCategoryBreakdown;
  total: number;
  currency: string;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const color = EXPENSE_CATEGORY_COLORS[row.category] ?? theme.colors.primary;
  const percent = total > 0 ? Math.round((row.amount / total) * 100) : 0;

  return (
    <View style={styles.legendRow}>
      <View style={styles.legendNameWrap}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text
          style={[styles.legendName, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {t(
            `expenses.categories.${row.category}` as "expenses.categories.VET",
          )}
        </Text>
      </View>
      <Text
        style={[styles.legendValue, { color: theme.colors.textPrimary }]}
        numberOfLines={1}
      >
        {formatCurrency(row.amount, currency)}
      </Text>
      <Text
        style={[styles.legendPercent, { color: theme.colors.textTertiary }]}
      >
        {percent}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.card,
  },
  title: { ...theme.typography.subhead, fontWeight: "600" },
  body: { flexDirection: "row", alignItems: "center", gap: theme.spacing.lg },
  legend: { flex: 1, gap: theme.spacing.xs },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  legendNameWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { ...theme.typography.footnote, flexShrink: 1 },
  legendValue: {
    ...theme.typography.footnote,
    fontWeight: "600",
    minWidth: 56,
    textAlign: "right",
  },
  legendPercent: {
    ...theme.typography.caption,
    minWidth: 32,
    textAlign: "right",
  },
}));
