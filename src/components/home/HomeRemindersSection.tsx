import { NorboPressable } from "@/components/CustomPressable";
import { HomeReminderRow } from "@/components/reminders/HomeReminderRow";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { remindersApi } from "@/services/reminders.api";
import type { Pet } from "@/types/pet.types";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const HOMEPAGE_LIMIT = 5;

interface HomeRemindersSectionProps {
  /** Active pets, used to resolve avatars. May be empty. */
  pets: Pet[];
}

/**
 * Home "what to do" section.
 *
 * Backed by Reminders, not PetEvents: Reminder is the canonical aggregate
 * (it owns push notifications, snooze and recurrence, and is what push deep
 * links point at), and it also covers petless reminders that pet events
 * cannot express. This is what removes the old duplication where a scheduled
 * vaccination showed up both here and in the reminders list.
 *
 * The `pending` filter is PENDING-only with a 30-day floor on overdue items,
 * so this preview can't be permanently occupied by long-forgotten reminders.
 */
export function HomeRemindersSection({ pets }: HomeRemindersSectionProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();

  // `["reminders", …]` prefix on purpose: every reminder mutation in the app
  // invalidates the bare prefix, so this stays fresh for free.
  const query = useQuery({
    queryKey: ["reminders", { filter: "pending" as const }],
    queryFn: () =>
      remindersApi
        .list({ filter: "pending", limit: HOMEPAGE_LIMIT })
        .then((r) => r.data),
  });

  const reminders = query.data?.rows ?? [];
  const petsById = React.useMemo(() => {
    const map = new Map<string, Pet>();
    for (const p of pets) map.set(p.id, p);
    return map;
  }, [pets]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {t("upcomingEvents.title")}
        </Text>
        <NorboPressable
          style={styles.viewAll}
          scale="row"
          haptic="light"
          onPress={() => router.push("/reminders")}
        >
          <Text
            style={[styles.viewAllText, { color: theme.colors.textSecondary }]}
          >
            {t("common.viewAll")}
          </Text>
          <IconSymbol
            name="chevron.right"
            size={12}
            tintColor={theme.colors.textSecondary}
          />
        </NorboPressable>
      </View>

      {query.isLoading ? null : reminders.length === 0 ? (
        <HomeRemindersEmpty />
      ) : (
        <View style={styles.list}>
          {reminders.map((reminder) => (
            <HomeReminderRow
              key={reminder.id}
              reminder={reminder}
              // Undefined for petless reminders and for pets that are
              // deceased/deleted — the row renders regardless, so the list
              // never silently shows fewer than it fetched.
              pet={reminder.petId ? petsById.get(reminder.petId) : undefined}
              onPress={() => router.push(`/reminder/${reminder.id}` as never)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function HomeRemindersEmpty() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  return (
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
        <IconSymbol name="bell" size={26} tintColor={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
        {t("upcomingEvents.emptyTitle")}
      </Text>
      <Text
        style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}
      >
        {t("upcomingEvents.emptySubtitle")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing["3xl"],
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { ...theme.typography.title2, fontWeight: "700" },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingLeft: theme.spacing.sm,
  },
  viewAllText: {
    ...theme.typography.footnote,
    textTransform: "lowercase",
  },
  list: { gap: theme.spacing.sm },
  empty: {
    alignItems: "center",
    paddingVertical: theme.spacing["2xl"],
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
    ...theme.card,
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
  emptySubtitle: { ...theme.typography.caption, textAlign: "center" },
}));
