import { NorboPressable } from "@/components/CustomPressable";
import { CATEGORY_META } from "@/components/pets/wizard/category-meta";
import { PetCategoryIcon } from "@/components/pets/wizard/PetCategoryIcon";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useMutation } from "@/hooks/useMutation";
import { remindersApi } from "@/services/reminders.api";
import { ReminderSubjectType, type Reminder } from "@/types/reminder.types";
import type { Pet } from "@/types/pet.types";
import { useQueryClient } from "@tanstack/react-query";
import { format, isPast, isToday, isTomorrow, parseISO } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import { Image } from "expo-image";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const SUBJECT_ICONS: Record<ReminderSubjectType, string> = {
  [ReminderSubjectType.HEALTH_EVENT]: "bell.fill",
  [ReminderSubjectType.MAINTENANCE]: "wrench",
  [ReminderSubjectType.CONSUMABLE]: "cart.fill",
  [ReminderSubjectType.ADMIN]: "doc.text",
  [ReminderSubjectType.MILESTONE]: "flag.fill",
  [ReminderSubjectType.CUSTOM]: "note.text",
};

interface HomeReminderRowProps {
  reminder: Reminder;
  /**
   * The reminder's pet, when it has one AND it is among the user's active
   * pets. Undefined covers both petless reminders (ADMIN/CUSTOM/CONSUMABLE)
   * and reminders whose pet is deceased or deleted — the row renders either
   * way, it just falls back to the subject icon.
   */
  pet?: Pet;
  onPress: () => void;
}

/**
 * Compact, read-only-ish reminder row for the home "what to do" section.
 *
 * Deliberately NOT `ReminderItem`: that one hardcodes its own horizontal
 * margins, wires horizontal swipe gestures (which fight the home ScrollView),
 * and runs infinite pulse animations when overdue — costly on a screen that
 * stays mounted. This row has no margin of its own and lives inside the
 * section's padding.
 */
export function HomeReminderRow({
  reminder,
  pet,
  onPress,
}: HomeReminderRowProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const queryClient = useQueryClient();
  const dateLocale = i18n.language.startsWith("it") ? itLocale : enUS;

  const due = parseISO(reminder.dueAt);
  const overdue = isPast(due) && !isToday(due);

  const { mutate: complete, isPending } = useMutation({
    mutationFn: () => remindersApi.complete(reminder.id),
    showErrorToast: true,
    triggerHaptics: true,
    // The bare prefix covers the home section, /reminders and the pet-detail
    // "next reminder" tile in one go.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });

  const dayLabel = isToday(due)
    ? t("petDetail.timeline.pillToday")
    : isTomorrow(due)
      ? t("petDetail.timeline.pillTomorrow")
      : format(due, "d MMM", { locale: dateLocale });
  const dateSubtitle = `${dayLabel} · ${format(due, "HH:mm", { locale: dateLocale })}`;

  const title = pet ? `${pet.name} · ${reminder.title}` : reminder.title;
  const meta = pet ? CATEGORY_META[pet.category] : null;

  return (
    <NorboPressable
      scale="row"
      haptic="light"
      onPress={onPress}
      style={[styles.row, { backgroundColor: theme.colors.surface }]}
    >
      {overdue ? (
        <View
          style={[styles.overdueBar, { backgroundColor: theme.colors.error }]}
        />
      ) : null}

      <View
        style={[
          styles.avatar,
          { backgroundColor: meta ? meta.tint : theme.colors.surface2 },
        ]}
      >
        {pet && meta ? (
          pet.photoUrl ? (
            <Image
              source={{ uri: pet.photoUrl }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <PetCategoryIcon
              category={pet.category}
              size={22}
              color="rgba(255,255,255,0.85)"
            />
          )
        ) : (
          <IconSymbol
            name={SUBJECT_ICONS[reminder.subjectType] ?? "bell.fill"}
            size={20}
            tintColor={theme.colors.primary}
          />
        )}
      </View>

      <View style={styles.content}>
        <Text
          style={[styles.rowTitle, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.meta,
            {
              color: overdue ? theme.colors.error : theme.colors.textSecondary,
            },
          ]}
          numberOfLines={1}
        >
          {dateSubtitle}
        </Text>
      </View>

      <NorboPressable
        scale="row"
        haptic="medium"
        onPress={() => complete()}
        disabled={isPending}
        style={[
          styles.completeBtn,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
            opacity: isPending ? 0.5 : 1,
          },
        ]}
      >
        <IconSymbol
          name="checkmark"
          size={16}
          tintColor={theme.colors.textSecondary}
        />
      </NorboPressable>
    </NorboPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    overflow: "hidden",
    ...theme.card,
  },
  overdueBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: { flex: 1, gap: 2 },
  rowTitle: { ...theme.typography.subhead, fontWeight: "600" },
  meta: { ...theme.typography.caption },
  completeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: theme.hairline,
  },
}));
