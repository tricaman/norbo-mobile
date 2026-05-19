import { NorboPressable } from "@/components/CustomPressable";
import { Dropdown, type DropdownAnchor } from "@/components/ui/Dropdown";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { petExpensesApi } from "@/services/pet-expenses.api";
import type {
  PetExpenseCategoryTotal,
  PetExpenseSummary,
} from "@/types/pet-expense.types";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface PetExpensesTabProps {
  petId: string;
}

const HISTORY_YEARS = 5;

/**
 * PetExpensesTab — yearly expenses breakdown for a pet.
 *
 * Reads `GET /pets/:petId/expenses/summary?year=YYYY` and renders:
 *   - total spent in the year + YoY trend pill
 *   - year picker (current year + previous N)
 *   - per-category bars sorted by total desc
 *
 * Source data lives on `PetEvent.cost` (OCCURRED events) — there is no
 * standalone Expense entity yet. Mixed-currency pets surface the
 * dominant currency and ignore the rest (backend MVP behavior).
 */
export function PetExpensesTab({
  petId,
}: PetExpensesTabProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [yearMenuVisible, setYearMenuVisible] = useState(false);
  const [yearAnchor, setYearAnchor] = useState<DropdownAnchor | null>(null);
  const yearChipRef = useRef<View>(null);

  const openYearMenu = (): void => {
    yearChipRef.current?.measureInWindow((x, y, width, height) => {
      setYearAnchor({ x, y, width, height });
      setYearMenuVisible(true);
    });
  };

  const query = useQuery({
    queryKey: ["pet-expenses", petId, year],
    queryFn: () => petExpensesApi.summary(petId, year).then((r) => r.data),
    enabled: !!petId,
  });

  const yearOptions = useMemo(
    () => Array.from({ length: HISTORY_YEARS }, (_, i) => currentYear - i),
    [currentYear],
  );

  const yearLabel =
    year === currentYear ? t("petDetail.expenses.currentYear") : String(year);

  if (query.isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (query.isError || !query.data) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>
          {t("petDetail.expenses.empty")}
        </Text>
      </View>
    );
  }

  const summary: PetExpenseSummary = query.data;
  const maxCategoryTotal =
    summary.byCategory.reduce<number>((acc, c) => Math.max(acc, c.total), 0) ||
    1;

  const trend = formatTrend(summary.yoyPercent);
  const trendColor =
    summary.yoyPercent === null
      ? theme.colors.textTertiary
      : summary.yoyPercent < 0
        ? theme.colors.success
        : summary.yoyPercent > 0
          ? theme.colors.warning
          : theme.colors.textTertiary;
  const trendBg =
    summary.yoyPercent === null
      ? theme.colors.surfaceOverlay
      : summary.yoyPercent < 0
        ? theme.colors.successSoft
        : summary.yoyPercent > 0
          ? theme.colors.warningSoft
          : theme.colors.surfaceOverlay;

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom },
        ]}
      >
        {/* ── Total card ─────────────────────────── */}
        <View
          style={[
            styles.totalCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[styles.totalLabel, { color: theme.colors.textTertiary }]}
          >
            {t("petDetail.expenses.spentIn", { year: String(summary.year) })}
          </Text>

          <View style={styles.totalRow}>
            <Text
              style={[styles.totalValue, { color: theme.colors.textPrimary }]}
            >
              {formatCurrency(summary.total, summary.currency)}
            </Text>
            {trend ? (
              <View style={[styles.trendPill, { backgroundColor: trendBg }]}>
                <Text style={[styles.trendText, { color: trendColor }]}>
                  {trend}
                </Text>
              </View>
            ) : null}
          </View>

          <View
            ref={yearChipRef}
            collapsable={false}
            style={styles.yearChipAnchor}
          >
            <NorboPressable
              style={styles.yearChip}
              scale="row"
              haptic="light"
              onPress={openYearMenu}
            >
              <IconSymbol
                name="calendar"
                size={13}
                tintColor={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.yearChipText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {yearLabel}
              </Text>
              <IconSymbol
                name="chevron.down"
                size={12}
                tintColor={theme.colors.textTertiary}
              />
            </NorboPressable>
          </View>
        </View>

        {/* ── Per-category breakdown ─────────────── */}
        {summary.byCategory.length > 0 ? (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.colors.textTertiary },
              ]}
            >
              {t("petDetail.expenses.byCategory")}
            </Text>
            <View
              style={[
                styles.categoryCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {summary.byCategory.map((row, i) => (
                <CategoryRow
                  key={row.type}
                  row={row}
                  ratio={row.total / maxCategoryTotal}
                  currency={summary.currency}
                  isLast={i === summary.byCategory.length - 1}
                />
              ))}
            </View>
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
              {t("petDetail.expenses.empty")}
            </Text>
          </View>
        )}
      </ScrollView>

      <Dropdown
        visible={yearMenuVisible}
        onClose={() => setYearMenuVisible(false)}
        anchor={yearAnchor}
        items={yearOptions.map((y) => ({
          label:
            y === currentYear ? t("petDetail.expenses.currentYear") : String(y),
          icon: "calendar",
          onPress: () => setYear(y),
        }))}
      />
    </>
  );
}

function CategoryRow({
  row,
  ratio,
  currency,
  isLast,
}: {
  row: PetExpenseCategoryTotal;
  ratio: number;
  currency: string;
  isLast: boolean;
}): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const color = CATEGORY_COLORS[row.type] ?? theme.colors.primary;

  return (
    <View
      style={[
        styles.categoryRow,
        !isLast && {
          borderBottomColor: theme.colors.border,
          borderBottomWidth: theme.hairline,
        },
      ]}
    >
      <Text
        style={[styles.categoryLabel, { color: theme.colors.textPrimary }]}
        numberOfLines={1}
      >
        {t(`petDetail.timeline.types.${row.type}`)}
      </Text>
      <View
        style={[
          styles.categoryBarTrack,
          { backgroundColor: theme.colors.surface2 },
        ]}
      >
        <View
          style={[
            styles.categoryBarFill,
            { backgroundColor: color, width: `${Math.max(ratio * 100, 4)}%` },
          ]}
        />
      </View>
      <Text style={[styles.categoryValue, { color: theme.colors.textPrimary }]}>
        {formatCurrency(row.total, currency)}
      </Text>
    </View>
  );
}

// Per-category color hint (kept here intentionally — there is no design
// system token map for event types yet, and the breakdown is the only
// place the colors are needed).
const CATEGORY_COLORS: Record<string, string> = {
  VET_VISIT: "#6B8595",
  VACCINATION: "#7E9970",
  PARASITE_TREATMENT: "#8DA28A",
  GROOMING: "#D4A24C",
  WEIGHT_RECORD: "#9CAEBA",
  WATER_PARAMETERS: "#7B9DB0",
  WATER_CHANGE: "#6B8595",
  MOLT: "#B59C6E",
  FEEDING_LOG: "#C9A567",
  MEDICATION: "#5B7553",
  PHOTO: "#A88FC2",
  NOTE: "#8D816A",
  INSURANCE: "#6B6358",
};

function formatCurrency(amount: number, currency: string): string {
  const safeCurrency = currency || "EUR";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${safeCurrency}`;
  }
}

function formatTrend(yoyPercent: number | null): string | null {
  if (yoyPercent === null) return null;
  const rounded = Math.round(yoyPercent);
  if (rounded === 0) return "0%";
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}%`;
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing["3xl"],
  },
  emptyBlock: {
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing["3xl"],
  },
  emptyText: {
    ...theme.typography.footnote,
    textAlign: "center",
  },
  // Total card
  totalCard: {
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  totalLabel: {
    ...theme.typography.caption,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  totalValue: {
    ...theme.typography.display,
    fontWeight: "700",
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
  yearChipAnchor: {
    alignSelf: "flex-start",
  },
  yearChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    alignSelf: "flex-start",
    paddingVertical: theme.spacing.xs,
  },
  yearChipText: {
    ...theme.typography.footnote,
    fontWeight: "500",
  },
  // Sections
  section: {
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    ...theme.typography.caption,
    paddingHorizontal: theme.spacing.xs,
  },
  categoryCard: {
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    overflow: "hidden",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  categoryLabel: {
    ...theme.typography.subhead,
    width: 80,
  },
  categoryBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: theme.radius.pill,
    overflow: "hidden",
  },
  categoryBarFill: {
    height: "100%",
    borderRadius: theme.radius.pill,
  },
  categoryValue: {
    ...theme.typography.subhead,
    fontWeight: "600",
    minWidth: 64,
    textAlign: "right",
  },
}));
