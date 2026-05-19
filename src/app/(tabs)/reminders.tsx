import {
  CrossPetEventRow,
  isEventOverdue,
} from "@/components/reminders/CrossPetEventRow";
import {
  ReminderFilterChips,
  type ReminderFilter,
} from "@/components/reminders/ReminderFilterChips";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { PageTitle } from "@/components/ui/PageTitle";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Screen } from "@/components/ui/Screen";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { petEventsApi } from "@/services/pet-events.api";
import { petsApi } from "@/services/pets.api";
import type { PetEvent } from "@/types/pet-event.types";
import type { Pet } from "@/types/pet.types";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, isToday, parseISO, startOfDay } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, SectionList, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface ReminderSection {
  key: string;
  title: string;
  data: PetEvent[];
}

export default function RemindersTabScreen() {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const dateLocale = i18n.language.startsWith("it") ? itLocale : enUS;

  const [filter, setFilter] = React.useState<ReminderFilter>("all");

  const remindersQuery = useQuery({
    queryKey: ["reminders"],
    queryFn: () => petEventsApi.listReminders().then((r) => r.data),
  });
  const petsQuery = useQuery({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
  });

  const events = remindersQuery.data ?? [];
  const pets = petsQuery.data ?? [];
  const petsById = React.useMemo(() => {
    const map = new Map<string, Pet>();
    for (const p of pets) map.set(p.id, p);
    return map;
  }, [pets]);

  const todayCount = events.filter(
    (e) => e.scheduledFor && isToday(parseISO(e.scheduledFor)),
  ).length;
  const overdueCount = events.filter(isEventOverdue).length;

  const summary = (() => {
    const parts: string[] = [];
    if (todayCount > 0) {
      parts.push(t("reminders.countSummaryToday", { count: todayCount }));
    }
    if (overdueCount > 0) {
      parts.push(t("reminders.countSummaryOverdue", { count: overdueCount }));
    }
    return parts.length === 0
      ? t("reminders.summaryEmpty")
      : parts.join(t("reminders.summarySeparator"));
  })();

  const sections = React.useMemo<ReminderSection[]>(() => {
    if (events.length === 0) return [];

    const now = new Date();
    const today = startOfDay(now);
    const in7 = addDays(today, 7);

    if (filter === "today") {
      const data = events.filter(
        (e) => e.scheduledFor && isToday(parseISO(e.scheduledFor)),
      );
      return data.length > 0
        ? [
            {
              key: "today",
              title: t("reminders.sectionToday", {
                date: format(today, "d MMM", { locale: dateLocale }),
              }),
              data,
            },
          ]
        : [];
    }

    if (filter === "next7") {
      const data = events.filter((e) => {
        if (!e.scheduledFor) return false;
        const d = parseISO(e.scheduledFor);
        return d >= today && d < in7;
      });
      return data.length > 0
        ? [{ key: "next7", title: t("reminders.sectionThisWeek"), data }]
        : [];
    }

    if (filter === "overdue") {
      const data = events.filter(isEventOverdue);
      return data.length > 0
        ? [{ key: "overdue", title: t("reminders.sectionOverdue"), data }]
        : [];
    }

    // "all" filter — group into overdue / today / this week / later
    const overdue: PetEvent[] = [];
    const todayItems: PetEvent[] = [];
    const week: PetEvent[] = [];
    const later: PetEvent[] = [];

    for (const e of events) {
      if (!e.scheduledFor) continue;
      const d = parseISO(e.scheduledFor);
      if (isEventOverdue(e)) overdue.push(e);
      else if (isToday(d)) todayItems.push(e);
      else if (d < in7) week.push(e);
      else later.push(e);
    }

    const out: ReminderSection[] = [];
    if (overdue.length > 0) {
      out.push({
        key: "overdue",
        title: t("reminders.sectionOverdue"),
        data: overdue,
      });
    }
    if (todayItems.length > 0) {
      out.push({
        key: "today",
        title: t("reminders.sectionToday", {
          date: format(today, "d MMM", { locale: dateLocale }),
        }),
        data: todayItems,
      });
    }
    if (week.length > 0) {
      out.push({
        key: "week",
        title: t("reminders.sectionThisWeek"),
        data: week,
      });
    }
    if (later.length > 0) {
      out.push({
        key: "later",
        title: t("reminders.sectionLater"),
        data: later,
      });
    }
    return out;
  }, [events, filter, t, dateLocale]);

  const filterOptions: { value: ReminderFilter; label: string }[] = [
    { value: "all", label: t("reminders.filterAll") },
    { value: "today", label: t("reminders.filterToday") },
    { value: "next7", label: t("reminders.filterNext7") },
    { value: "overdue", label: t("reminders.filterOverdue") },
  ];

  return (
    <Screen edges={["top"]}>
      <QueryBoundary query={remindersQuery} isEmpty={() => false}>
        {(_data, { refetch, isFetching }) => (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderSectionHeader={({ section }) => (
              <Text
                style={[
                  styles.sectionHeader,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {section.title}
              </Text>
            )}
            renderItem={({ item }) => {
              const pet = petsById.get(item.petId);
              if (!pet) return null;
              return (
                <View style={styles.rowWrap}>
                  <CrossPetEventRow
                    event={item}
                    pet={pet}
                    overdue={isEventOverdue(item)}
                    onPress={() => router.push(`/pets/${item.petId}`)}
                  />
                </View>
              );
            }}
            ListHeaderComponent={
              <View style={styles.headerWrap}>
                <PageTitle title={t("reminders.title")} subtitle={summary} />
                <View style={styles.chipsWrap}>
                  <ReminderFilterChips
                    value={filter}
                    onChange={setFilter}
                    options={filterOptions}
                  />
                </View>
              </View>
            }
            ListEmptyComponent={
              <View
                style={[
                  styles.empty,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: `${theme.colors.primary}22` },
                  ]}
                >
                  <IconSymbol
                    name="bell"
                    size={26}
                    tintColor={theme.colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {t("reminders.emptyTitle")}
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {t("reminders.emptySubtitle")}
                </Text>
              </View>
            }
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  listContent: {
    paddingBottom: SCREEN_BOTTOM_PADDING,
    flexGrow: 1,
  },
  headerWrap: {
    gap: theme.spacing.xs,
  },
  chipsWrap: {
    marginTop: theme.spacing.md,
  },
  sectionHeader: {
    ...theme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  rowWrap: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  empty: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    alignItems: "center",
    paddingVertical: theme.spacing["2xl"],
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    gap: theme.spacing.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.xs,
  },
  emptyTitle: {
    ...theme.typography.subhead,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    ...theme.typography.caption,
    textAlign: "center",
  },
}));
