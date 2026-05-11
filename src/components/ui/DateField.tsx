import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  StyleSheet,
  UnistylesRuntime,
  useUnistyles,
} from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import DateTimePicker, {
  DateTimePickerAndroid,
  type AndroidNativeProps,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";

interface DateFieldProps {
  /** Currently selected date (or `null` for unset). */
  value: Date | null;
  /** Called whenever the user picks a date (never with `null`). */
  onChange: (date: Date) => void;
  /** Latest selectable date. Defaults to today. */
  maximumDate?: Date;
  /** Earliest selectable date. */
  minimumDate?: Date;
  /** Visible text when no date is selected. */
  placeholder?: string;
  /** Style override for the container. */
  style?: StyleProp<ViewStyle>;
}

/**
 * DateField — full-width, themed date input.
 *
 * Both platforms render the same pressable trigger row (formatted date
 * text + calendar icon). On iOS, tapping opens a bottom-sheet modal
 * with a spinner DateTimePicker and Done/Cancel actions. On Android,
 * the imperative `DateTimePickerAndroid.open()` API is used.
 *
 * The component owns no value persistence — callers store the `Date`
 * (or convert to ISO string) themselves.
 */
export function DateField({
  value,
  onChange,
  maximumDate,
  minimumDate,
  placeholder,
  style,
}: DateFieldProps) {
  const { i18n, t } = useTranslation();
  const { theme } = useUnistyles();
  const [modalVisible, setModalVisible] = useState(false);
  const [draft, setDraft] = useState<Date | null>(null);

  const locale = i18n.language?.startsWith("it") ? itLocale : enUS;
  const fallback = useMemo(() => maximumDate ?? new Date(), [maximumDate]);

  const displayText = value
    ? format(value, "PPP", { locale })
    : (placeholder ?? "");

  function handleNativeChange(_event: DateTimePickerEvent, date?: Date) {
    if (date) setDraft(date);
  }

  function handleDone() {
    if (draft) onChange(draft);
    setModalVisible(false);
    setDraft(null);
  }

  function handleCancel() {
    setModalVisible(false);
    setDraft(null);
  }

  function openPicker() {
    if (Platform.OS === "ios") {
      setDraft(value ?? fallback);
      setModalVisible(true);
      return;
    }
    const params: AndroidNativeProps = {
      mode: "date",
      value: value ?? fallback,
      maximumDate,
      minimumDate,
      onChange: (_event, date) => {
        if (date) onChange(date);
      },
    };
    DateTimePickerAndroid.open(params);
  }

  return (
    <>
      <NorboPressable
        scale="card"
        haptic="light"
        onPress={openPicker}
        style={[styles.trigger, style]}
      >
        <Text
          style={[
            styles.triggerText,
            !value && { color: theme.colors.textTertiary },
          ]}
        >
          {displayText}
        </Text>
        <IconSymbol
          name="calendar"
          size={18}
          tintColor={value ? theme.colors.primary : theme.colors.textTertiary}
        />
      </NorboPressable>

      {Platform.OS === "ios" && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <NorboPressable
                  scale="row"
                  haptic="light"
                  onPress={handleCancel}
                  style={styles.sheetAction}
                >
                  <Text style={[styles.sheetActionText, styles.cancelText]}>
                    {t("common.cancel")}
                  </Text>
                </NorboPressable>
                <NorboPressable
                  scale="row"
                  haptic="medium"
                  onPress={handleDone}
                  style={styles.sheetAction}
                >
                  <Text style={[styles.sheetActionText, styles.doneText]}>
                    {t("common.done")}
                  </Text>
                </NorboPressable>
              </View>
              <DateTimePicker
                mode="date"
                display="spinner"
                value={draft ?? fallback}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                onChange={handleNativeChange}
                locale={i18n.language}
                accentColor={theme.colors.primary}
                themeVariant={
                  UnistylesRuntime.themeName === "dark" ? "dark" : "light"
                }
                style={styles.spinner}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
  },
  triggerText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingBottom: theme.spacing["3xl"],
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: theme.hairline,
    borderBottomColor: theme.colors.border,
  },
  sheetAction: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  sheetActionText: {
    ...theme.typography.subhead,
  },
  cancelText: {
    color: theme.colors.textSecondary,
  },
  doneText: {
    color: theme.colors.primary,
  },
  spinner: {
    width: "100%",
  },
}));
