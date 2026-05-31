import { LineChart, type LineChartPoint } from "@/components/ui/LineChart";
import type { ExpenseMonthBreakdown } from "@/types/expense.types";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface ExpenseTrendChartProps {
  data: ExpenseMonthBreakdown[];
  currency: string;
  height?: number;
}

const SHORT_MONTHS: Record<string, string[]> = {
  it: [
    "gen", "feb", "mar", "apr", "mag", "giu",
    "lug", "ago", "set", "ott", "nov", "dic",
  ],
  en: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ],
};

function monthLabel(month: string, lang: string): string {
  const monthIdx = parseInt(month.substring(5), 10) - 1;
  const labels = SHORT_MONTHS[lang] ?? SHORT_MONTHS.en;
  return labels[monthIdx] ?? month.substring(5);
}

export function ExpenseTrendChart({
  data,
  height = 200,
}: ExpenseTrendChartProps): React.ReactElement | null {
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith("it") ? "it" : "en";

  const points = useMemo<LineChartPoint[]>(
    () =>
      data.map((d) => ({
        value: d.amount,
        xLabel: monthLabel(d.month, lang),
      })),
    [data, lang],
  );

  if (points.length === 0) return null;

  return <LineChart points={points} height={height} zeroBaseline />;
}
