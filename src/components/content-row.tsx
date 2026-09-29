"use client";

// ============================================================
// ContentRow — Netflix horizontal carousel:
// • arrow navigation (hidden at edges, like Netflix)
// • edge-aware cards (first/last flip transform-origin)
// • skeleton loaders while fetching
// • silent failure (row hides itself if upstream fails)
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { tmdbFetch, type ListResponse, type Region, type RowConfig, type TmdbItem } from "@/lib/tmdb";
import { MovieCard } from "./movie-card";
import type { MyListItem } from "@/lib/use-my-list";

interface RowProps {
  config: RowConfig;
  region: Region;
  onInfo: (item: TmdbItem) => void;
  onPlay: (item: TmdbItem) => void;
  inList: (id: number, type: string) => boolean;
  onToggleList: (item: MyListItem) => void;
}

const MAX_ITEMS = 18;

export default function ContentRow({
  config,
  region,
  onInfo,
  onPlay,
  inList,
  onToggleList,
}: RowProps) {
  const [items, setItems] = useState<TmdbItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const rowRef = useRef<HTMLDivElement>(null);

  // Render-time adjustment: reset when the row config or region changes
  const rowKey = `${config.id}|${region.code}`;
  const [prevRowKey, setPrevRowKey] = useState(rowKey);
  if (prevRowKey !== rowKey) {
    setPrevRowKey(rowKey);
    setItems(null);
    setFailed(false);
  }

  useEffect(() => {
    let alive = true;
    const params = config.params ? config.params(region) : {};
    tmdbFetch<ListResponse>(config.path, { ...params, page: 1 })
      .then((data) => {
        if (!alive) return;
        const clean = (data.results || [])
          .filter((r) => (r.poster_path || r.backdrop_path) && r.media_type !== "person")
          .slice(0, MAX_ITEMS);
        setItems(clean);
        if (clean.length === 0) setFailed(true);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [rowKey]);

  const updateArrows = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 8);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows]);

  if (failed) return null;

  const scroll = (dir: 1 | -1) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.72, 400), behavior: "smooth" });
  };

  return (
    <section id={`row-${config.id}`} className="group/row relative py-3" aria-label={config.title(region)}>
      <h2 className="mb-2 px-4 text-base font-bold text-white/90 transition sm:px-8 lg:px-12 lg:text-lg">
        {config.title(region)}
      </h2>

      <div className="relative">
        {/* Left arrow */}
        <button
          onClick={() => scroll(-1)}
          className={`absolute left-0 top-0 z-30 hidden h-full w-10 items-center justify-center bg-gradient-to-r from-[#0A0A0F]/90 to-transparent text-white transition-opacity hover:text-white md:flex lg:w-14 ${
            showLeft ? "opacity-0 group-hover/row:opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-label="Scroll left"
        >
          <svg viewBox="0 0 24 24" className="h-9 w-9 fill-current">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>

        <div
          ref={rowRef}
          onScroll={updateArrows}
          className="no-scrollbar flex gap-2 overflow-x-auto scroll-smooth px-4 pb-20 pt-2 sm:gap-2.5 sm:px-8 lg:px-12"
        >
          {!items &&
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] w-[136px] shrink-0 animate-pulse rounded-md bg-[#16161F] sm:w-[168px] lg:w-[188px]"
              />
            ))}

          {items?.map((item, idx) => (
            <MovieCard
              key={`${item.media_type || config.mediaHint || "m"}-${item.id}`}
              item={{ ...item, media_type: item.media_type || config.mediaHint || "movie" }}
              onInfo={onInfo}
              onPlay={onPlay}
              inList={inList(item.id, item.media_type || config.mediaHint || "movie")}
              onToggleList={onToggleList}
              edge={idx === 0 ? "first" : idx === items.length - 1 ? "last" : null}
            />
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll(1)}
          className={`absolute right-0 top-0 z-30 hidden h-full w-10 items-center justify-center bg-gradient-to-l from-[#0A0A0F]/90 to-transparent text-white transition-opacity hover:text-white md:flex lg:w-14 ${
            showRight && items ? "opacity-0 group-hover/row:opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-label="Scroll right"
        >
          <svg viewBox="0 0 24 24" className="h-9 w-9 fill-current">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
          </svg>
        </button>
      </div>
    </section>
  );
}
