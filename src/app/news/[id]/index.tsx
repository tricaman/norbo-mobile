import {
  NEWS_CATEGORY_COLORS,
} from "@/components/news/news-format";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useNewsItem } from "@/hooks/useNews";
import type { NewsItem } from "@/types/news.types";
import { format, parseISO } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export default function NewsDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  // useNewsItem marks the item read on load automatically.
  const query = useNewsItem(id);

  return (
    <Screen>
      <QueryBoundary query={query}>
        {(item) => <NewsArticle item={item} />}
      </QueryBoundary>
    </Screen>
  );
}

function NewsArticle({ item }: { item: NewsItem }): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const dateLocale = i18n.language?.startsWith("it") ? itLocale : enUS;

  const color = NEWS_CATEGORY_COLORS[item.category] ?? theme.colors.primary;
  const categoryLabel = t(
    `news.categories.${item.category}` as "news.categories.PRODUCT",
  );
  const dateLabel = format(parseISO(item.publishedAt), "d MMMM yyyy", {
    locale: dateLocale,
  });

  return (
    <>
      <ScreenHeader title={t("news.title")} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
          <Text style={[styles.badgeText, { color }]}>{categoryLabel}</Text>
        </View>

        <Text style={[styles.date, { color: theme.colors.textTertiary }]}>
          {dateLabel}
        </Text>

        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {item.title}
        </Text>

        {item.coverImageUrl ? (
          <Image
            source={{ uri: item.coverImageUrl }}
            style={styles.cover}
            contentFit="cover"
          />
        ) : null}

        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
          {item.body}
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    flexGrow: 1,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  badgeText: {
    ...theme.typography.caption,
    fontWeight: "600",
  },
  date: {
    ...theme.typography.caption,
  },
  title: {
    ...theme.typography.title2,
    fontWeight: "700",
  },
  cover: {
    width: "100%",
    height: 200,
    borderRadius: theme.radius.md,
  },
  body: {
    ...theme.typography.body,
    lineHeight: 24,
  },
}));
