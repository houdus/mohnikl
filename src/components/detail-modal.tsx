"use client";

// ============================================================
// DetailModal — Netflix-style title modal, DETAILS FIRST:
// big backdrop (not a giant autoplaying video), title + full
// meta + actions up front; the trailer plays ONLY on demand in
// the same contained hero slot, so nothing hides the details.
// Cast, genres, rating, description and "More Like This" are
// all live from TMDB append_to_response.
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
import { track } from "@/lib/tracker";
import DownloadButton, { DownloadIcon } from "./download-button";

interface ModalProps {
  item: { id: number; mediaType: "movie" | "tv" } | null;
  onClose: () => void;
  inList: (id: number, type: string) => boolean;
  onToggleList: (item: MyListItem) => void;
  onOpenItem: (id: number, mediaType: "movie" | "tv") => void;
  onDownload: () => void;
}

export default function DetailModal({
  item,
  onClose,
  inList,
  onToggleList,
  onOpenItem,
  onDownload,
}: ModalProps) {
  const [detail, setDetail] = useState<TmdbDetail | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Render-time adjustment: reset when the selected item changes
  const detailKey = item ? `${item.mediaType}-${item.id}` : "none";
  const [prevKey, setPrevKey] = useState(detailKey);
  if (prevKey !== detailKey) {
    setPrevKey(detailKey);
    setDetail(null);
    setTrailerKey(null);
    setPlaying(false);
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

  const playTrailer = () => {
    setPlaying(true);
    track("trailer_open", { id: item.id, mediaType: isTv ? "tv" : "movie" });
  };

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
        {/* ── Hero slot: backdrop image by default, trailer on demand ── */}
        <div className="relative aspect-video max-h-[480px] w-full bg-black">
          {playing && trailerKey ? (
            <>
              <iframe
                key={trailerKey}
                src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=1&rel=0`}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; encrypted-media; fullscreen"
                title="Trailer"
                allowFullScreen
              />
              <button
                onClick={() => setPlaying(false)}
                className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-black/70 px-3.5 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-black/90"
                aria-label="Close trailer"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
                Close trailer
              </button>
            </>
          ) : (
            <>
              {detail?.backdrop_path ? (
                <img
                  src={img(detail.backdrop_path, "w1280") || ""}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : detail?.poster_path ? (
                <img
                  src={img(detail.poster_path, "w780") || ""}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-top opacity-60"
                />
              ) : (
                <div className="absolute inset-0 animate-pulse bg-[#1C1C25]" />
              )}

              {/* Bottom fade into the details */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#14141B] via-[#14141B]/30 to-transparent" />

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-[#14141B]/90 text-white transition hover:bg-[#1C1C25]"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>

              {/* Title + actions — always visible, never hidden by a video */}
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                {detail && (
                  <>
                    <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-white/60">
                      <span className="text-base font-black tracking-widest text-[#E50914]">M</span>
                      {isTv ? "Series" : "Film"}
                    </div>
                    <h2 className="max-w-[85%] text-2xl font-black leading-tight text-white drop-shadow sm:text-4xl">
                      {titleOf(detail)}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="font-bold text-emerald-400">
                        {matchPct(detail.vote_average)} Match
                      </span>
                      <span className="text-white/80">{yearOf(detail)}</span>
                      <span className="rounded border border-white/40 px-1.5 text-[11px] font-semibold text-white/80">
                        {isTv ? "SERIES" : "FILM"}
                      </span>
                      {runtimeOf(detail) && (
                        <span className="text-white/70">{runtimeOf(detail)}</span>
                      )}
                      {isTv && detail.number_of_seasons ? (
                        <span className="text-white/70">
                          {detail.number_of_seasons} Season
                          {detail.number_of_seasons > 1 ? "s" : ""}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                      <DownloadButton
                        src="modal"
                        onTriggered={onDownload}
                        className="flex items-center gap-2 rounded-md bg-[#E50914] px-5 py-2 text-sm font-bold text-white shadow-[0_6px_20px_rgba(229,9,20,0.5)] transition hover:bg-[#F6121D]"
                      >
                        <DownloadIcon className="h-5 w-5 fill-current" />
                        Download App
                      </DownloadButton>
                      {trailerKey && (
                        <button
                          onClick={playTrailer}
                          className="flex items-center gap-2 rounded-md border border-white/30 bg-black/40 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:border-white/70"
                          aria-label="Watch trailer"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          Trailer
                        </button>
                      )}
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
                          inMyList
                            ? "border-[#E50914] text-[#FF4D55]"
                            : "border-white/50 text-white hover:border-white"
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
            </>
          )}
        </div>

        {/* ── Details body ── */}
        {!detail ? (
          <div className="space-y-3 p-6 sm:p-8">
            <div className="h-4 w-3/4 animate-pulse rounded bg-[#1F1F2A]" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-[#1F1F2A]" />
            <div className="h-24 animate-pulse rounded bg-[#1F1F2A]" />
          </div>
        ) : (
          <div className="p-5 pt-4 sm:p-8 sm:pt-5">
            <div className="grid gap-6 sm:grid-cols-[3fr_2fr]">
              <div>
                {detail.tagline && (
                  <p className="mb-2 text-sm italic text-white/50">{detail.tagline}</p>
                )}
                <p className="text-sm leading-relaxed text-white/85">{detail.overview}</p>
                <p className="mt-4 flex items-center gap-2 text-xs text-white/45">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 fill-[#E50914]">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Stream it in the MovieBox app — free for Windows 10/11.
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
                  <span className="text-white/45">Rating: </span>
                  <span className="text-white/85">
                    {detail.vote_average.toFixed(1)}/10
                  </span>
                </p>
                <p className="leading-relaxed">
                  <span className="text-white/45">Audio: </span>
                  <span className="uppercase text-white/85">{detail.original_language}</span>
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
