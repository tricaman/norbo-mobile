import type { ExpensePeriod, ExpenseSummary } from "@/types/expense.types";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { formatCurrency } from "./expense-format";

interface ExpensesHeroProps {
  summary: ExpenseSummary;
  period: ExpensePeriod;
}

/**
 * ExpensesHero — large green card showing the active-period total.
 *
 * Includes the period label (eyebrow) and the total. Trend pill and
 * average-per-month copy were removed because the current `ExpenseSummary`
 * contract doesn't carry the necessary baseline fields; reintroduce when
 * the backend exposes `trendPercent` / `averagePerMonth` on the summary.
 */
export function ExpensesHero({
  summary,
  period,
}: ExpensesHeroProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const eyebrow = headerKeyForPeriod(period);
  const totalLabel = formatCurrency(
    summary.total.amount,
    summary.total.currency,
  );

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.primary }]}>
      {/* Decorative concentric arcs in the bottom-right corner. */}
      <View style={styles.decoration} pointerEvents="none">
        <Svg width={220} height={220}>
          <Circle
            cx={170}
            cy={120}
            r={80}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={2}
            fill="none"
          />
          <Circle
            cx={170}
            cy={120}
            r={48}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={1}
            fill="none"
          />
        </Svg>
      </View>

      <Text style={[styles.eyebrow, { color: theme.colors.textOnPrimary }]}>
        {t(eyebrow)}
      </Text>
      <Text
        style={[styles.total, { color: theme.colors.textOnPrimary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {totalLabel}
      </Text>
    </View>
  );
}

function headerKeyForPeriod(
  period: ExpensePeriod,
):
  | "expenses.heroLabelMonth"
  | "expenses.heroLabelYear"
  | "expenses.heroLabelAll" {
  if (period === "month") return "expenses.heroLabelMonth";
  if (period === "year") return "expenses.heroLabelYear";
  return "expenses.heroLabelAll";
}

const styles = StyleSheet.create((theme) => ({
  card: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    overflow: "hidden",
    gap: theme.spacing.sm,
    minHeight: 160,
    ...theme.card,
  },
  decoration: {
    position: "absolute",
    right: -40,
    top: -10,
  },
  eyebrow: {
    ...theme.typography.caption,
    opacity: 0.8,
  },
  total: {
    ...theme.typography.display,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
}));
