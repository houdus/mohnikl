"use client";

// ============================================================
// MyListRow — the user's saved titles (localStorage), rendered
// as a Netflix row so it behaves like any other rail.
// ============================================================

import { img, matchPct } from "@/lib/tmdb";
import type { MyListItem } from "@/lib/use-my-list";

interface MyListRowProps {
  items: MyListItem[];
  loaded: boolean;
  onRemove: (item: MyListItem) => void;
  onInfo: (id: number, mediaType: "movie" | "tv") => void;
}

export default function MyListRow({ items, loaded, onRemove, onInfo }: MyListRowProps) {
  if (!loaded || items.length === 0) return null;

  return (
    <section id="my-list" className="relative py-3" aria-label="My List">
      <h2 className="mb-2 px-4 text-base font-bold text-white/90 sm:px-8 lg:px-12 lg:text-lg">
        My List <span className="ml-1 text-sm font-normal text-white/40">({items.length})</span>
      </h2>
      <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4 pb-2 pt-2 sm:px-8 lg:px-12">
        {items.map((item) => (
          <div key={`${item.mediaType}-${item.id}`} className="group/list relative shrink-0">
            <button
              onClick={() => onInfo(item.id, item.mediaType)}
              className="block w-[136px] overflow-hidden rounded-md bg-[#16161F] sm:w-[168px] lg:w-[188px]"
              aria-label={`Open ${item.title}`}
            >
              {item.posterPath ? (
                <img
                  src={img(item.posterPath, "w500") || ""}
                  alt={item.title}
                  loading="lazy"
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="grid aspect-[2/3] w-full place-items-center px-2 text-center text-xs text-white/40">
                  {item.title}
                </div>
              )}
              <div className="space-y-0.5 p-2 text-left">
                <p className="line-clamp-1 text-[11px] font-semibold text-white/90">{item.title}</p>
                <p className="text-[10px] text-white/45">
                  {item.year} · <span className="text-emerald-400">{matchPct(item.vote)}</span>
                </p>
              </div>
            </button>
            <button
              onClick={() => onRemove(item)}
              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white/80 opacity-0 backdrop-blur transition hover:bg-[#E50914] hover:text-white group-hover/list:opacity-100"
              aria-label={`Remove ${item.title} from My List`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
