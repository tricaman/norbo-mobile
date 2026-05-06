import { Description } from "@/components/ui/Description";
import { FormCard } from "@/components/ui/FormCard";
import { FormInput } from "@/components/ui/FormInput";
import { SaveHeaderAction } from "@/components/ui/SaveHeaderAction";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useForm } from "@/hooks/useForm";
import { useMutation } from "@/hooks/useMutation";
import { usersApi } from "@/services/users.api";
import { useAuthStore } from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { z } from "zod";

const nameSchema = (
  t: (key: "nameScreen.minLength" | "nameScreen.maxLength") => string,
) =>
  z.object({
    name: z
      .string()
      .min(1, t("nameScreen.minLength"))
      .max(50, t("nameScreen.maxLength")),
  });

type NameFormValues = z.infer<ReturnType<typeof nameSchema>>;

export default function NameScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const form = useForm<NameFormValues>({
    schema: nameSchema(t),
    defaultValues: { name: user?.name ?? "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: NameFormValues) => {
      const { data } = await usersApi.updateProfile({
        name: values.name.trim(),
      });
      return data;
    },
    onSuccess: (profile) => {
      if (user) setUser({ ...user, name: profile.name ?? user.name });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      router.back();
    },
    onError: (error) => {
      form.setError("name", {
        message: error.response?.data?.message ?? t("common.failedToSave"),
      });
    },
  });

  const handleSave = form.handleSubmit((values) => mutate(values));

  return (
    <Screen>
      <ScreenHeader
        title={t("nameScreen.title")}
        right={
          <SaveHeaderAction
            onPress={() => void handleSave()}
            disabled={isPending}
          />
        }
      />

      <FormProvider {...form}>
        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <FormCard label={t("nameScreen.label")}>
            <FormInput<NameFormValues>
              name="name"
              placeholder={t("nameScreen.placeholder")}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => void handleSave()}
            />
          </FormCard>

          <Description>{t("nameScreen.description")}</Description>
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
}));
