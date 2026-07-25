import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import type { NewsItem } from "@/types/news.types";
import { format } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { NEWS_CATEGORY_COLORS, NEWS_CATEGORY_ICON } from "./news-format";

interface NewsRowProps {
  item: NewsItem;
  read: boolean;
  onPress: () => void;
}

export function NewsRow({ item, read, onPress }: NewsRowProps): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const color = NEWS_CATEGORY_COLORS[item.category] ?? theme.colors.primary;
  const icon = NEWS_CATEGORY_ICON[item.category] ?? "bell.fill";

  const dateLocale = i18n.language?.startsWith("it") ? itLocale : enUS;
  const dateLabel = (() => {
    const d = new Date(item.publishedAt);
    if (Number.isNaN(d.getTime())) return "";
    return format(d, "d MMM", { locale: dateLocale });
  })();

  const categoryLabel = t(
    `news.categories.${item.category}` as "news.categories.PRODUCT",
  );
  const subtitleParts = [categoryLabel, dateLabel].filter(
    (p): p is string => Boolean(p),
  );

  return (
    <NorboPressable scale="row" haptic="light" onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: theme.colors.surface2 }]}>
          <IconSymbol name={icon} size={18} tintColor={color} />
        </View>
        <View style={styles.content}>
          <Text
            style={[styles.title, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textTertiary }]}
            numberOfLines={1}
          >
            {subtitleParts.join(" · ")}
          </Text>
        </View>
        {!read ? (
          <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
        ) : null}
      </View>
    </NorboPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing["3xl"],
    paddingVertical: theme.spacing.md,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, gap: 2 },
  title: { ...theme.typography.subhead, fontWeight: "600" },
  subtitle: {
    ...theme.typography.caption,
    textTransform: "none",
    letterSpacing: 0,
    fontWeight: "400",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
}));
