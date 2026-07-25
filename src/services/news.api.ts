import { api } from "./api";
import type { NewsItem } from "@/types/news.types";

export const newsApi = {
  list: () => api.get<NewsItem[]>("/news"),
  get: (id: string) => api.get<NewsItem>(`/news/${encodeURIComponent(id)}`),
} as const;
