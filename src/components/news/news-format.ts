import { NewsCategory } from "@/types/news.types";

export const NEWS_CATEGORY_COLORS: Record<NewsCategory, string> = {
  [NewsCategory.PRODUCT]: "#5B7553",
  [NewsCategory.CARE_TIP]: "#3B82A0",
  [NewsCategory.MAINTENANCE]: "#D4A24C",
  [NewsCategory.GENERAL]: "#8A9AA6",
};

export const NEWS_CATEGORY_ICON: Record<NewsCategory, string> = {
  [NewsCategory.PRODUCT]: "star.fill",
  [NewsCategory.CARE_TIP]: "heart.fill",
  [NewsCategory.MAINTENANCE]: "cog",
  [NewsCategory.GENERAL]: "bell.fill",
};
