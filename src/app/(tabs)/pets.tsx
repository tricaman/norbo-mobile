import { NorboPressable } from "@/components/CustomPressable";
import { PetCard } from "@/components/pets/PetCard";
import { PetsEmptyHero } from "@/components/pets/PetsEmptyHero";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { TabScreen } from "@/components/ui/TabScreen";
import { petsApi } from "@/services/pets.api";
import type { Pet } from "@/types/pet.types";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Text, View, useWindowDimensions } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const BREAKPOINTS = {
  PORTRAIT: 768,
  LANDSCAPE: 1024,
};

function getNumColumns(width: number): number {
  if (width >= BREAKPOINTS.LANDSCAPE) return 4;
  if (width >= BREAKPOINTS.PORTRAIT) return 2;
  return 2;
}

export default function PetsTabScreen() {
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

  const deceasedQuery = useQuery({
    queryKey: ["pets", "deceased"],
    queryFn: () => petsApi.listDeceased().then((r) => r.data),
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
    <TabScreen title={t("pets.title")} right={addButton} edges={["top"]}>
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
            ListFooterComponent={
              <MemorialSection
                pets={deceasedQuery.data ?? []}
                cardWidth={cardWidth}
                numColumns={numColumns}
              />
            }
            contentContainerStyle={styles.list}
            onRefresh={() => {
              refetch();
              deceasedQuery.refetch();
            }}
            refreshing={isFetching}
          />
        )}
      </QueryBoundary>
    </TabScreen>
  );
}

function MemorialSection({
  pets,
  cardWidth,
  numColumns,
}: {
  pets: Pet[];
  cardWidth: number;
  numColumns: number;
}) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  if (pets.length === 0) return null;

  return (
    <View style={styles.memorialSection}>
      <NorboPressable
        style={styles.memorialHeader}
        scale="row"
        haptic="light"
        onPress={() => setExpanded((v) => !v)}
      >
        <IconSymbol
          name="heart.fill"
          size={14}
          tintColor={theme.colors.textTertiary}
        />
        <Text
          style={[styles.memorialTitle, { color: theme.colors.textTertiary }]}
        >
          {t("pets.memorialSection")} — {pets.length}
        </Text>
        <IconSymbol
          name={expanded ? "chevron.up" : "chevron.down"}
          size={12}
          tintColor={theme.colors.textTertiary}
        />
      </NorboPressable>

      {expanded && (
        <View style={styles.memorialGrid}>
          {chunkArray(pets, numColumns).map((row, rowIdx) => (
            <View key={rowIdx} style={styles.columnWrapper}>
              {row.map((pet) => (
                <View key={pet.id} style={{ width: cardWidth, opacity: 0.7 }}>
                  <PetCard
                    pet={pet}
                    onPress={() => router.push(`/pets/${pet.id}`)}
                    style={{ width: cardWidth }}
                  />
                </View>
              ))}
              {row.length < numColumns &&
                Array.from({ length: numColumns - row.length }).map((_, i) => (
                  <View key={`spacer-${i}`} style={{ width: cardWidth }} />
                ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
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
    paddingBottom: theme.spacing.md,
  },
  columnWrapper: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  memorialSection: {
    marginTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  memorialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  memorialTitle: {
    ...theme.typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    flex: 1,
  },
  memorialGrid: {
    marginTop: theme.spacing.sm,
  },
}));
