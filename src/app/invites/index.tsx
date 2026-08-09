import { NorboPressable } from "@/components/CustomPressable";
import { Description } from "@/components/ui/Description";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormCard } from "@/components/ui/FormCard";
import { FormInput } from "@/components/ui/FormInput";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useForm } from "@/hooks/useForm";
import { useInvites, useSendInvite } from "@/hooks/useInvites";
import type { InviteView } from "@/types/invite.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FormProvider } from "react-hook-form";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { z } from "zod";

/** Public landing page — the link a friend receives. */
const INVITE_LINK = "https://www.norbo.app";

const inviteSchema = (t: (key: "invites.invalidEmail") => string) =>
  z.object({ email: z.string().trim().email(t("invites.invalidEmail")) });

type InviteFormValues = z.infer<ReturnType<typeof inviteSchema>>;

function InviteRow({ invite }: { invite: InviteView }) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const accepted = invite.status === "ACCEPTED";

  return (
    <View style={styles.row}>
      <MaterialCommunityIcons
        name={accepted ? "check-circle" : "clock-outline"}
        size={18}
        color={accepted ? theme.colors.primary : theme.colors.textTertiary}
      />
      <Text style={styles.rowEmail} numberOfLines={1}>
        {invite.email}
      </Text>
      <Text
        style={[
          styles.rowStatus,
          {
            color: accepted ? theme.colors.primary : theme.colors.textTertiary,
          },
        ]}
      >
        {t(accepted ? "invites.statusAccepted" : "invites.statusPending")}
      </Text>
    </View>
  );
}

/**
 * Invite screen: claim an address, then share the link yourself.
 *
 * Nothing is emailed from the server on purpose — a message from a friend in
 * their own words gets opened, one from an unknown app does not. Recording the
 * address is what makes the referral attributable at signup; the share sheet is
 * what actually delivers it.
 */
export default function InvitesScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const query = useInvites();
  const sendInvite = useSendInvite();

  const form = useForm<InviteFormValues>({
    schema: inviteSchema(t),
    defaultValues: { email: "" },
  });

  const share = async (email?: string) => {
    await Share.share({
      message: t("invites.shareMessage", { link: INVITE_LINK }),
      ...(Platform.OS === "ios" ? { url: INVITE_LINK } : {}),
    });
    if (email) form.reset({ email: "" });
  };

  const handleSend = form.handleSubmit((values) => {
    sendInvite.mutate(
      { email: values.email.trim() },
      // The share sheet opens only once the address is recorded, so a friend
      // never receives a link that cannot be attributed back.
      { onSuccess: () => void share(values.email) },
    );
  });

  return (
    <Screen>
      <ScreenHeader title={t("invites.title")} variant="simple" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Description>{t("invites.intro")}</Description>

          <FormProvider {...form}>
            <FormCard label={t("invites.formLabel")}>
              <FormInput<InviteFormValues>
                name="email"
                placeholder={t("invites.emailPlaceholder")}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                onSubmitEditing={() => void handleSend()}
              />
            </FormCard>
          </FormProvider>

          <NorboPressable
            scale="cta"
            haptic="medium"
            disabled={sendInvite.isPending}
            onPress={() => void handleSend()}
            style={[styles.cta, { backgroundColor: theme.colors.primary }]}
          >
            <MaterialCommunityIcons
              name="share-variant"
              size={16}
              color={theme.colors.textOnPrimary}
            />
            <Text
              style={[styles.ctaLabel, { color: theme.colors.textOnPrimary }]}
            >
              {t("invites.sendAndShare")}
            </Text>
          </NorboPressable>

          <QueryBoundary
            query={query}
            EmptyComponent={() => (
              <EmptyState
                title={t("invites.empty")}
                subtitle={t("invites.emptySubtitle")}
              />
            )}
            isEmpty={(data) => data.invites.length === 0}
          >
            {(data) => (
              <View style={styles.list}>
                <SectionLabel>
                  {t("invites.sent", { count: data.invites.length })}
                </SectionLabel>
                <FormCard>
                  {data.invites.map((invite) => (
                    <InviteRow key={invite.id} invite={invite} />
                  ))}
                </FormCard>
                <Text style={styles.footnote}>
                  {t("invites.remainingToday", {
                    count: data.remainingToday,
                  })}
                </Text>
              </View>
            )}
          </QueryBoundary>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing.md,
    paddingBottom: SCREEN_BOTTOM_PADDING,
    gap: theme.spacing.md,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.md,
  },
  ctaLabel: {
    ...theme.typography.subhead,
    fontWeight: "700",
  },
  list: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  rowEmail: {
    ...theme.typography.footnote,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  rowStatus: {
    ...theme.monoTypography.captionMono,
    textTransform: "uppercase",
  },
  footnote: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
}));
