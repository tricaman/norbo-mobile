import { DitPressable } from "@/components/DitPressable";
import type { SocialProvider } from "@/types/auth.types";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { SOCIAL_ICON } from "./SocialIcons";

interface Props {
  provider: SocialProvider;
  onPress: () => void;
}

export function SocialButton({ provider, onPress }: Props) {
  const { t } = useTranslation();
  const Icon = SOCIAL_ICON[provider];
  return (
    <DitPressable
      style={styles.btn}
      scale="cta"
      haptic="light"
      onPress={onPress}
    >
      <Icon size={20} />
      <Text style={styles.label}>{t("auth.continueWith", { provider })}</Text>
    </DitPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  btn: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 0.5,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: theme.spacing.md,
  },
  label: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
  },
}));
