"use client";

// ============================================================
// MovieCard — Netflix signature hover interaction:
// poster scales up, siblings stay put, an info panel slides in
// with action buttons (Play / Add / Like) + meta + genres.
// Edge cards flip their transform-origin so nothing clips.
// ============================================================

import { memo, useState } from "react";
import {
  genreNames,
  img,
  matchPct,
  titleOf,
  typeOf,
  yearOf,
  type TmdbItem,
} from "@/lib/tmdb";
import type { MyListItem } from "@/lib/use-my-list";

interface CardProps {
  item: TmdbItem;
  onInfo: (item: TmdbItem) => void;
  onPlay: (item: TmdbItem) => void;
  inList: boolean;
  onToggleList: (item: MyListItem) => void;
  edge?: "first" | "last" | null;
}

function MovieCardInner({ item, onInfo, onPlay, inList, onToggleList, edge }: CardProps) {
  const poster = img(item.poster_path, "w500");
  const backdrop = img(item.backdrop_path, "w780");
  const title = titleOf(item);
  const year = yearOf(item);
  const isTv = typeOf(item) === "tv";
  // Backdrop is fetched ONLY when hovered — keeps the initial
  // page to ~1 request per card instead of 2 (TMDB throttles bursts).
  const [hovered, setHovered] = useState(false);

  const originClass =
    edge === "first"
      ? "origin-left"
      : edge === "last"
        ? "origin-right"
        : "origin-center";

  const toListItem = (): MyListItem => ({
    id: item.id,
    mediaType: isTv ? "tv" : "movie",
    title,
    posterPath: item.poster_path,
    vote: item.vote_average,
    year: yearOf(item),
  });

  return (
    <div
      className={`group/card relative shrink-0 ${originClass}`}
      data-item-id={`${isTv ? "tv" : "movie"}-${item.id}`}
      onMouseEnter={() => setHovered(true)}
    >
      {/* Poster (idle) */}
      <button
        onClick={() => onInfo(item)}
        className="block w-[136px] cursor-pointer overflow-hidden rounded-md bg-[#16161F] transition-all duration-300 sm:w-[168px] lg:w-[188px]"
        aria-label={`Open ${title}`}
      >
        {poster || backdrop ? (
          <img
            src={poster || backdrop || ""}
            alt={title}
            loading="lazy"
            className="aspect-[2/3] w-full object-cover transition duration-300 group-hover/card:opacity-0"
          />
        ) : (
          <div className="grid aspect-[2/3] w-full place-items-center text-white/30">
            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current">
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
            </svg>
          </div>
        )}
      </button>

      {/* Hover expand — absolute so siblings don't reflow */}
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 z-40 w-[168px] -translate-x-1/2 -translate-y-1/2 scale-0 overflow-hidden rounded-lg bg-[#181820] opacity-0 shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all delay-150 duration-200 group-hover/card:pointer-events-auto group-hover/card:scale-110 group-hover/card:opacity-100 sm:w-[200px] lg:w-[220px] ${originClass} max-lg:!left-1/2`}
        style={{ translate: "none" }}
      >
        {hovered && (backdrop || poster) ? (
          <img src={backdrop || poster || ""} alt="" className="aspect-video w-full object-cover" />
        ) : (
          <div className="aspect-video w-full bg-[#22222C]" />
        )}

        <div className="space-y-2 p-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onInfo(item)}
              className="grid h-8 w-8 place-items-center rounded-full bg-white text-black transition hover:bg-white/80"
              aria-label={`Play ${title}`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <button
              onClick={() => onToggleList(toListItem())}
              className={`grid h-8 w-8 place-items-center rounded-full border transition ${
                inList
                  ? "border-[#E50914] bg-[#E50914]/20 text-[#FF4D55]"
                  : "border-white/40 bg-black/40 text-white hover:border-white"
              }`}
              aria-label={inList ? "Remove from My List" : "Add to My List"}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                {inList ? (
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                ) : (
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                )}
              </svg>
            </button>
            <button
              onClick={() => onInfo(item)}
              className="ml-auto grid h-8 w-8 place-items-center rounded-full border border-white/40 bg-black/40 text-white transition hover:border-white"
              aria-label={`More info about ${title}`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
            <span className="font-bold text-emerald-400">{matchPct(item.vote_average)} Match</span>
            <span className="rounded border border-white/40 px-1 text-[9px] font-semibold text-white/80">
              {isTv ? "SERIES" : "FILM"}
            </span>
            <span className="text-white/70">{year}</span>
          </div>

          <p className="line-clamp-1 text-[11px] uppercase tracking-wider text-white/45">
            {genreNames(item.genre_ids, 3).join(" · ") || item.original_language}
          </p>
        </div>
      </div>
    </div>
  );
}

export const MovieCard = memo(MovieCardInner);
