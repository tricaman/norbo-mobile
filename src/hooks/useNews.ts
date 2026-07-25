import { newsApi } from "@/services/news.api";
import { useNewsReadStore } from "@/stores/news-read.store";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const KEYS = {
  list: () => ["news"] as const,
  detail: (id: string) => ["news", id] as const,
};

export function useNewsList() {
  return useQuery({
    queryKey: KEYS.list(),
    queryFn: () => newsApi.list().then((r) => r.data),
  });
}

export function useNewsItem(id: string) {
  const markRead = useNewsReadStore((s) => s.markRead);

  const query = useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => newsApi.get(id).then((r) => r.data),
    enabled: !!id,
  });

  // Mark-read-on-open: as soon as the item resolves, flag it as read. The
  // store no-ops if it was already read, so this is safe to run on every
  // resolution.
  useEffect(() => {
    if (query.data) markRead(query.data.id);
  }, [query.data, markRead]);

  return query;
}

export function useNewsUnread(): number {
  const list = useNewsList().data;
  // Subscribe to readIds so the count recomputes when items are marked read.
  const readIds = useNewsReadStore((s) => s.readIds);
  if (!list) return 0;
  const readSet = new Set(readIds);
  return list.reduce((n, item) => (readSet.has(item.id) ? n : n + 1), 0);
}
