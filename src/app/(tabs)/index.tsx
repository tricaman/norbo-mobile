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
import { useTranslation } from "react-i18next";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const PET_CAROUSEL_LIMIT = 10;

export default function PetsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useUnistyles();
  const { width: windowWidth } = useWindowDimensions();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] ?? null;

  const cardWidth = (windowWidth - theme.spacing.lg * 2 - theme.spacing.sm) / 2;
  // imageArea (aspectRatio:1) + infoArea (paddingTop 8 + name 20 + gap 2 + caption 13 + paddingBottom 12) + shadow bottom
  const cardHeight = cardWidth + 55 + theme.spacing.sm;

  const query = useQuery({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
  });

  return (
    // TabScreen without title: TabHeader is suppressed, but tab slide
    // animation from TabScreen is preserved. The greeting section
    // replaces the standard TabHeader for this screen.
    <TabScreen>
      <QueryBoundary query={query} isEmpty={() => false}>
        {(pets, { refetch, isFetching }) => (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} />
            }
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ─────────────────────────────────── */}
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <Avatar name={user?.name} source={user?.photoUrl} size="sm" />
                <NorboPressable
                  style={[
                    styles.addBtn,
                    { backgroundColor: theme.colors.primary },
                  ]}
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
                <Text
                  style={[styles.greeting, { color: theme.colors.textPrimary }]}
                >
                  {`Ciao, ${firstName}`}
                </Text>
              ) : null}
            </View>

            {/* ── Pets section ───────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {t("pets.title")}
                </Text>
                {pets.length > PET_CAROUSEL_LIMIT ? (
                  <NorboPressable
                    scale="text"
                    haptic="light"
                    onPress={() => router.push("/pets")}
                  >
                    <Text
                      style={[
                        styles.viewAllLink,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {t("pets.viewAll")}
                    </Text>
                  </NorboPressable>
                ) : null}
              </View>

              {pets.length === 0 ? (
                <PetsEmptyHero
                  title={t("pets.emptyTitle")}
                  subtitle={t("pets.emptySubtitle")}
                  ctaLabel={t("pets.emptyCta")}
                  onPressCta={() => router.push("/pets/new")}
                />
              ) : (
                <FlatList
                  horizontal
                  data={pets.slice(0, PET_CAROUSEL_LIMIT)}
                  keyExtractor={(p) => p.id}
                  style={{ height: cardHeight }}
                  contentContainerStyle={styles.carousel}
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
              )}
            </View>
          </ScrollView>
        )}
      </QueryBoundary>
    </TabScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SCREEN_BOTTOM_PADDING,
  },
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
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.title2,
    fontWeight: "700",
  },
  viewAllLink: {
    ...theme.typography.subhead,
  },
  carousel: {
    paddingHorizontal: theme.spacing.lg,
  },
}));
