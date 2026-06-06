import { CrossPetEventRow } from "@/components/reminders/CrossPetEventRow";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { petEventsApi } from "@/services/pet-events.api";
import { type PetEvent } from "@/types/pet-event.types";
import type { Pet } from "@/types/pet.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const HOMEPAGE_LIMIT = 5;

interface UpcomingEventsSectionProps {
  pets: Pet[];
  onPressEvent: (event: PetEvent) => void;
}

/**
 * UpcomingEventsSection — homepage feed of the user's next scheduled
 * pet events across every pet, ordered ascending. Empty state is a
 * friendly placeholder with a calm illustration. Each row exposes a
 * quick "mark as done" tap target on the right.
 */
export function UpcomingEventsSection({
  pets,
  onPressEvent,
}: UpcomingEventsSectionProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const query = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: () =>
      petEventsApi.listUpcoming({ limit: HOMEPAGE_LIMIT }).then((r) => r.data),
  });

  const events = query.data ?? [];
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
      </View>

      {query.isLoading ? null : events.length === 0 ? (
        <UpcomingEventsEmpty />
      ) : (
        <View style={styles.list}>
          {events.map((event) => {
            const pet = petsById.get(event.petId);
            if (!pet) return null;
            return (
              <CrossPetEventRow
                key={event.id}
                event={event}
                pet={pet}
                onPress={() => onPressEvent(event)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

function UpcomingEventsEmpty() {
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
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...theme.typography.title2,
    fontWeight: "700",
  },
  list: {
    gap: theme.spacing.sm,
  },
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
  emptySubtitle: {
    ...theme.typography.caption,
    textAlign: "center",
  },
}));
