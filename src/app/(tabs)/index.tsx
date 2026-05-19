import { HomeGreeting } from "@/components/home/HomeGreeting";
import { UpcomingEventsSection } from "@/components/home/UpcomingEventsSection";
import { PetCard } from "@/components/pets/PetCard";
import { PetsEmptyHero } from "@/components/pets/PetsEmptyHero";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Screen } from "@/components/ui/Screen";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { petsApi } from "@/services/pets.api";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

import {
  FlatList,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * Breakpoints for grid layout based on screen width.
 */
const BREAKPOINTS = {
  PORTRAIT: 768, // 2 columns
  LANDSCAPE: 1024, // 4 columns
};

const PET_CAROUSEL_LIMIT = 4;

function getNumColumns(width: number): number {
  if (width >= BREAKPOINTS.LANDSCAPE) return 4;
  if (width >= BREAKPOINTS.PORTRAIT) return 2;
  return 2;
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useUnistyles();
  const { width: windowWidth } = useWindowDimensions();

  const numColumns = getNumColumns(windowWidth);
  const cardWidth =
    (windowWidth - theme.spacing.lg * 2 - theme.spacing.sm * (numColumns - 1)) /
    numColumns;

  const query = useQuery({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
  });

  return (
    <Screen edges={["top"]}>
      <QueryBoundary query={query} isEmpty={() => false}>
        {(pets, { refetch, isFetching }) => (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} />
            }
            contentContainerStyle={[
              styles.scrollContent,
              pets.length === 0 && styles.scrollContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
          >
            <HomeGreeting onPressAdd={() => router.push("/pets/new")} />

            {pets.length === 0 ? (
              <PetsEmptyHero
                title={t("pets.emptyTitle")}
                subtitle={t("pets.emptySubtitle")}
                ctaLabel={t("pets.emptyCta")}
                onPressCta={() => router.push("/pets/new")}
              />
            ) : (
              <>
                <FlatList
                  horizontal
                  data={pets.slice(0, PET_CAROUSEL_LIMIT)}
                  keyExtractor={(p) => p.id}
                  contentContainerStyle={styles.grid}
                  ItemSeparatorComponent={() => (
                    <View style={{ width: theme.spacing.sm }} />
                  )}
                  renderItem={({ item }) => (
                    <PetCard
                      pet={item}
                      onPress={() => router.push(`/pets/${item.id}`)}
                      style={{ width: cardWidth }}
                    />
                  )}
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={cardWidth + theme.spacing.sm}
                  decelerationRate="fast"
                />
                <UpcomingEventsSection
                  pets={pets}
                  onPressEvent={(event) => router.push(`/pets/${event.petId}`)}
                />
              </>
            )}
          </ScrollView>
        )}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scrollContent: {
    paddingBottom: SCREEN_BOTTOM_PADDING,
  },
  scrollContentEmpty: {
    flexGrow: 1,
  },
  grid: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
}));
