import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import type { Expense } from "@/types/expense.types";
import { format } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import {
  EXPENSE_CATEGORY_COLORS,
  EXPENSE_CATEGORY_ICON,
  formatCurrency,
} from "./expense-format";

interface ExpenseHistoryRowProps {
  item: Expense;
  petName?: string;
  onPress: () => void;
}

export function ExpenseHistoryRow({
  item,
  petName,
  onPress,
}: ExpenseHistoryRowProps): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const color = EXPENSE_CATEGORY_COLORS[item.category] ?? theme.colors.primary;
  const icon = EXPENSE_CATEGORY_ICON[item.category] ?? "creditcard";

  const dateLocale = i18n.language?.startsWith("it") ? itLocale : enUS;
  const dateLabel = (() => {
    const d = new Date(item.occurredAt);
    if (Number.isNaN(d.getTime())) return "";
    return format(d, "d MMM", { locale: dateLocale });
  })();

  const categoryLabel = t(`expenses.categories.${item.category}` as "expenses.categories.VET");
  const subtitleParts = [petName, categoryLabel, dateLabel].filter(
    (p): p is string => Boolean(p),
  );

  return (
    <NorboPressable scale="row" haptic="light" onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: theme.colors.surface2 }]}>
          <IconSymbol name={icon} size={18} tintColor={color} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {item.description ?? categoryLabel}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textTertiary }]} numberOfLines={1}>
            {subtitleParts.join(" · ")}
          </Text>
        </View>
        <Text style={[styles.cost, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {formatCurrency(item.amount, item.currency)}
        </Text>
      </View>
    </NorboPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, gap: 2 },
  title: { ...theme.typography.subhead, fontWeight: "600" },
  subtitle: {
    ...theme.typography.caption,
    textTransform: "none",
    letterSpacing: 0,
    fontWeight: "400",
  },
  cost: { ...theme.typography.subhead, fontWeight: "600" },
}));
