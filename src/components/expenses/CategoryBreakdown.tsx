import type {
  OwnerExpenseCategoryTotal,
  OwnerExpenseSummary,
} from "@/types/owner-expense.types";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { CategoryDonut } from "./CategoryDonut";
import {
  EXPENSE_CATEGORY_COLORS,
  formatCurrency,
} from "./expense-format";

interface CategoryBreakdownProps {
  summary: OwnerExpenseSummary;
}

/**
 * CategoryBreakdown — donut + legend rendered inside a surface card.
 *
 * Sorts categories by total descending. Empty state is handled by the
 * parent screen so we always render with at least one slice here.
 */
export function CategoryBreakdown({
  summary,
}: CategoryBreakdownProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const slices = useMemo(
    () =>
      summary.byCategory.map((row) => ({
        key: row.type,
        value: row.total,
        color: EXPENSE_CATEGORY_COLORS[row.type] ?? theme.colors.primary,
      })),
    [summary.byCategory, theme.colors.primary],
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        {t("expenses.byCategory")}
      </Text>

      <View style={styles.body}>
        <CategoryDonut
          slices={slices}
          total={summary.total}
          centerLabel={t("expenses.total")}
          centerValue={formatCurrency(summary.total, summary.currency)}
        />

        <View style={styles.legend}>
          {summary.byCategory.map((row) => (
            <LegendRow
              key={row.type}
              row={row}
              total={summary.total}
              currency={summary.currency}
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
  row: OwnerExpenseCategoryTotal;
  total: number;
  currency: string;
}): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const color = EXPENSE_CATEGORY_COLORS[row.type] ?? theme.colors.primary;
  const percent = total > 0 ? Math.round((row.total / total) * 100) : 0;

  return (
    <View style={styles.legendRow}>
      <View style={styles.legendNameWrap}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text
          style={[styles.legendName, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {t(`petDetail.timeline.types.${row.type}`)}
        </Text>
      </View>
      <Text
        style={[styles.legendValue, { color: theme.colors.textPrimary }]}
        numberOfLines={1}
      >
        {formatCurrency(row.total, currency)}
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
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.lg,
  },
  legend: {
    flex: 1,
    gap: theme.spacing.xs,
  },
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
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    ...theme.typography.footnote,
    flexShrink: 1,
  },
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
