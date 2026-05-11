import { NorboPressable } from "@/components/CustomPressable";
import { PetCard } from "@/components/pets/PetCard";
import { PetsEmptyHero } from "@/components/pets/PetsEmptyHero";
import { Avatar } from "@/components/ui/Avatar";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { TabScreen } from "@/components/ui/TabScreen";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { petsApi } from "@/services/pets.api";
import { useAuthStore } from "@/stores/auth.store";
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
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] ?? null;

  const query = useQuery({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
  });

  const listHeader = (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <Avatar name={user?.name} source={user?.photoUrl} size="sm" />
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
      </View>

      {firstName ? (
        <Text style={[styles.greeting, { color: theme.colors.textPrimary }]}>
          {`Ciao, ${firstName}`}
        </Text>
      ) : null}

      <Text
        style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}
      >
        {t("pets.title")}
      </Text>
    </View>
  );

  return (
    // TabScreen without title: TabHeader is suppressed, but tab slide
    // animation from TabScreen is preserved. The greeting section
    // replaces the standard TabHeader for this screen.
    <TabScreen>
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
            ListHeaderComponent={listHeader}
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
    </TabScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    ...theme.typography.title1,
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
  },
  sectionLabel: {
    ...theme.typography.subhead,
    marginTop: theme.spacing.lg,
  },
  list: {
    flexGrow: 1,
    paddingBottom: SCREEN_BOTTOM_PADDING,
  },
  columnWrapper: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
}));
