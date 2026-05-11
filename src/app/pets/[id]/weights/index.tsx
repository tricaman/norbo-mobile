import { queryClient } from "@/app/_layout";
import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useMutation } from "@/hooks/useMutation";
import { useWeightHistory, type WeightRecord } from "@/hooks/useWeightHistory";
import { petEventsApi } from "@/services/pet-events.api";
import { petsApi } from "@/services/pets.api";
import { formatWeight } from "@/utils/weight";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

export default function PetWeightsScreen() {
  const { id: petId } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dateLocale = i18n.language.startsWith("it") ? itLocale : enUS;

  const petQuery = useQuery({
    queryKey: ["pets", petId],
    queryFn: () => petsApi.get(petId).then((r) => r.data),
    enabled: !!petId,
  });
  const category = petQuery.data?.category;

  const {
    records,
    latest,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
  } = useWeightHistory(petId);

  const { mutate: deleteRecord } = useMutation({
    mutationFn: (eventId: string) => petEventsApi.delete(petId, eventId),
    showSuccessToast: true,
    successMessage: t("petWeights.deleteConfirmOk"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pet-events", petId] });
    },
  });

  const confirmDelete = useCallback(
    (eventId: string) => {
      Alert.alert(
        t("petWeights.deleteConfirmTitle"),
        t("petWeights.deleteConfirmMessage"),
        [
          { text: t("petWeights.deleteConfirmCancel"), style: "cancel" },
          {
            text: t("petWeights.deleteConfirmOk"),
            style: "destructive",
            onPress: () => deleteRecord(eventId),
          },
        ],
      );
    },
    [deleteRecord, t],
  );

  const renderItem = useCallback(
    ({ item }: { item: WeightRecord }) => (
      <NorboPressable
        style={[
          styles.row,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
        scale="row"
        haptic="light"
        onLongPress={() => confirmDelete(item.event.id)}
      >
        <View style={styles.rowMain}>
          <Text style={[styles.rowValue, { color: theme.colors.textPrimary }]}>
            {formatWeight(item.weightMg, { category })}
          </Text>
          <Text
            style={[styles.rowDate, { color: theme.colors.textTertiary }]}
          >
            {format(parseISO(item.occurredAt), "d MMMM yyyy", {
              locale: dateLocale,
            })}
          </Text>
        </View>
        {item.notes ? (
          <Text
            style={[styles.rowNotes, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.notes}
          </Text>
        ) : null}
      </NorboPressable>
    ),
    [category, confirmDelete, dateLocale, theme],
  );

  const isEmpty = !isPending && records.length === 0;

  return (
    <Screen>
      <ScreenHeader title={t("petWeights.title")} />

      {isPending ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.root}>
          {latest ? (
            <View
              style={[
                styles.heroCard,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text
                style={[styles.heroLabel, { color: theme.colors.textTertiary }]}
              >
                {t("petWeights.statLatest").toUpperCase()}
              </Text>
              <Text
                style={[styles.heroValue, { color: theme.colors.textPrimary }]}
              >
                {formatWeight(latest.weightMg, { category })}
              </Text>
              <Text
                style={[styles.heroDate, { color: theme.colors.textTertiary }]}
              >
                {format(parseISO(latest.occurredAt), "d MMMM yyyy", {
                  locale: dateLocale,
                })}
              </Text>
            </View>
          ) : null}

          <FlatList
            data={records}
            keyExtractor={(r) => r.event.id}
            renderItem={renderItem}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
            }}
            onEndReachedThreshold={0.4}
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom + 80 },
              isEmpty && styles.centeredContent,
            ]}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <IconSymbol
                  name="scalemass"
                  size={32}
                  tintColor={theme.colors.textTertiary}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {t("petWeights.empty")}
                </Text>
                <NorboPressable
                  style={[
                    styles.cta,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  haptic="medium"
                  onPress={() =>
                    router.push(`/pets/${petId}/weights/new` as never)
                  }
                >
                  <Text
                    style={[
                      styles.ctaLabel,
                      { color: theme.colors.textOnPrimary },
                    ]}
                  >
                    {t("petWeights.addCta")}
                  </Text>
                </NorboPressable>
              </View>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footer}>
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                </View>
              ) : null
            }
          />

          {!isEmpty ? (
            <NorboPressable
              style={[styles.fab, { backgroundColor: theme.colors.primary }]}
              haptic="medium"
              onPress={() => router.push(`/pets/${petId}/weights/new` as never)}
            >
              <IconSymbol
                name="plus"
                size={22}
                tintColor={theme.colors.textOnPrimary}
              />
            </NorboPressable>
          ) : null}
        </View>
      )}
    </Screen>
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
  heroCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing["2xl"],
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    alignItems: "center",
    gap: 4,
  },
  heroLabel: {
    ...theme.typography.caption,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  heroValue: {
    ...theme.typography.title1,
    fontWeight: "700",
  },
  heroDate: {
    ...theme.typography.footnote,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
  },
  row: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: theme.hairline,
    gap: 4,
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  rowValue: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
  rowDate: {
    ...theme.typography.footnote,
  },
  rowNotes: {
    ...theme.typography.caption,
  },
  emptyState: {
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing["3xl"],
  },
  emptyText: {
    ...theme.typography.footnote,
    textAlign: "center",
  },
  cta: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing["2xl"],
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
  },
  ctaLabel: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
  footer: {
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
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
