import type {
  ExpensePeriod,
  OwnerExpenseSummary,
} from "@/types/owner-expense.types";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { formatCurrency, formatTrendPercent } from "./expense-format";

interface ExpensesHeroProps {
  summary: OwnerExpenseSummary;
}

/**
 * ExpensesHero — large green card showing the active-period total.
 *
 * Mirrors the "QUEST'ANNO €1284" hero in the design. Includes:
 *   - period label (eyebrow)
 *   - big total
 *   - trend pill vs previous comparable window (when available)
 *   - average-per-month subtitle (when the period has a defined length)
 */
export function ExpensesHero({
  summary,
}: ExpensesHeroProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const eyebrow = headerKeyForPeriod(summary.period);
  const totalLabel = formatCurrency(summary.total, summary.currency);
  const trendLabel = formatTrendPercent(summary.trendPercent);

  const previousLabel =
    summary.period === "year"
      ? extractPreviousYearLabel(summary.from)
      : null;

  const trendCopy = trendLabel
    ? summary.period === "month"
      ? t("expenses.trendVsPrevMonth", { value: trendLabel })
      : summary.period === "year" && previousLabel
        ? t("expenses.trendVsPrevYear", {
            value: trendLabel,
            previous: previousLabel,
          })
        : trendLabel
    : null;

  const avgCopy =
    summary.averagePerMonth !== null
      ? t("expenses.averagePerMonth", {
          value: formatCurrency(summary.averagePerMonth, summary.currency),
        })
      : null;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.primary },
      ]}
    >
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

      <View style={styles.metaRow}>
        {trendCopy ? (
          <View
            style={[
              styles.trendPill,
              { backgroundColor: "rgba(255,255,255,0.18)" },
            ]}
          >
            <Text
              style={[
                styles.trendText,
                { color: theme.colors.textOnPrimary },
              ]}
            >
              {trendCopy}
            </Text>
          </View>
        ) : null}
        {avgCopy ? (
          <Text
            style={[
              styles.avgText,
              { color: theme.colors.textOnPrimary, opacity: 0.85 },
            ]}
          >
            · {avgCopy}
          </Text>
        ) : null}
      </View>
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

function extractPreviousYearLabel(fromIso: string | null): string | null {
  if (!fromIso) return null;
  const d = new Date(fromIso);
  if (Number.isNaN(d.getTime())) return null;
  return String(d.getUTCFullYear() - 1);
}

const styles = StyleSheet.create((theme) => ({
  card: {
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    overflow: "hidden",
    gap: theme.spacing.sm,
    minHeight: 160,
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    flexWrap: "wrap",
  },
  trendPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  trendText: {
    ...theme.typography.footnote,
    fontWeight: "600",
  },
  avgText: {
    ...theme.typography.footnote,
  },
}));
