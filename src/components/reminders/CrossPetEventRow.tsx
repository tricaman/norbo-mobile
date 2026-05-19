import { NorboPressable } from "@/components/CustomPressable";
import { CATEGORY_META } from "@/components/pets/wizard/category-meta";
import { PetCategoryIcon } from "@/components/pets/wizard/PetCategoryIcon";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useMutation } from "@/hooks/useMutation";
import { petEventsApi } from "@/services/pet-events.api";
import { PetEventType, type PetEvent } from "@/types/pet-event.types";
import type { Pet } from "@/types/pet.types";
import { useQueryClient } from "@tanstack/react-query";
import { format, isPast, isToday, isTomorrow, parseISO } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import { Image } from "expo-image";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const EVENT_ICONS: Record<PetEventType, string> = {
  [PetEventType.VACCINATION]: "syringe",
  [PetEventType.VET_VISIT]: "stethoscope",
  [PetEventType.PARASITE_TREATMENT]: "shield.checkerboard",
  [PetEventType.GROOMING]: "scissors",
  [PetEventType.WEIGHT_RECORD]: "scalemass",
  [PetEventType.WATER_PARAMETERS]: "drop.fill",
  [PetEventType.WATER_CHANGE]: "arrow.triangle.2.circlepath",
  [PetEventType.MOLT]: "leaf.fill",
  [PetEventType.FEEDING_LOG]: "fork.knife",
  [PetEventType.MEDICATION]: "pill.fill",
  [PetEventType.PHOTO]: "camera.fill",
  [PetEventType.NOTE]: "note.text",
  [PetEventType.INSURANCE]: "shield.fill",
};

interface CrossPetEventRowProps {
  event: PetEvent;
  pet: Pet;
  onPress: () => void;
  /**
   * Whether the event is overdue (scheduledFor in the past). Renders a
   * subtle red leading bar to draw attention.
   */
  overdue?: boolean;
}

/**
 * CrossPetEventRow — single row used by the home upcoming section and
 * the dedicated Reminder tab. Shows pet avatar (with event-type badge),
 * "Pet · Title" line, a date subtitle, and a "mark as done" button on
 * the trailing edge that completes the event and invalidates the
 * relevant TanStack Query caches.
 */
export function CrossPetEventRow({
  event,
  pet,
  onPress,
  overdue = false,
}: CrossPetEventRowProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const queryClient = useQueryClient();
  const dateLocale = i18n.language.startsWith("it") ? itLocale : enUS;
  const meta = CATEGORY_META[pet.category];

  const { mutate: complete, isPending } = useMutation({
    mutationFn: () => petEventsApi.complete(event.petId, event.id),
    showErrorToast: true,
    triggerHaptics: true,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({
        queryKey: ["pet-events", event.petId],
      });
    },
  });

  const date = event.scheduledFor ? parseISO(event.scheduledFor) : null;
  const timeLabel = date ? format(date, "HH:mm", { locale: dateLocale }) : "";
  const dayLabel = (() => {
    if (!date) return "";
    if (isToday(date)) return t("petDetail.timeline.pillToday");
    if (isTomorrow(date)) return t("petDetail.timeline.pillTomorrow");
    return format(date, "d MMM", { locale: dateLocale });
  })();
  const dateSubtitle = date ? `${dayLabel} · ${timeLabel}` : "";

  const typeLabel = t(
    `petDetail.timeline.types.${event.type}` as "petDetail.timeline.types.VACCINATION",
  );

  return (
    <NorboPressable
      scale="row"
      haptic="light"
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderColor: overdue ? theme.colors.error : theme.colors.border,
        },
      ]}
    >
      {overdue ? (
        <View
          style={[styles.overdueBar, { backgroundColor: theme.colors.error }]}
        />
      ) : null}

      <View style={[styles.avatar, { backgroundColor: meta.tint }]}>
        {pet.photoUrl ? (
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
        )}
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <IconSymbol
            name={EVENT_ICONS[event.type] ?? "calendar"}
            size={10}
            tintColor={theme.colors.primary}
          />
        </View>
      </View>

      <View style={styles.content}>
        <Text
          style={[styles.rowTitle, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {pet.name} · {event.title || typeLabel}
        </Text>
        <View style={styles.metaRow}>
          <IconSymbol
            name="circle"
            size={11}
            tintColor={
              overdue ? theme.colors.error : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.meta,
              {
                color: overdue
                  ? theme.colors.error
                  : theme.colors.textSecondary,
              },
            ]}
            numberOfLines={1}
          >
            {dateSubtitle}
          </Text>
        </View>
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

/**
 * Helper exported for callers that already classify their items.
 */
export function isEventOverdue(event: PetEvent): boolean {
  if (!event.scheduledFor) return false;
  const d = parseISO(event.scheduledFor);
  return isPast(d) && !isToday(d);
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    overflow: "hidden",
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
  typeBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  meta: {
    ...theme.typography.caption,
  },
  completeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: theme.hairline,
  },
}));
