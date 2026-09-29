"use client";

// ============================================================
// Hero Billboard — live #1 trending title for the active region.
// Netflix DNA: full-bleed backdrop, layered gradients, big
// title, match %, meta chips, Play / More Info actions.
// ============================================================

import { img, matchPct, titleOf, typeOf, yearOf, type TmdbItem } from "@/lib/tmdb";
import DownloadButton, { DownloadIcon } from "./download-button";

interface HeroProps {
  item: TmdbItem | null;
  loading: boolean;
  onPlay: (item: TmdbItem) => void;
  onInfo: (item: TmdbItem) => void;
  regionLabel: string;
  onDownload: () => void;
}

export default function HeroBillboard({ item, loading, onPlay, onInfo, regionLabel, onDownload }: HeroProps) {
  if (loading || !item) {
    return (
      <div className="relative h-[62vh] min-h-[420px] w-full animate-pulse bg-[#14141B] sm:h-[78vh]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F] via-transparent to-transparent" />
      </div>
    );
  }

  const backdrop = img(item.backdrop_path, "w1280") || img(item.poster_path, "w780");
  const isTv = typeOf(item) === "tv";
  const year = yearOf(item);

  return (
    <section className="relative h-[62vh] min-h-[440px] w-full sm:h-[80vh]" id="hero" aria-label="Featured title">
      {backdrop && (
        <img
          src={backdrop}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
          fetchPriority="high"
        />
      )}
      {/* Netflix layered gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F]/95 via-[#0A0A0F]/55 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />

      <div className="relative z-10 flex h-full items-end pb-[14vh] sm:items-center sm:pb-0">
        <div className="max-w-[1800px] px-4 sm:px-8 lg:px-12">
          <div className="max-w-xl lg:max-w-2xl">
            {/* Original badge */}
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl font-black tracking-widest text-[#E50914]">M</span>
              <span className="text-xs font-bold uppercase tracking-[0.35em] text-white/80 sm:text-sm">
                {isTv ? "Series" : "Film"} · {regionLabel}
              </span>
            </div>

            <h1 className="text-3xl font-black leading-[1.05] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)] sm:text-5xl lg:text-6xl">
              {titleOf(item)}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
              <span className="font-bold text-emerald-400">{matchPct(item.vote_average)} Match</span>
              <span className="text-white/80">{year}</span>
              <span className="rounded border border-white/40 px-1.5 py-0.5 text-[11px] font-semibold text-white/80">
                {isTv ? "SERIES" : "HD"}
              </span>
              <span className="rounded bg-white/15 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-white/90">
                {item.original_language}
              </span>
              {item.vote_average > 0 && (
                <span className="flex items-center gap-1 text-white/80">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-yellow-400">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  {item.vote_average.toFixed(1)}
                </span>
              )}
            </div>

            {item.overview && (
              <p className="mt-4 line-clamp-3 max-w-lg text-sm leading-relaxed text-white/85 drop-shadow sm:text-base">
                {item.overview}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {/* Download first — the app is where you actually watch */}
              <DownloadButton
                src="hero"
                onTriggered={onDownload}
                className="flex items-center gap-2 rounded-md bg-[#E50914] px-6 py-2.5 text-sm font-bold text-white shadow-[0_6px_24px_rgba(229,9,20,0.5)] transition hover:bg-[#F6121D] sm:text-base"
              >
                <DownloadIcon className="h-5 w-5 fill-current" />
                Download App
              </DownloadButton>
              <button
                onClick={() => onPlay(item)}
                className="flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-white/80 sm:text-base"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Trailer
              </button>
              <button
                onClick={() => onInfo(item)}
                className="flex items-center gap-2 rounded-md bg-white/25 px-6 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/35 sm:text-base"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                More Info
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
