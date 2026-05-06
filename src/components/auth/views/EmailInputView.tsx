import { DitPressable } from "@/components/DitPressable";
import { GoBackButton } from "@/components/GoBackButton";
import { FormInput } from "@/components/ui/FormInput";
import { useForm } from "@/hooks/useForm";
import { useMutation } from "@/hooks/useMutation";
import { authApi } from "@/services/auth.api";
import type { AuthScreen } from "@/types/auth.types";
import { extractError } from "@/utils/extract-error";
import React from "react";
import { FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { z } from "zod";

const emailSchema = (t: (key: "auth.emailError") => string) =>
  z.object({
    email: z.string().email(t("auth.emailError")),
  });

type FormValues = z.infer<ReturnType<typeof emailSchema>>;

interface Props {
  onNavigate: (screen: AuthScreen, email?: string) => void;
}

export function EmailInputView({ onNavigate }: Props) {
  const { t } = useTranslation();
  const form = useForm<FormValues>({ schema: emailSchema(t) });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      authApi.sendOtp({ email: values.email, type: "sign-in" }),
    showErrorToast: false,
    onSuccess: (_, variables) => {
      onNavigate("otp-verify", variables.email);
    },
    onError: (error) => {
      form.setError("email", { message: extractError(error) });
    },
  });

  return (
    <FormProvider {...form}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.root}>
          <GoBackButton onPress={() => onNavigate("landing")} />

          <Text style={styles.title}>{t("auth.emailTitle")}</Text>
          <Text style={styles.subtitle}>{t("auth.emailSubtitle")}</Text>

          <View style={styles.form}>
            <FormInput<FormValues>
              name="email"
              placeholder={t("auth.emailPlaceholder")}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              autoFocus
            />

            <DitPressable
              style={[styles.primaryBtn, isPending && styles.btnDisabled]}
              scale="cta"
              haptic="medium"
              disabled={isPending}
              onPress={form.handleSubmit((values) => mutate(values))}
            >
              <Text style={styles.primaryBtnText}>
                {isPending ? "..." : t("common.continue")}
              </Text>
            </DitPressable>
          </View>
        </View>
      </SafeAreaView>
    </FormProvider>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  root: {
    flex: 1,
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing.xl,
  },
  title: {
    ...theme.typography.title1,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing["3xl"],
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing["3xl"],
  },
  form: { gap: theme.spacing.md },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.lg,
    alignItems: "center" as const,
    marginTop: theme.spacing.sm,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    ...theme.typography.subhead,
    color: theme.colors.textOnPrimary,
  },
}));
