import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface PetWizardButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** "primary" → green pill (default). "ghost" → text only. */
  variant?: "primary" | "ghost";
  /** Append a chevron-right glyph after the label. */
  trailingChevron?: boolean;
}

/**
 * PetWizardButton — sticky bottom CTA used at the end of every wizard
 * step. The primary variant is a fully-rounded pill matching the
 * mockup ("Continua >", "Vai al profilo di Buddy"). Ghost variant is
 * used for the secondary "Aggiungi un altro pet" link in the confirm
 * screen.
 */
export function PetWizardButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  trailingChevron = false,
}: PetWizardButtonProps) {
  const { theme } = useUnistyles();

  if (variant === "ghost") {
    return (
      <NorboPressable
        scale="text"
        haptic="light"
        disabled={disabled || loading}
        onPress={onPress}
        style={styles.ghostBtn}
      >
        <Text style={styles.ghostText}>{label}</Text>
      </NorboPressable>
    );
  }

  return (
    <NorboPressable
      scale="cta"
      haptic="medium"
      disabled={disabled || loading}
      onPress={onPress}
      style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
    >
      <View style={styles.primaryInner}>
        {loading ? (
          <ActivityIndicator color={theme.colors.textOnPrimary} />
        ) : (
          <>
            <Text style={styles.primaryLabel}>{label}</Text>
            {trailingChevron ? (
              <IconSymbol
                name="chevron.right"
                size={16}
                tintColor={theme.colors.textOnPrimary}
              />
            ) : null}
          </>
        )}
      </View>
    </NorboPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
  },
  primaryBtnDisabled: {
    opacity: 0.55,
  },
  primaryInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing["2xl"],
  },
  primaryLabel: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.textOnPrimary,
    textTransform: "lowercase",
  },
  ghostBtn: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostText: {
    ...theme.typography.subhead,
    color: theme.colors.textSecondary,
  },
}));
