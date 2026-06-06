import React from "react";
import { Text, TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface ToolNumberFieldProps {
  label: string;
  value: number | null;
  onChangeValue: (value: number | null) => void;
  /** Unit suffix shown inside the field (e.g. "kg", "cm"). */
  unit?: string;
  placeholder?: string;
}

/**
 * ToolNumberField — labelled numeric input with an optional unit suffix.
 * Mirrors `FormInput`'s look (pill surface, footnote primary label) but is
 * standalone (no react-hook-form), so tools can drive it from local state and
 * emit changes as a `number | null`.
 */
export function ToolNumberField({
  label,
  value,
  onChangeValue,
  unit,
  placeholder,
}: ToolNumberFieldProps): React.JSX.Element {
  const { theme } = useUnistyles();
  const [text, setText] = React.useState(value != null ? String(value) : "");

  // Re-seed local text only when `value` changes to something the current
  // text does not already represent (avoids clobbering "1." mid-typing).
  React.useEffect(() => {
    const current = text.trim() === "" ? null : Number(text.replace(",", "."));
    if (current !== value) setText(value != null ? String(value) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (next: string): void => {
    setText(next);
    const normalized = next.replace(",", ".").trim();
    if (normalized === "") {
      onChangeValue(null);
      return;
    }
    const parsed = Number(normalized);
    onChangeValue(Number.isFinite(parsed) ? parsed : null);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          style={styles.input}
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.typography.footnote,
    color: theme.colors.primary,
    textTransform: "lowercase",
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
  },
  input: {
    ...theme.typography.body,
    flex: 1,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.md,
  },
  unit: {
    ...theme.monoTypography.captionMono,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
}));
