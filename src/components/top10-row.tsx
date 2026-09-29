"use client";

// ============================================================
// Top10Row — Netflix's signature "Top 10" carousel with giant
// outlined rank numbers, fed by live trending/day data.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { tmdbFetch, img, titleOf, typeOf, type ListResponse, type TmdbItem } from "@/lib/tmdb";

interface Top10Props {
  onInfo: (item: TmdbItem) => void;
  region: { code: string; label: string };
}

export default function Top10Row({ onInfo, region }: Top10Props) {
  const [items, setItems] = useState<TmdbItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  // Render-time adjustment: reset when region changes
  const [prevRegion, setPrevRegion] = useState(region.code);
  if (prevRegion !== region.code) {
    setPrevRegion(region.code);
    setItems(null);
    setFailed(false);
  }

  useEffect(() => {
    let alive = true;
    tmdbFetch<ListResponse>("trending/all/day", region.code ? { region: region.code } : {})
      .then((data) => {
        if (!alive) return;
        const clean = (data.results || [])
          .filter((r) => r.poster_path && r.media_type !== "person")
          .slice(0, 10);
        setItems(clean);
        if (clean.length < 3) setFailed(true);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [region.code]);

  if (failed) return null;

  const scroll = (dir: 1 | -1) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.72, 400), behavior: "smooth" });
  };

  return (
    <section id="row-top10" className="relative py-3" aria-label="Top 10 today">
      <h2 className="mb-2 px-4 text-base font-bold text-white/90 sm:px-8 lg:px-12 lg:text-lg">
        Top 10 in {region.label} Today
      </h2>

      <div className="relative">
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-0 z-30 hidden h-full w-14 items-center justify-center bg-gradient-to-r from-[#0A0A0F]/90 to-transparent text-white opacity-0 transition-opacity hover:text-white md:flex lg:w-16 [&:has(+_div:hover)]:opacity-100"
          aria-label="Scroll left"
        >
          <svg viewBox="0 0 24 24" className="h-10 w-10 fill-current">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>

        <div
          ref={rowRef}
          className="no-scrollbar flex items-end gap-0 overflow-x-auto scroll-smooth px-4 pb-4 pt-2 sm:px-8 lg:px-12"
        >
          {!items &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex shrink-0 items-end animate-pulse">
                <div className="w-10 bg-transparent sm:w-14" />
                <div className="aspect-[2/3] w-[110px] rounded-md bg-[#16161F] sm:w-[130px] lg:w-[150px]" />
              </div>
            ))}

          {items?.map((item, idx) => {
            const isTv = typeOf(item) === "tv";
            return (
              <button
                key={`${isTv ? "tv" : "mv"}-${item.id}`}
                onClick={() => onInfo(item)}
                className="group/top10 relative flex shrink-0 items-end focus:outline-none"
                aria-label={`#${idx + 1}: ${titleOf(item)}`}
              >
                {/* Giant rank number — Netflix style */}
                <span
                  className="select-none font-black leading-[0.78] text-[#0A0A0F] transition-colors group-hover/top10:text-[#1A1A24]"
                  style={{
                    fontSize: "clamp(90px, 12vw, 170px)",
                    WebkitTextStroke: "3px rgba(255,255,255,0.28)",
                    marginRight: "-0.28em",
                  }}
                  aria-hidden="true"
                >
                  {idx + 1}
                </span>
                <div className="relative w-[110px] overflow-hidden rounded-md transition-all duration-300 group-hover/top10:scale-105 group-hover/top10:shadow-[0_14px_40px_rgba(0,0,0,0.8)] sm:w-[130px] lg:w-[150px]">
                  <img
                    src={img(item.poster_path, "w500") || ""}
                    alt={titleOf(item)}
                    loading="lazy"
                    className="aspect-[2/3] w-full object-cover"
                  />
                  <span className="absolute right-1.5 top-1.5 rounded bg-black/70 px-1 py-0.5 text-[9px] font-bold uppercase text-white/90 backdrop-blur">
                    {isTv ? "Series" : "Film"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-0 z-30 hidden h-full w-14 items-center justify-center bg-gradient-to-l from-[#0A0A0F]/90 to-transparent text-white opacity-0 transition-opacity hover:text-white md:flex lg:w-16"
          aria-label="Scroll right"
        >
          <svg viewBox="0 0 24 24" className="h-10 w-10 fill-current">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
          </svg>
        </button>
      </div>
    </section>
  );
}
