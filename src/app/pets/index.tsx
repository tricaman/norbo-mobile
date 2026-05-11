import { NorboPressable } from "@/components/CustomPressable";
import { PetCard } from "@/components/pets/PetCard";
import { PetsEmptyHero } from "@/components/pets/PetsEmptyHero";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { petsApi } from "@/services/pets.api";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export default function PetsListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useUnistyles();

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
      <ScreenHeader title={t("pets.title")} right={addButton} />
      <QueryBoundary query={query} isEmpty={() => false}>
        {(pets, { refetch, isFetching }) => (
          <FlatList
            data={pets}
            keyExtractor={(p) => p.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={({ item }) => (
              <PetCard
                pet={item}
                onPress={() => router.push(`/pets/${item.id}`)}
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
