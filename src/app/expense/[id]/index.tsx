import { queryClient } from "@/app/_layout";
import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useMutation } from "@/hooks/useMutation";
import { expensesApi } from "@/services/expenses.api";
import type { Expense } from "@/types/expense.types";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import {
  EXPENSE_CATEGORY_COLORS,
  EXPENSE_CATEGORY_ICON,
  formatCurrency,
} from "@/components/expenses/expense-format";

export default function ExpenseDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({
    queryKey: ["expense", id],
    queryFn: () => expensesApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
  return (
    <Screen>
      <QueryBoundary query={query}>
        {(expense) => <ExpenseDetail expense={expense} />}
      </QueryBoundary>
    </Screen>
  );
}

function ExpenseDetail({ expense }: { expense: Expense }): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dateLocale = i18n.language?.startsWith("it") ? itLocale : enUS;

  const { mutate: deleteMutation } = useMutation({
    mutationFn: () => expensesApi.delete(expense.id),
    showSuccessToast: true,
    successMessage: t("expenses.deleteSuccess"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });
      router.back();
    },
  });

  const confirmDelete = (): void => {
    Alert.alert(
      t("expenses.deleteConfirmTitle"),
      t("expenses.deleteConfirmMessage"),
      [
        { text: t("expenses.deleteConfirmCancel"), style: "cancel" },
        { text: t("expenses.deleteConfirmOk"), style: "destructive", onPress: () => { deleteMutation(); } },
      ],
    );
  };

  const color = EXPENSE_CATEGORY_COLORS[expense.category] ?? theme.colors.primary;
  const icon = EXPENSE_CATEGORY_ICON[expense.category] ?? "creditcard";
  const dateLabel = format(parseISO(expense.occurredAt), "d MMMM yyyy", { locale: dateLocale });
  const categoryLabel = t(`expenses.categories.${expense.category}` as "expenses.categories.VET");

  return (
    <>
      <ScreenHeader
        title={categoryLabel}
        right={
          <NorboPressable haptic="light" onPress={() => router.push(`/expense/${expense.id}/edit` as never)}>
            <IconSymbol name="pencil" size={18} tintColor={theme.colors.primary} />
          </NorboPressable>
        }
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom }]}>
        {/* Main card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.iconRow}>
            <View style={[styles.iconWrap, { backgroundColor: `${color}22` }]}>
              <IconSymbol name={icon} size={22} tintColor={color} />
            </View>
            <Text style={[styles.amount, { color: theme.colors.textPrimary }]}>
              {formatCurrency(expense.amount, expense.currency)}
            </Text>
          </View>
          <Text style={[styles.category, { color: theme.colors.textSecondary }]}>{categoryLabel}</Text>
          <Text style={[styles.date, { color: theme.colors.textTertiary }]}>{dateLabel}</Text>
          {expense.description ? (
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{expense.description}</Text>
          ) : null}
        </View>

        {/* Receipt */}
        {expense.receiptUrl ? (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textTertiary }]}>
              {t("expenses.fieldReceipt").toUpperCase()}
            </Text>
            <Image source={{ uri: expense.receiptUrl }} style={styles.receipt} contentFit="contain" />
          </View>
        ) : null}

        {/* Delete */}
        <NorboPressable
          style={[styles.deleteBtn, { backgroundColor: theme.colors.error }]}
          haptic="error"
          onPress={confirmDelete}
        >
          <IconSymbol name="trash.fill" size={18} tintColor={theme.colors.textOnPrimary} />
          <Text style={[styles.deleteBtnLabel, { color: theme.colors.textOnPrimary }]}>
            {t("expenses.deleteConfirmOk")}
          </Text>
        </NorboPressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { padding: theme.spacing.lg, gap: theme.spacing.md, flexGrow: 1 },
  card: { borderRadius: theme.radius.lg, borderWidth: theme.hairline, padding: theme.spacing.lg, gap: theme.spacing.sm },
  iconRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  amount: { ...theme.typography.display, fontWeight: "700" },
  category: { ...theme.typography.subhead },
  date: { ...theme.typography.caption },
  description: { ...theme.typography.body, lineHeight: 22 },
  fieldLabel: { ...theme.typography.caption, fontWeight: "600", letterSpacing: 0.5 },
  receipt: { width: "100%", height: 200, borderRadius: theme.radius.md },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing.sm, paddingVertical: theme.spacing.md, borderRadius: theme.radius.pill, marginTop: theme.spacing.lg },
  deleteBtnLabel: { ...theme.typography.subhead, fontWeight: "600" },
}));
