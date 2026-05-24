import {
  defaultExpenseCategoryFor,
  eventCanHaveCost,
} from "@/shared/pet-event-schemas";
import { ExpenseCategory } from "@/types/expense.types";
import { PetEventType } from "@/types/pet-event.types";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

interface NudgeParams {
  petId: string;
  amount: number;
  eventType: PetEventType;
  petEventId: string;
}

/**
 * useExpenseNudge — non-blocking prompt after a PetEvent with cost > 0 is saved.
 *
 * Shows an Alert with "Yes, add" / "No thanks". If Yes, navigates to
 * `/expense/new` pre-filled with pet, amount, category, and petEventId.
 * Tapping No or dismissing does nothing — the expense is purely optional.
 *
 * Design decision: auto-sync (PetEvent.cost → Expense) is explicitly
 * deferred to v1.1. The nudge keeps user agency while surfacing the
 * capability. See ARCHITECTURE.md §Expense.
 */
export function useExpenseNudge(): (params: NudgeParams) => void {
  const { t } = useTranslation();
  const router = useRouter();

  return useCallback(
    ({ petId, amount, eventType, petEventId }: NudgeParams): void => {
      if (amount <= 0) return;
      // Don't nudge for event types that cannot bear a cost (NOTE, PHOTO, …).
      if (!eventCanHaveCost(eventType)) return;

      const category =
        defaultExpenseCategoryFor(eventType) ?? ExpenseCategory.OTHER;

      Alert.alert(
        t("expenses.nudgeTitle"),
        t("expenses.nudgeBody", { amount: amount.toFixed(2) }),
        [
          { text: t("expenses.nudgeNo"), style: "cancel" },
          {
            text: t("expenses.nudgeYes"),
            onPress: () => {
              router.push(
                `/expense/new?petId=${petId}&amount=${amount.toFixed(2)}&category=${category}&petEventId=${petEventId}` as never,
              );
            },
          },
        ],
      );
    },
    [t, router],
  );
}
