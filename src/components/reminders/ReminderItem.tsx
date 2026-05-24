import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { springs } from "@/hooks/useSpring";
import type { Reminder } from "@/types/reminder.types";
import { ReminderStatus, ReminderSubjectType } from "@/types/reminder.types";
import type { HapticWeight } from "@/utils/haptics";
import { formatDistanceToNowStrict, isPast, parseISO } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import React from "react";
import { Alert, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const SWIPE_THRESHOLD = -60;
const ACTION_WIDTH = 64;
const TOTAL_ACTIONS = 4;

const SUBJECT_ICONS: Record<ReminderSubjectType, string> = {
  [ReminderSubjectType.HEALTH_EVENT]: "bell.fill",
  [ReminderSubjectType.MAINTENANCE]:  "wrench",
  [ReminderSubjectType.CONSUMABLE]:   "cart.fill",
  [ReminderSubjectType.ADMIN]:        "doc.text",
  [ReminderSubjectType.MILESTONE]:    "flag.fill",
  [ReminderSubjectType.CUSTOM]:       "note.text",
};

interface SwipeActionProps {
  icon: string;
  label: string;
  tint: string;
  haptic: HapticWeight;
  onPress: () => void;
  disabled?: boolean;
}

function SwipeAction({ icon, label, tint, haptic, onPress, disabled = false }: SwipeActionProps) {
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
  return reminder.status === ReminderStatus.PENDING && isPast(parseISO(reminder.dueAt));
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

  const borderColor = isOverdue
    ? theme.colors.error
    : isSnoozed
      ? theme.colors.warning
      : theme.colors.border;

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
          onPress={() => { close(); onDone(reminder); }}
        />
        <SwipeAction
          icon="moon.zzz.fill"
          label={t("reminders.actions.snooze")}
          tint={theme.colors.warning}
          haptic="warning"
          disabled={!canTransition}
          onPress={() => { close(); onSnooze(reminder); }}
        />
        <SwipeAction
          icon="pencil"
          label={t("reminders.actions.edit")}
          tint={theme.colors.info}
          haptic="light"
          onPress={() => { close(); onEdit(reminder); }}
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
            { backgroundColor: theme.colors.surface, borderColor },
          ]}
        >
          <NorboPressable
            style={styles.rowPressable}
            scale="row"
            haptic="light"
            onPress={() => onPress(reminder)}
          >
            {isOverdue && (
              <View style={[styles.overdueBar, { backgroundColor: theme.colors.error }]} />
            )}

            <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>
              <IconSymbol
                name={SUBJECT_ICONS[reminder.subjectType] ?? "bell"}
                size={20}
                tintColor={iconTint}
              />
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
                    isOverdue && styles.metaUnderline,
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
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    overflow: "hidden",
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
  overdueBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
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
  metaUnderline: {
    textDecorationLine: "underline",
  },
}));
