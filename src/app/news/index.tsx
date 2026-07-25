import { NewsRow } from "@/components/news/NewsRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSeparator } from "@/components/ui/ListSeparator";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useNewsList } from "@/hooks/useNews";
import { useNewsReadStore } from "@/stores/news-read.store";
import type { NewsItem } from "@/types/news.types";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export default function NewsListScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const query = useNewsList();
  const news = query.data ?? [];

  const readIds = useNewsReadStore((s) => s.readIds);
  const readSet = useMemo(() => new Set(readIds), [readIds]);

  return (
    <Screen>
      <ScreenHeader title={t("news.title")} />
      <FlatList<NewsItem>
        data={news}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NewsRow
            item={item}
            read={readSet.has(item.id)}
            onPress={() => router.push(`/news/${item.id}` as never)}
          />
        )}
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={
          query.isPending ? (
            <View style={styles.centered}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : (
            <EmptyState
              title={t("news.empty")}
              subtitle={t("news.emptySubtitle")}
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => {
              void query.refetch();
            }}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  listContent: { flexGrow: 1, paddingTop: theme.spacing.sm },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
  },
}));
