import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { springs } from "@/hooks/useSpring";
import type { Reminder } from "@/types/reminder.types";
import { ReminderStatus, ReminderSubjectType } from "@/types/reminder.types";
import type { HapticWeight } from "@/utils/haptics";
import { formatDistanceToNowStrict, isPast, parseISO } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const SWIPE_THRESHOLD = -60;
const ACTION_WIDTH = 64;
const TOTAL_ACTIONS = 4;

const SUBJECT_ICONS: Record<ReminderSubjectType, string> = {
  [ReminderSubjectType.HEALTH_EVENT]: "bell.fill",
  [ReminderSubjectType.MAINTENANCE]: "wrench",
  [ReminderSubjectType.CONSUMABLE]: "cart.fill",
  [ReminderSubjectType.ADMIN]: "doc.text",
  [ReminderSubjectType.MILESTONE]: "flag.fill",
  [ReminderSubjectType.CUSTOM]: "note.text",
};

interface SwipeActionProps {
  icon: string;
  label: string;
  tint: string;
  haptic: HapticWeight;
  onPress: () => void;
  disabled?: boolean;
}

function SwipeAction({
  icon,
  label,
  tint,
  haptic,
  onPress,
  disabled = false,
}: SwipeActionProps) {
  return (
    <NorboPressable
      style={[actionStyles.btn, { opacity: disabled ? 0.35 : 1 }]}
      haptic={haptic}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[actionStyles.circle, { backgroundColor: `${tint}22` }]}>
        <IconSymbol name={icon} size={18} tintColor={tint} />
      </View>
      <Text style={[actionStyles.label, { color: tint }]} numberOfLines={1}>
        {label}
      </Text>
    </NorboPressable>
  );
}

const actionStyles = StyleSheet.create((theme) => ({
  btn: {
    width: ACTION_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...theme.typography.caption,
    fontWeight: "600",
  },
}));

export function isReminderOverdue(reminder: Reminder): boolean {
  return (
    reminder.status === ReminderStatus.PENDING &&
    isPast(parseISO(reminder.dueAt))
  );
}

export interface ReminderItemProps {
  reminder: Reminder;
  onPress: (reminder: Reminder) => void;
  onDone: (reminder: Reminder) => void;
  onSnooze: (reminder: Reminder) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => void;
}

export function ReminderItem({
  reminder,
  onPress,
  onDone,
  onSnooze,
  onEdit,
  onDelete,
}: ReminderItemProps): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const translateX = useSharedValue(0);
  const dateLocale = i18n.language.startsWith("it") ? itLocale : enUS;

  const canTransition =
    reminder.status === ReminderStatus.PENDING ||
    reminder.status === ReminderStatus.SNOOZED;
  const isOverdue = isReminderOverdue(reminder);
  const isSnoozed = reminder.status === ReminderStatus.SNOOZED;
  const isDimmed =
    reminder.status === ReminderStatus.DONE ||
    reminder.status === ReminderStatus.CANCELLED;

  const totalActionWidth = TOTAL_ACTIONS * ACTION_WIDTH;

  // Overdue pulse animations
  const dotOpacity = useSharedValue(isOverdue ? 1 : 0);
  const dotScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOverdue) {
      dotOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      dotScale.value = withRepeat(
        withSequence(
          withTiming(1.6, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.08, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.02, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      );
    }
  }, [isOverdue, dotOpacity, dotScale, glowOpacity]);

  const animatedDotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

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

  function close(): void {
    translateX.value = withSpring(0, springs.snappy);
  }

  function handleDelete(): void {
    close();
    Alert.alert(
      t("reminders.deleteConfirmTitle"),
      t("reminders.deleteConfirmMessage"),
      [
        { text: t("reminders.deleteConfirmCancel"), style: "cancel" },
        {
          text: t("reminders.deleteConfirmOk"),
          style: "destructive",
          onPress: () => onDelete(reminder),
        },
      ],
    );
  }

  const relativeDate = formatDistanceToNowStrict(parseISO(reminder.dueAt), {
    locale: dateLocale,
    addSuffix: true,
  });

  const subjectLabel = t(
    `reminders.subject.${reminder.subjectType}` as "reminders.subject.HEALTH_EVENT",
  );

  const subtitle = `${relativeDate} · ${subjectLabel}`;

  const iconTint = isDimmed ? theme.colors.textTertiary : theme.colors.primary;
  const iconBg = isDimmed ? theme.colors.border : `${theme.colors.primary}22`;

  const titleColor = isDimmed
    ? theme.colors.textTertiary
    : theme.colors.textPrimary;

  const metaColor = isOverdue
    ? theme.colors.error
    : isDimmed
      ? theme.colors.textTertiary
      : theme.colors.textSecondary;

  return (
    <View style={styles.container}>
      <View style={[styles.actions, { width: totalActionWidth }]}>
        <SwipeAction
          icon="checkmark"
          label={t("reminders.actions.done")}
          tint={theme.colors.primary}
          haptic="success"
          disabled={!canTransition}
          onPress={() => {
            close();
            onDone(reminder);
          }}
        />
        <SwipeAction
          icon="moon.zzz.fill"
          label={t("reminders.actions.snooze")}
          tint={theme.colors.warning}
          haptic="warning"
          disabled={!canTransition}
          onPress={() => {
            close();
            onSnooze(reminder);
          }}
        />
        <SwipeAction
          icon="pencil"
          label={t("reminders.actions.edit")}
          tint={theme.colors.info}
          haptic="light"
          onPress={() => {
            close();
            onEdit(reminder);
          }}
        />
        <SwipeAction
          icon="trash.fill"
          label={t("reminders.actions.delete")}
          tint={theme.colors.error}
          haptic="error"
          onPress={handleDelete}
        />
      </View>

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
            onPress={() => onPress(reminder)}
          >
            {isOverdue && (
              <>
                <Animated.View
                  style={[
                    styles.overdueGlow,
                    { backgroundColor: theme.colors.error },
                    animatedGlowStyle,
                  ]}
                />
                <View
                  style={[
                    styles.overdueBar,
                    { backgroundColor: theme.colors.error },
                  ]}
                />
              </>
            )}

            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: isOverdue ? theme.colors.errorSoft : iconBg,
                },
              ]}
            >
              <IconSymbol
                name={SUBJECT_ICONS[reminder.subjectType] ?? "bell"}
                size={20}
                tintColor={isOverdue ? theme.colors.error : iconTint}
              />
              {isOverdue && (
                <View style={styles.dotContainer}>
                  <Animated.View
                    style={[
                      styles.dotPulse,
                      { backgroundColor: theme.colors.error },
                      animatedDotStyle,
                    ]}
                  />
                  <View
                    style={[
                      styles.dotSolid,
                      { backgroundColor: theme.colors.error },
                    ]}
                  />
                </View>
              )}
            </View>

            <View style={styles.content}>
              <Text
                style={[
                  styles.title,
                  { color: titleColor },
                  isSnoozed && styles.titleItalic,
                ]}
                numberOfLines={1}
              >
                {reminder.title}
              </Text>
              <View style={styles.metaRow}>
                {isSnoozed && (
                  <IconSymbol
                    name="moon.zzz"
                    size={11}
                    tintColor={theme.colors.warning}
                  />
                )}
                <Text
                  style={[
                    styles.meta,
                    { color: metaColor },
                    isOverdue && styles.metaOverdue,
                  ]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              </View>
            </View>
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
  row: {
    marginHorizontal: theme.spacing["3xl"],
    marginBottom: theme.spacing.sm,
    overflow: "hidden",
    ...theme.card,
  },
  rowPressable: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  overdueGlow: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  },
  overdueBar: {
    position: "absolute",
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dotContainer: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dotPulse: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotSolid: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...theme.typography.subhead,
    fontWeight: "500",
  },
  titleItalic: {
    fontStyle: "italic",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  meta: {
    ...theme.typography.caption,
    flexShrink: 1,
  },
  metaOverdue: {
    fontWeight: "600",
    letterSpacing: 0.2,
  },
}));
