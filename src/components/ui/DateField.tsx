import React, { useMemo } from "react";
import {
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
 * DateField — compact, themed date input.
 *
 * iOS uses the native `display="compact"` picker (a small chip that
 * pops a wheel/calendar on tap, never expanding the full calendar
 * inline). Android uses the imperative `DateTimePickerAndroid.open()`
 * API behind a themed pressable, since the declarative component
 * lacks an inline form factor on Android.
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
  const { i18n } = useTranslation();
  const { theme } = useUnistyles();

  const locale = i18n.language?.startsWith("it") ? itLocale : enUS;
  const fallback = useMemo(() => maximumDate ?? new Date(), [maximumDate]);

  function handleNativeChange(event: DateTimePickerEvent, date?: Date) {
    if (event.type !== "set" || !date) return;
    onChange(date);
  }

  if (Platform.OS === "ios") {
    return (
      <View style={[styles.row, style]}>
        <DateTimePicker
          mode="date"
          display="compact"
          value={value ?? fallback}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={handleNativeChange}
          locale={i18n.language}
          accentColor={theme.colors.primary}
          themeVariant={
            UnistylesRuntime.themeName === "dark" ? "dark" : "light"
          }
        />
      </View>
    );
  }

  function openAndroid() {
    const params: AndroidNativeProps = {
      mode: "date",
      value: value ?? fallback,
      maximumDate,
      minimumDate,
      onChange: handleNativeChange,
    };
    DateTimePickerAndroid.open(params);
  }

  return (
    <NorboPressable
      scale="card"
      haptic="light"
      onPress={openAndroid}
      style={[styles.androidTrigger, style]}
    >
      <Text
        style={[
          styles.androidTriggerText,
          !value && { color: theme.colors.textTertiary },
        ]}
      >
        {value ? format(value, "PPP", { locale }) : (placeholder ?? "")}
      </Text>
    </NorboPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  androidTrigger: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    alignItems: "center",
  },
  androidTriggerText: {
    ...theme.typography.title2,
    color: theme.colors.textPrimary,
  },
}));
