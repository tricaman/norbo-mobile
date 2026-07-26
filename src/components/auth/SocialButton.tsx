import { NorboPressable } from "@/components/CustomPressable";
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
  // Provider names are proper nouns — capitalise them so the label reads
  // "…Google", "…Facebook", "…Microsoft" instead of the lowercase key.
  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
  return (
    <NorboPressable
      style={styles.btn}
      scale="cta"
      haptic="light"
      onPress={onPress}
    >
      <Icon size={20} />
      <Text style={styles.label}>
        {t("auth.continueWith", { provider: providerName })}
      </Text>
    </NorboPressable>
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
