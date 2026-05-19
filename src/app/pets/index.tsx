import { NorboPressable } from "@/components/CustomPressable";
import { PetCard } from "@/components/pets/PetCard";
import { PetsEmptyHero } from "@/components/pets/PetsEmptyHero";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { PageTitle } from "@/components/ui/PageTitle";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Screen } from "@/components/ui/Screen";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { petsApi } from "@/services/pets.api";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, useWindowDimensions } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * Breakpoints for grid layout based on screen width.
 */
const BREAKPOINTS = {
  PORTRAIT: 768, // 2 columns
  LANDSCAPE: 1024, // 4 columns
};

function getNumColumns(width: number): number {
  if (width >= BREAKPOINTS.LANDSCAPE) return 4;
  if (width >= BREAKPOINTS.PORTRAIT) return 2;
  return 2;
}

export default function PetsListScreen() {
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

  const addButton = (
    <NorboPressable
      style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
      scale="row"
      haptic="medium"
      onPress={() => router.push("/pets/new")}
    >
      <IconSymbol
        name="plus"
        size={16}
        tintColor={theme.colors.textOnPrimary}
      />
    </NorboPressable>
  );

  return (
    <Screen>
      <PageTitle title={t("pets.title")} right={addButton} />
      <QueryBoundary query={query} isEmpty={() => false}>
        {(pets, { refetch, isFetching }) => (
          <FlatList
            data={pets}
            keyExtractor={(p) => p.id}
            key={numColumns}
            numColumns={numColumns}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={({ item }) => (
              <PetCard
                pet={item}
                onPress={() => router.push(`/pets/${item.id}`)}
                style={{ width: cardWidth }}
              />
            )}
            ListEmptyComponent={
              <PetsEmptyHero
                title={t("pets.emptyTitle")}
                subtitle={t("pets.emptySubtitle")}
                ctaLabel={t("pets.emptyCta")}
                onPressCta={() => router.push("/pets/new")}
              />
            }
            contentContainerStyle={styles.list}
            onRefresh={refetch}
            refreshing={isFetching}
          />
        )}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flexGrow: 1,
    paddingTop: theme.spacing.md,
    paddingBottom: SCREEN_BOTTOM_PADDING,
  },
  columnWrapper: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
}));
