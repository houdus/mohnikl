"use client";

// My List — localStorage-backed watchlist (per browser, no auth needed)

import { useCallback, useEffect, useState } from "react";

export interface MyListItem {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  vote: number;
  year: string;
}

const KEY = "moviebox.mylist.v1";

export function useMyList() {
  const [items, setItems] = useState<MyListItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let next: MyListItem[] = [];
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) next = JSON.parse(raw);
    } catch {
      /* corrupt storage — start clean */
    }
    // Async boundary: keeps SSR-safe hydration (server renders empty)
    queueMicrotask(() => {
      setItems(next);
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((next: MyListItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* quota exceeded — ignore */
    }
  }, []);

  const has = useCallback(
    (id: number, mediaType: string) =>
      items.some((i) => i.id === id && i.mediaType === mediaType),
    [items]
  );

  const toggle = useCallback(
    (item: MyListItem) => {
      const exists = items.some(
        (i) => i.id === item.id && i.mediaType === item.mediaType
      );
      persist(
        exists
          ? items.filter((i) => !(i.id === item.id && i.mediaType === item.mediaType))
          : [item, ...items].slice(0, 100)
      );
      return !exists;
    },
    [items, persist]
  );

  return { items, loaded, has, toggle };
}
