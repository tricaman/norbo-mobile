import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import type { PetEvent } from "@/types/pet-event.types";
import { PetEventStatus, PetEventType } from "@/types/pet-event.types";
import { format, parseISO } from "date-fns";
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
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const translateX = useSharedValue(0);

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
  const dateLabel = dateStr ? format(parseISO(dateStr), "d MMM yyyy") : "";

  const typeLabel = t(
    `petDetail.timeline.types.${event.type}` as "petDetail.timeline.types.VACCINATION",
  );

  return (
    <View style={styles.container}>
      {/* Action buttons revealed on swipe */}
      <View style={[styles.actions, { width: totalActionWidth }]}>
        {isScheduled && onComplete ? (
          <NorboPressable
            style={[
              styles.actionBtn,
              { backgroundColor: theme.colors.success },
            ]}
            haptic="medium"
            onPress={() => {
              close();
              onComplete(event);
            }}
          >
            <IconSymbol
              name="checkmark"
              size={18}
              tintColor={theme.colors.textOnPrimary}
            />
            <Text
              style={[
                styles.actionLabel,
                { color: theme.colors.textOnPrimary },
              ]}
            >
              {t("petDetail.timeline.actionComplete")}
            </Text>
          </NorboPressable>
        ) : null}
        {isScheduled && onCancel ? (
          <NorboPressable
            style={[
              styles.actionBtn,
              { backgroundColor: theme.colors.warning },
            ]}
            haptic="light"
            onPress={() => {
              close();
              onCancel(event);
            }}
          >
            <IconSymbol
              name="xmark"
              size={18}
              tintColor={theme.colors.textOnPrimary}
            />
            <Text
              style={[
                styles.actionLabel,
                { color: theme.colors.textOnPrimary },
              ]}
            >
              {t("petDetail.timeline.actionCancel")}
            </Text>
          </NorboPressable>
        ) : null}
        <NorboPressable
          style={[styles.actionBtn, { backgroundColor: theme.colors.info }]}
          haptic="light"
          onPress={() => {
            close();
            onEdit(event);
          }}
        >
          <IconSymbol
            name="pencil"
            size={18}
            tintColor={theme.colors.textOnPrimary}
          />
          <Text
            style={[styles.actionLabel, { color: theme.colors.textOnPrimary }]}
          >
            {t("petDetail.timeline.actionEdit")}
          </Text>
        </NorboPressable>
        <NorboPressable
          style={[styles.actionBtn, { backgroundColor: theme.colors.error }]}
          haptic="error"
          onPress={handleDelete}
        >
          <IconSymbol
            name="trash.fill"
            size={18}
            tintColor={theme.colors.textOnPrimary}
          />
          <Text
            style={[styles.actionLabel, { color: theme.colors.textOnPrimary }]}
          >
            {t("petDetail.timeline.actionDelete")}
          </Text>
        </NorboPressable>
      </View>

      {/* Swipeable row */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            animatedRow,
            styles.row,
            { backgroundColor: theme.colors.surface },
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
                size={18}
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
                {typeLabel}
                {dateLabel ? ` · ${dateLabel}` : ""}
              </Text>
            </View>

            {/* Status badge */}
            {isScheduled ? (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${theme.colors.warning}22` },
                ]}
              >
                <Text
                  style={[styles.statusLabel, { color: theme.colors.warning }]}
                >
                  {t("petDetail.timeline.sectionUpcoming").toUpperCase()}
                </Text>
              </View>
            ) : null}

            <IconSymbol
              name="chevron.right"
              size={13}
              tintColor={theme.colors.textTertiary}
            />
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
  },
  actionBtn: {
    width: ACTION_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  row: {
    borderBottomWidth: theme.hairline,
    borderBottomColor: theme.colors.border,
  },
  rowPressable: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
    fontWeight: "500",
  },
  meta: {
    ...theme.typography.caption,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
}));
