import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useMutation } from "@/hooks/useMutation";
import { petEventsApi } from "@/services/pet-events.api";
import type { PetEvent } from "@/types/pet-event.types";
import { PetEventStatus } from "@/types/pet-event.types";
import { queryClient } from "@/app/_layout";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

export default function EventDetailScreen() {
  const { id: petId, eventId } = useLocalSearchParams<{
    id: string;
    eventId: string;
  }>();

  const query = useQuery({
    queryKey: ["pet-events", petId, eventId],
    queryFn: () => petEventsApi.get(petId, eventId).then((r) => r.data),
    enabled: !!petId && !!eventId,
  });

  return (
    <Screen>
      <QueryBoundary query={query}>
        {(event) => <EventDetail petId={petId} event={event} />}
      </QueryBoundary>
    </Screen>
  );
}

function EventDetail({ petId, event }: { petId: string; event: PetEvent }) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isScheduled = event.status === PetEventStatus.SCHEDULED;

  const { mutate: completeMutation } = useMutation({
    mutationFn: () => petEventsApi.complete(petId, event.id),
    showSuccessToast: true,
    successMessage: t("petDetail.timeline.completeSuccess"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pet-events", petId] });
      void queryClient.invalidateQueries({
        queryKey: ["pet-events", petId, event.id],
      });
      router.back();
    },
  });

  const { mutate: deleteMutation } = useMutation({
    mutationFn: () => petEventsApi.delete(petId, event.id),
    showSuccessToast: true,
    successMessage: t("petDetail.timeline.deleteSuccess"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pet-events", petId] });
      router.back();
    },
  });

  function confirmDelete() {
    Alert.alert(
      t("petDetail.timeline.deleteConfirmTitle"),
      t("petDetail.timeline.deleteConfirmMessage"),
      [
        {
          text: t("petDetail.timeline.deleteConfirmCancel"),
          style: "cancel",
        },
        {
          text: t("petDetail.timeline.deleteConfirmOk"),
          style: "destructive",
          onPress: () => deleteMutation(),
        },
      ],
    );
  }

  const typeLabel = t(
    `petDetail.timeline.types.${event.type}` as "petDetail.timeline.types.VACCINATION",
  );
  const dateStr = event.occurredAt ?? event.scheduledFor;
  const dateLabel = dateStr ? format(parseISO(dateStr), "d MMMM yyyy") : "";

  return (
    <>
      <ScreenHeader
        title={typeLabel}
        right={
          <NorboPressable
            haptic="light"
            onPress={() =>
              router.push(`/pets/${petId}/events/${event.id}/edit` as never)
            }
          >
            <IconSymbol
              name="pencil"
              size={18}
              tintColor={theme.colors.primary}
            />
          </NorboPressable>
        }
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom },
        ]}
      >
        {/* Header card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.cardRow}>
            <Text
              style={[styles.fieldLabel, { color: theme.colors.textTertiary }]}
            >
              {t("eventForm.details").toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {event.title}
          </Text>
          {dateLabel ? (
            <Text
              style={[styles.dateText, { color: theme.colors.textSecondary }]}
            >
              {dateLabel}
            </Text>
          ) : null}
          {event.description ? (
            <Text
              style={[
                styles.description,
                { color: theme.colors.textSecondary },
              ]}
            >
              {event.description}
            </Text>
          ) : null}
        </View>

        {/* Cost row */}
        {event.cost !== null ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[styles.fieldLabel, { color: theme.colors.textTertiary }]}
            >
              {t("eventForm.cost").toUpperCase()}
            </Text>
            <Text
              style={[styles.costText, { color: theme.colors.textPrimary }]}
            >
              {event.cost} {event.currency}
            </Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          {isScheduled ? (
            <NorboPressable
              style={[
                styles.actionBtn,
                { backgroundColor: theme.colors.primary },
              ]}
              haptic="medium"
              onPress={() => completeMutation()}
            >
              <IconSymbol
                name="checkmark.circle.fill"
                size={20}
                tintColor={theme.colors.textOnPrimary}
              />
              <Text
                style={[
                  styles.actionLabel,
                  { color: theme.colors.textOnPrimary },
                ]}
              >
                {t("petDetail.timeline.actionComplete")}
              </Text>
            </NorboPressable>
          ) : null}

          <NorboPressable
            style={[styles.actionBtn, { backgroundColor: theme.colors.error }]}
            haptic="error"
            onPress={confirmDelete}
          >
            <IconSymbol
              name="trash.fill"
              size={18}
              tintColor={theme.colors.textOnPrimary}
            />
            <Text
              style={[
                styles.actionLabel,
                { color: theme.colors.textOnPrimary },
              ]}
            >
              {t("petDetail.timeline.actionDelete")}
            </Text>
          </NorboPressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    flexGrow: 1,
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldLabel: {
    ...theme.typography.caption,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  title: {
    ...theme.typography.title2,
    fontWeight: "700",
  },
  dateText: {
    ...theme.typography.subhead,
  },
  description: {
    ...theme.typography.body,
    lineHeight: 22,
  },
  costText: {
    ...theme.typography.title2,
    fontWeight: "600",
  },
  actions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.pill,
  },
  actionLabel: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
}));
