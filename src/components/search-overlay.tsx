"use client";

// ============================================================
// SearchOverlay — Netflix-style expandable live search:
// debounced /search/multi, poster grid, keyboard support.
// ============================================================

import { useEffect, useRef, useState } from "react";
import {
  img,
  matchPct,
  titleOf,
  typeOf,
  yearOf,
  tmdbFetch,
  type ListResponse,
  type TmdbItem,
} from "@/lib/tmdb";

interface SearchProps {
  open: boolean;
  onClose: () => void;
  onInfo: (item: TmdbItem) => void;
}

export default function SearchOverlay({ open, onClose, onInfo }: SearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      queueMicrotask(() => {
        setQuery("");
        setResults(null);
      });
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(
      () => {
        if (q.length < 2) {
          setResults(null);
          setBusy(false);
          return;
        }
        setBusy(true);
        tmdbFetch<ListResponse>("search/multi", { query: q, page: 1 })
          .then((d) =>
            setResults(
              (d.results || []).filter(
                (r) => (r.media_type === "movie" || r.media_type === "tv") && r.poster_path
              ).slice(0, 24)
            )
          )
          .catch(() => setResults([]))
          .finally(() => setBusy(false));
      },
      q.length < 2 ? 0 : 350
    );
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-[#0A0A0F]/97 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Search">
      <div className="mx-auto max-w-[1400px] px-4 pt-20 sm:px-8">
        <div className="flex items-center gap-3 border-b-2 border-[#E50914] pb-3">
          <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-white/70">
            <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, series, people — across the world"
            className="w-full bg-transparent text-xl font-medium text-white outline-none placeholder:text-white/35 sm:text-2xl"
            aria-label="Search query"
          />
          <button
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close search"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="mt-6 max-h-[75vh] overflow-y-auto pb-10">
          {!query.trim() && (
            <p className="py-16 text-center text-white/40">
              Start typing to search the entire international catalog
            </p>
          )}

          {busy && !results && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-md bg-[#16161F]" />
              ))}
            </div>
          )}

          {results && results.length === 0 && !busy && (
            <p className="py-16 text-center text-white/40">
              No results for “{query}”. Try another spelling.
            </p>
          )}

          {results && results.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {results.map((r) => (
                <button
                  key={`${r.media_type}-${r.id}`}
                  onClick={() => {
                    onInfo(r);
                    onClose();
                  }}
                  className="group text-left"
                >
                  <div className="overflow-hidden rounded-md bg-[#16161F]">
                    <img
                      src={img(r.poster_path, "w300") || ""}
                      alt={titleOf(r)}
                      loading="lazy"
                      className="aspect-[2/3] w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 line-clamp-1 text-xs font-semibold text-white/90">{titleOf(r)}</p>
                  <p className="text-[11px] text-white/45">
                    {yearOf(r)} · {typeOf(r) === "tv" ? "Series" : "Film"} ·{" "}
                    <span className="text-emerald-400">{matchPct(r.vote_average)}</span>
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
