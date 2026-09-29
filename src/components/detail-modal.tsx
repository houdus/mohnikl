"use client";

// ============================================================
// DetailModal — Netflix-style hero modal:
// big backdrop with muted trailer autoplay, title, match %,
// meta chips, cast/genres, and "More Like This" grid — all
// live from TMDB append_to_response.
// ============================================================

import { useEffect, useRef, useState } from "react";
import {
  img,
  matchPct,
  runtimeOf,
  titleOf,
  typeOf,
  yearOf,
  tmdbFetch,
  type TmdbDetail,
  type TmdbItem,
} from "@/lib/tmdb";
import type { MyListItem } from "@/lib/use-my-list";
import DownloadButton, { DownloadIcon } from "./download-button";

interface ModalProps {
  item: { id: number; mediaType: "movie" | "tv" } | null;
  onClose: () => void;
  onPlay: (item: TmdbItem) => void;
  inList: (id: number, type: string) => boolean;
  onToggleList: (item: MyListItem) => void;
  onOpenItem: (id: number, mediaType: "movie" | "tv") => void;
  onDownload: () => void;
}

export default function DetailModal({
  item,
  onClose,
  onPlay,
  inList,
  onToggleList,
  onOpenItem,
  onDownload,
}: ModalProps) {
  const [detail, setDetail] = useState<TmdbDetail | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Render-time adjustment: reset when the selected item changes
  const detailKey = item ? `${item.mediaType}-${item.id}` : "none";
  const [prevKey, setPrevKey] = useState(detailKey);
  if (prevKey !== detailKey) {
    setPrevKey(detailKey);
    setDetail(null);
    setTrailerKey(null);
  }

  useEffect(() => {
    if (!item) return;
    let alive = true;

    tmdbFetch<TmdbDetail>(`${item.mediaType}/${item.id}`, {
      append_to_response: "videos,credits,similar",
    })
      .then((d) => {
        if (!alive) return;
        setDetail(d);
        const vids = d.videos?.results || [];
        const pick =
          vids.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ||
          vids.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
          vids.find((v) => v.site === "YouTube" && v.type === "Teaser") ||
          vids.find((v) => v.site === "YouTube");
        if (pick) setTrailerKey(pick.key);
      })
      .catch(() => {});

    scrollRef.current?.scrollTo({ top: 0 });
    return () => {
      alive = false;
    };
  }, [detailKey]);

  // Lock body scroll + ESC to close
  useEffect(() => {
    if (!item) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [item, onClose]);

  if (!item) return null;

  const isTv = item.mediaType === "tv";
  const inMyList = detail ? inList(detail.id, isTv ? "tv" : "movie") : false;

  const similar = (detail?.similar?.results || [])
    .filter((r) => r.poster_path)
    .slice(0, 9);

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/75 p-0 backdrop-blur-sm sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={detail ? titleOf(detail) : "Loading details"}
    >
      <div
        ref={scrollRef}
        className="mx-auto w-full max-w-[900px] overflow-hidden rounded-none bg-[#14141B] shadow-[0_30px_90px_rgba(0,0,0,0.9)] sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero area */}
        <div className="relative aspect-video w-full bg-black">
          {trailerKey ? (
            <iframe
              ref={iframeRef}
              key={trailerKey}
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&rel=0&modestbranding=1&loop=1&playlist=${trailerKey}&iv_load_policy=3`}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; encrypted-media"
              title="Trailer"
            />
          ) : detail?.backdrop_path ? (
            <img src={img(detail.backdrop_path, "w1280") || ""} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 animate-pulse bg-[#1C1C25]" />
          )}

          {/* Bottom fade into modal body */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#14141B] to-transparent" />

          {/* Controls */}
          <div className="absolute right-4 top-4 flex gap-2">
            {trailerKey && (
              <button
                onClick={() => setMuted((m) => !m)}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/40 bg-black/50 text-white backdrop-blur transition hover:border-white"
                aria-label={muted ? "Unmute trailer" : "Mute trailer"}
              >
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current">
                  {muted ? (
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  ) : (
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  )}
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-[#14141B]/90 text-white transition hover:bg-[#1C1C25]"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          {/* Title overlay + actions */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
            {detail && (
              <>
                <h2 className="max-w-[80%] text-2xl font-black leading-tight text-white drop-shadow sm:text-4xl">
                  {titleOf(detail)}
                </h2>
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {/* NO watching here — the app is where the movie lives */}
                  <DownloadButton
                    src="modal"
                    onTriggered={onDownload}
                    className="flex items-center gap-2 rounded-md bg-[#E50914] px-5 py-2 text-sm font-bold text-white shadow-[0_6px_20px_rgba(229,9,20,0.5)] transition hover:bg-[#F6121D]"
                  >
                    <DownloadIcon className="h-5 w-5 fill-current" />
                    Download App
                  </DownloadButton>
                  <button
                    onClick={() =>
                      detail &&
                      onToggleList({
                        id: detail.id,
                        mediaType: isTv ? "tv" : "movie",
                        title: titleOf(detail),
                        posterPath: detail.poster_path,
                        vote: detail.vote_average,
                        year: yearOf(detail),
                      })
                    }
                    className={`grid h-10 w-10 place-items-center rounded-full border-2 bg-black/40 transition ${
                      inMyList ? "border-[#E50914] text-[#FF4D55]" : "border-white/50 text-white hover:border-white"
                    }`}
                    aria-label={inMyList ? "Remove from My List" : "Add to My List"}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                      {inMyList ? (
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      ) : (
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      )}
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        {!detail ? (
          <div className="space-y-3 p-6 sm:p-8">
            <div className="h-4 w-3/4 animate-pulse rounded bg-[#1F1F2A]" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-[#1F1F2A]" />
            <div className="h-24 animate-pulse rounded bg-[#1F1F2A]" />
          </div>
        ) : (
          <div className="p-5 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-[2fr_1fr]">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-bold text-emerald-400">{matchPct(detail.vote_average)} Match</span>
                  <span className="text-white/80">{yearOf(detail)}</span>
                  <span className="rounded border border-white/40 px-1.5 text-[11px] font-semibold text-white/80">
                    {isTv ? "SERIES" : "HD"}
                  </span>
                  <span className="rounded bg-white/15 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-white/90">
                    {detail.original_language}
                  </span>
                  {runtimeOf(detail) && <span className="text-white/80">{runtimeOf(detail)}</span>}
                  {isTv && detail.number_of_seasons ? (
                    <span className="text-white/80">
                      {detail.number_of_seasons} Season{detail.number_of_seasons > 1 ? "s" : ""}
                    </span>
                  ) : null}
                </div>
                {detail.tagline && (
                  <p className="mb-2 text-sm italic text-white/50">{detail.tagline}</p>
                )}
                <p className="text-sm leading-relaxed text-white/85">{detail.overview}</p>
                <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70">
                  🎬 Full movie streams inside the MovieBox Windows app — <span className="text-[#FF6B72]">not on this website.</span>
                </p>
              </div>

              <div className="space-y-2.5 text-sm">
                {detail.credits?.cast?.length ? (
                  <p className="leading-relaxed">
                    <span className="text-white/45">Cast: </span>
                    <span className="text-white/85">
                      {detail.credits.cast.slice(0, 4).map((c) => c.name).join(", ")}
                    </span>
                  </p>
                ) : null}
                <p className="leading-relaxed">
                  <span className="text-white/45">Genres: </span>
                  <span className="text-white/85">
                    {(detail.genres || []).map((g) => g.name).join(", ")}
                  </span>
                </p>
                <p className="leading-relaxed">
                  <span className="text-white/45">This title is: </span>
                  <span className="text-white/85">
                    {detail.vote_average >= 7.5 ? "Rave-reviewed" : detail.vote_average >= 6 ? "Well-received" : "Polarizing"}
                  </span>
                </p>
              </div>
            </div>

            {/* More Like This */}
            {similar.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-4 text-lg font-bold text-white">More Like This</h3>
                <div className="grid grid-cols-3 gap-3">
                  {similar.map((s) => (
                    <button
                      key={`${s.media_type || "m"}-${s.id}`}
                      onClick={() =>
                        onOpenItem(s.id, typeOf(s) === "tv" ? "tv" : "movie")
                      }
                      className="group overflow-hidden rounded-md bg-[#1B1B25] text-left transition hover:bg-[#22222E]"
                    >
                      <img
                        src={img(s.poster_path, "w300") || ""}
                        alt={titleOf(s)}
                        loading="lazy"
                        className="aspect-video w-full object-cover opacity-90 transition group-hover:opacity-100"
                      />
                      <div className="space-y-1.5 p-2.5">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-bold text-emerald-400">{matchPct(s.vote_average)} Match</span>
                          <span className="text-white/60">{yearOf(s)}</span>
                        </div>
                        <p className="line-clamp-1 text-xs font-semibold text-white/90">{titleOf(s)}</p>
                        <p className="line-clamp-2 text-[11px] leading-snug text-white/50">{s.overview}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
