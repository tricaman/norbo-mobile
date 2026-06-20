import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useBooklet } from "@/hooks/useBooklet";
import { petEventsApi } from "@/services/pet-events.api";
import type { PetBooklet } from "@/types/booklet.types";
import type { PetEvent } from "@/types/pet-event.types";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, RefreshControl, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface PetBookletTabProps {
  petId: string;
  onScroll?: (event: any) => void;
  contentInsetTop?: number;
}

// Display order of identity fields. Labels live under
// `petDetail.booklet.fields.*`; the cast keeps `t()` type-checking happy
// while iterating dynamically (same idiom as the event type labels).
const IDENTITY_FIELDS: { key: keyof PetBooklet; labelKey: string }[] = [
  { key: "microchipNumber", labelKey: "petDetail.booklet.fields.microchipNumber" },
  {
    key: "microchipImplantedAt",
    labelKey: "petDetail.booklet.fields.microchipImplantedAt",
  },
  {
    key: "microchipLocation",
    labelKey: "petDetail.booklet.fields.microchipLocation",
  },
  { key: "tattooNumber", labelKey: "petDetail.booklet.fields.tattooNumber" },
  { key: "passportNumber", labelKey: "petDetail.booklet.fields.passportNumber" },
  {
    key: "registrationNumber",
    labelKey: "petDetail.booklet.fields.registrationNumber",
  },
  { key: "pedigreeNumber", labelKey: "petDetail.booklet.fields.pedigreeNumber" },
  { key: "vetName", labelKey: "petDetail.booklet.fields.vetName" },
  { key: "vetClinic", labelKey: "petDetail.booklet.fields.vetClinic" },
  { key: "vetPhone", labelKey: "petDetail.booklet.fields.vetPhone" },
  {
    key: "insuranceProvider",
    labelKey: "petDetail.booklet.fields.insuranceProvider",
  },
  {
    key: "insurancePolicyNumber",
    labelKey: "petDetail.booklet.fields.insurancePolicyNumber",
  },
  { key: "bloodType", labelKey: "petDetail.booklet.fields.bloodType" },
  { key: "allergies", labelKey: "petDetail.booklet.fields.allergies" },
  {
    key: "chronicConditions",
    labelKey: "petDetail.booklet.fields.chronicConditions",
  },
  { key: "notes", labelKey: "petDetail.booklet.fields.notes" },
];

function buildIdentityRows(
  booklet: PetBooklet | null,
): { labelKey: string; value: string }[] {
  if (!booklet) return [];
  return IDENTITY_FIELDS.flatMap((f) => {
    let value: string | null;
    if (f.key === "allergies") {
      value = booklet.allergies.length > 0 ? booklet.allergies.join(", ") : null;
    } else if (f.key === "microchipImplantedAt") {
      value = booklet.microchipImplantedAt
        ? new Date(booklet.microchipImplantedAt).toLocaleDateString()
        : null;
    } else {
      value = (booklet[f.key] as string | null) ?? null;
    }
    return value ? [{ labelKey: f.labelKey, value }] : [];
  });
}

export function PetBookletTab({
  petId,
  onScroll,
  contentInsetTop = 0,
}: PetBookletTabProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const bookletQuery = useBooklet(petId);

  const registryQuery = useQuery({
    queryKey: ["pet-events", petId, "booklet"],
    queryFn: () =>
      petEventsApi
        .list(petId, { inBooklet: true, limit: 100 })
        .then((r) => r.data),
    enabled: !!petId,
  });

  const isPending = bookletQuery.isPending || registryQuery.isPending;
  const isRefetching =
    bookletQuery.isRefetching || registryQuery.isRefetching;

  const refetch = () => {
    void bookletQuery.refetch();
    void registryQuery.refetch();
  };

  const booklet = bookletQuery.data ?? null;
  const identityRows = buildIdentityRows(booklet);
  const events: PetEvent[] = registryQuery.data
    ? [...registryQuery.data.upcoming, ...registryQuery.data.past]
    : [];

  if (isPending) {
    return (
      <View style={[styles.centered, { paddingTop: contentInsetTop }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: contentInsetTop + theme.spacing.lg,
            paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom + 80,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            progressViewOffset={contentInsetTop}
          />
        }
      >
        {/* ── Identity card ─────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text
            style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}
          >
            {t("petDetail.booklet.identitySection")}
          </Text>
          <NorboPressable
            scale="row"
            haptic="light"
            onPress={() =>
              router.push(`/pets/${petId}/booklet/edit` as never)
            }
          >
            <Text style={[styles.editLink, { color: theme.colors.primary }]}>
              {identityRows.length > 0
                ? t("petDetail.booklet.edit")
                : t("petDetail.booklet.fill")}
            </Text>
          </NorboPressable>
        </View>

        {identityRows.length > 0 ? (
          <View
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
          >
            {identityRows.map((row, i) => (
              <View key={row.labelKey}>
                {i > 0 && (
                  <View
                    style={[
                      styles.rowDivider,
                      { backgroundColor: theme.colors.border },
                    ]}
                  />
                )}
                <View style={styles.fieldRow}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    {t(
                      row.labelKey as "petDetail.booklet.fields.microchipNumber",
                    )}
                  </Text>
                  <Text
                    style={[
                      styles.fieldValue,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {row.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <NorboPressable
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            scale="row"
            haptic="light"
            onPress={() => router.push(`/pets/${petId}/booklet/edit` as never)}
          >
            <View style={styles.emptyIdentity}>
              <IconSymbol
                name="doc.text"
                size={24}
                tintColor={theme.colors.textTertiary}
              />
              <Text
                style={[
                  styles.emptyIdentityText,
                  { color: theme.colors.textTertiary },
                ]}
              >
                {t("petDetail.booklet.identityEmpty")}
              </Text>
            </View>
          </NorboPressable>
        )}

        {/* ── Health registry (tagged events) ───────── */}
        <View style={[styles.sectionHeader, styles.registryHeader]}>
          <Text
            style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}
          >
            {t("petDetail.booklet.registrySection")}
          </Text>
        </View>

        {events.length > 0 ? (
          events.map((event) => {
            const date = event.occurredAt ?? event.scheduledFor;
            return (
              <NorboPressable
                key={event.id}
                style={[
                  styles.eventRow,
                  { backgroundColor: theme.colors.surface },
                ]}
                scale="row"
                haptic="light"
                onPress={() =>
                  router.push(
                    `/pets/${petId}/events/${event.id}` as never,
                  )
                }
              >
                <View style={styles.eventText}>
                  <Text
                    style={[
                      styles.eventTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                    numberOfLines={1}
                  >
                    {event.title}
                  </Text>
                  <Text
                    style={[
                      styles.eventMeta,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    {t(
                      `petDetail.timeline.types.${event.type}` as "petDetail.timeline.types.VACCINATION",
                    )}
                    {date ? ` · ${new Date(date).toLocaleDateString()}` : ""}
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={14}
                  tintColor={theme.colors.textTertiary}
                />
              </NorboPressable>
            );
          })
        ) : (
          <Text
            style={[styles.registryEmpty, { color: theme.colors.textTertiary }]}
          >
            {t("petDetail.booklet.registryEmpty")}
          </Text>
        )}
      </Animated.ScrollView>

      {/* FAB — add a (medical) event that can be tagged for the booklet */}
      <NorboPressable
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        haptic="medium"
        onPress={() => router.push(`/pets/${petId}/events/new` as never)}
      >
        <IconSymbol name="plus" size={22} tintColor={theme.colors.textOnPrimary} />
      </NorboPressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  registryHeader: {
    paddingTop: theme.spacing.xl,
  },
  sectionLabel: {
    ...theme.typography.caption,
  },
  editLink: {
    ...theme.typography.footnote,
    fontWeight: "600",
  },
  card: {
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    ...theme.card,
  },
  fieldRow: {
    paddingVertical: theme.spacing.md,
    gap: 2,
  },
  fieldLabel: {
    ...theme.typography.caption,
  },
  fieldValue: {
    ...theme.typography.body,
  },
  rowDivider: {
    height: theme.hairline,
  },
  emptyIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  emptyIdentityText: {
    ...theme.typography.footnote,
    flex: 1,
  },
  eventRow: {
    marginHorizontal: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    ...theme.card,
  },
  eventText: {
    flex: 1,
    gap: 2,
  },
  eventTitle: {
    ...theme.typography.body,
    fontWeight: "600",
  },
  eventMeta: {
    ...theme.typography.footnote,
  },
  registryEmpty: {
    ...theme.typography.footnote,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
}));
