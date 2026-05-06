import React from "react";
import {
  Controller,
  useFormContext,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface FormInputProps<TFormValues extends FieldValues> extends Omit<
  TextInputProps,
  "value" | "onChangeText" | "onBlur" | "style"
> {
  name: Path<TFormValues>;
  label?: string;
  inputStyle?: TextInputProps["style"];
}

export function FormInput<TFormValues extends FieldValues>({
  name,
  label,
  inputStyle,
  ...inputProps
}: FormInputProps<TFormValues>) {
  const { control } = useFormContext<TFormValues>();
  const { theme } = useUnistyles();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <View style={styles.wrapper}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          <TextInput
            {...inputProps}
            value={field.value ?? ""}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholderTextColor={theme.colors.textTertiary}
            style={[styles.input, error ? styles.inputError : null, inputStyle]}
          />
          {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
        </View>
      )}
    />
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
  input: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    textTransform: "lowercase",
  },
  inputError: {
    color: theme.colors.error,
    borderColor: theme.colors.error,
  },
  errorText: {
    ...theme.typography.footnote,
    color: theme.colors.error,
  },
}));
