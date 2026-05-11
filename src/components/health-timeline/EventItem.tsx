import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import type { PetEvent } from "@/types/pet-event.types";
import { PetEventStatus, PetEventType } from "@/types/pet-event.types";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import React from "react";
import { Alert, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import { springs } from "@/hooks/useSpring";

const SWIPE_THRESHOLD = -60;
const ACTION_WIDTH = 64;

interface SwipeActionProps {
  icon: string;
  label: string;
  tint: string;
  haptic: "light" | "medium" | "error";
  onPress: () => void;
}

function SwipeAction({ icon, label, tint, haptic, onPress }: SwipeActionProps) {
  return (
    <NorboPressable style={styles.actionBtn} haptic={haptic} onPress={onPress}>
      <View style={[styles.actionCircle, { backgroundColor: `${tint}22` }]}>
        <IconSymbol name={icon} size={18} tintColor={tint} />
      </View>
      <Text style={[styles.actionLabel, { color: tint }]} numberOfLines={1}>
        {label}
      </Text>
    </NorboPressable>
  );
}

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
};

interface EventItemProps {
  event: PetEvent;
  onPress: (event: PetEvent) => void;
  onComplete?: (event: PetEvent) => void;
  onCancel?: (event: PetEvent) => void;
  onEdit: (event: PetEvent) => void;
  onDelete: (event: PetEvent) => void;
}

export function EventItem({
  event,
  onPress,
  onComplete,
  onCancel,
  onEdit,
  onDelete,
}: EventItemProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const translateX = useSharedValue(0);
  const dateLocale = i18n.language.startsWith("it") ? itLocale : enUS;

  const isScheduled = event.status === PetEventStatus.SCHEDULED;
  const isCancelled = event.status === PetEventStatus.CANCELLED;

  const actionCount = isScheduled ? 4 : 2;
  const totalActionWidth = actionCount * ACTION_WIDTH;

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      const clamped = Math.max(-totalActionWidth, Math.min(0, e.translationX));
      translateX.value = clamped;
    })
    .onEnd((e) => {
      if (e.translationX < SWIPE_THRESHOLD) {
        translateX.value = withSpring(-totalActionWidth, springs.snappy);
      } else {
        translateX.value = withSpring(0, springs.snappy);
      }
    })
    .runOnJS(false);

  const animatedRow = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  function close() {
    translateX.value = withSpring(0, springs.snappy);
  }

  function handleDelete() {
    close();
    Alert.alert(
      t("petDetail.timeline.deleteConfirmTitle"),
      t("petDetail.timeline.deleteConfirmMessage"),
      [
        {
          text: t("petDetail.timeline.deleteConfirmCancel"),
          style: "cancel",
        },
        {
          text: t("petDetail.timeline.deleteConfirmOk"),
          style: "destructive",
          onPress: () => onDelete(event),
        },
      ],
    );
  }

  const dateStr = event.occurredAt ?? event.scheduledFor;
  const date = dateStr ? parseISO(dateStr) : null;
  const dateLabel = date
    ? format(date, "d MMM yyyy", { locale: dateLocale })
    : "";

  const typeLabel = t(
    `petDetail.timeline.types.${event.type}` as "petDetail.timeline.types.VACCINATION",
  );

  const subtitle = event.description?.trim()
    ? `${event.description.trim()} · ${dateLabel}`
    : `${typeLabel} · ${dateLabel}`;

  const scheduledPill =
    isScheduled && date
      ? isToday(date)
        ? t("petDetail.timeline.pillToday")
        : isTomorrow(date)
          ? t("petDetail.timeline.pillTomorrow")
          : dateLabel
      : null;

  return (
    <View style={styles.container}>
      {/* Action buttons revealed on swipe */}
      <View style={[styles.actions, { width: totalActionWidth }]}>
        {isScheduled && onComplete ? (
          <SwipeAction
            icon="checkmark"
            label={t("petDetail.timeline.actionComplete")}
            tint={theme.colors.success}
            haptic="medium"
            onPress={() => {
              close();
              onComplete(event);
            }}
          />
        ) : null}
        {isScheduled && onCancel ? (
          <SwipeAction
            icon="xmark"
            label={t("petDetail.timeline.actionCancel")}
            tint={theme.colors.warning}
            haptic="light"
            onPress={() => {
              close();
              onCancel(event);
            }}
          />
        ) : null}
        <SwipeAction
          icon="pencil"
          label={t("petDetail.timeline.actionEdit")}
          tint={theme.colors.info}
          haptic="light"
          onPress={() => {
            close();
            onEdit(event);
          }}
        />
        <SwipeAction
          icon="trash.fill"
          label={t("petDetail.timeline.actionDelete")}
          tint={theme.colors.error}
          haptic="error"
          onPress={handleDelete}
        />
      </View>

      {/* Swipeable row */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            animatedRow,
            styles.row,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <NorboPressable
            style={styles.rowPressable}
            scale="row"
            haptic="light"
            onPress={() => onPress(event)}
          >
            {/* Type icon */}
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: isCancelled
                    ? theme.colors.border
                    : `${theme.colors.primary}22`,
                },
              ]}
            >
              <IconSymbol
                name={EVENT_ICONS[event.type] ?? "calendar"}
                size={20}
                tintColor={
                  isCancelled ? theme.colors.textTertiary : theme.colors.primary
                }
              />
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text
                style={[
                  styles.title,
                  {
                    color: isCancelled
                      ? theme.colors.textTertiary
                      : theme.colors.textPrimary,
                  },
                ]}
                numberOfLines={1}
              >
                {event.title}
              </Text>
              <Text
                style={[styles.meta, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            </View>

            {/* Trailing badge: pill for scheduled, cost for past */}
            {scheduledPill ? (
              <View
                style={[
                  styles.pill,
                  { backgroundColor: `${theme.colors.primary}22` },
                ]}
              >
                <Text
                  style={[styles.pillLabel, { color: theme.colors.primary }]}
                  numberOfLines={1}
                >
                  {scheduledPill}
                </Text>
              </View>
            ) : event.cost != null ? (
              <Text
                style={[styles.cost, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {`€${event.cost}`}
              </Text>
            ) : null}
          </NorboPressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    overflow: "hidden",
  },
  actions: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: theme.spacing.md,
  },
  actionBtn: {
    width: ACTION_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    ...theme.typography.caption,
    fontWeight: "600",
  },
  row: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  rowPressable: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
  meta: {
    ...theme.typography.caption,
  },
  pill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    flexShrink: 0,
  },
  pillLabel: {
    ...theme.typography.caption,
    fontWeight: "600",
  },
  cost: {
    ...theme.typography.caption,
    fontWeight: "600",
    flexShrink: 0,
  },
}));
