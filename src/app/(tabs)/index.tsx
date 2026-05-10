import { NorboPressable } from "@/components/CustomPressable";
import { PetsEmptyHero } from "@/components/pets/PetsEmptyHero";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ListSeparator } from "@/components/ui/ListSeparator";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { TabScreen } from "@/components/ui/TabScreen";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { petsApi } from "@/services/pets.api";
import type { Pet } from "@/types/pet.types";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

export default function PetsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useUnistyles();

  const query = useQuery({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
  });

  return (
    <TabScreen
      title={t("pets.title")}
      right={
        <NorboPressable
          style={styles.addBtn}
          scale="row"
          haptic="medium"
          onPress={() => router.push("/pets/new")}
        >
          <IconSymbol
            name="plus.circle.fill"
            size={26}
            tintColor={theme.colors.primary}
          />
        </NorboPressable>
      }
    >
      <QueryBoundary query={query} isEmpty={() => false}>
        {(pets, { refetch, isFetching }) => (
          <FlatList
            data={pets}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <PetRow
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
            ItemSeparatorComponent={ListSeparator}
            contentContainerStyle={styles.list}
            onRefresh={refetch}
            refreshing={isFetching}
          />
        )}
      </QueryBoundary>
    </TabScreen>
  );
}

function PetRow({ pet, onPress }: { pet: Pet; onPress: () => void }) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  return (
    <NorboPressable
      style={styles.row}
      scale="row"
      haptic="light"
      onPress={onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: theme.colors.surface }]}>
        <IconSymbol
          name="pawprint.fill"
          size={20}
          tintColor={theme.colors.primary}
        />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowName}>{pet.name}</Text>
        <Text style={styles.rowMeta}>
          {t(`petForm.categories.${pet.category}`)}
          {pet.speciesLabelFreetext ? ` · ${pet.speciesLabelFreetext}` : ""}
        </Text>
      </View>
      <IconSymbol
        name="chevron.right"
        size={16}
        tintColor={theme.colors.textTertiary}
      />
    </NorboPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  addBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flexGrow: 1,
    paddingTop: theme.spacing.md,
    paddingBottom: SCREEN_BOTTOM_PADDING,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing["3xl"],
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
  },
  rowMeta: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
}));
