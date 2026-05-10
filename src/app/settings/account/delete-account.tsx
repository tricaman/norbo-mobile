import { NorboPressable } from "@/components/CustomPressable";
import { Description } from "@/components/ui/Description";
import { FormCard } from "@/components/ui/FormCard";
import { FormInput } from "@/components/ui/FormInput";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "@/hooks/useForm";
import { useMutation } from "@/hooks/useMutation";
import { FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, Text } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { z } from "zod";

const deleteSchema = z.object({
  email: z.string().email(),
});

type DeleteFormValues = z.infer<typeof deleteSchema>;

export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const { deleteAccount } = useAuth();

  const form = useForm<DeleteFormValues>({
    schema: deleteSchema,
    defaultValues: { email: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: DeleteFormValues) => {
      await deleteAccount(values.email);
    },
    showErrorToast: false,
    triggerHaptics: false,
    onError: (error) => {
      const message =
        error.response?.data?.message ?? t("deleteAccount.mismatch");
      form.setError("email", { message });
    },
  });

  const handleConfirm = form.handleSubmit((values) => mutate(values));

  return (
    <Screen>
      <ScreenHeader title={t("deleteAccount.title")} />

      <FormProvider {...form}>
        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Description style={styles.warning}>
            {t("deleteAccount.warning")}
          </Description>

          <FormCard label={t("deleteAccount.label")}>
            <FormInput<DeleteFormValues>
              name="email"
              placeholder={t("deleteAccount.placeholder")}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => void handleConfirm()}
            />
          </FormCard>

          <NorboPressable
            style={[
              styles.deleteBtn,
              {
                backgroundColor: theme.colors.errorSoft,
                borderColor: theme.colors.errorBorder,
              },
              isPending && styles.deleteBtnDisabled,
            ]}
            disabled={isPending}
            haptic="error"
            onPress={() => void handleConfirm()}
          >
            <Text style={[styles.deleteBtnText, { color: theme.colors.error }]}>
              {t("deleteAccount.confirm")}
            </Text>
          </NorboPressable>
        </KeyboardAvoidingView>
      </FormProvider>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing["3xl"],
    gap: theme.spacing.md,
  },
  warning: {
    color: theme.colors.error,
  },
  deleteBtn: {
    marginTop: theme.spacing.xl,
    borderWidth: theme.hairline,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
  },
  deleteBtnDisabled: {
    opacity: 0.5,
  },
  deleteBtnText: {
    ...theme.typography.subhead,
    textTransform: "lowercase",
  },
}));
