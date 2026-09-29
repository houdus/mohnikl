// ============================================================
// MovieBox International — TMDB client library
// Types, image helpers, region catalog, row configuration.
// Client fetches go through /api/tmdb/* (key stays server-side).
// ============================================================

export type MediaType = "movie" | "tv";

export interface TmdbItem {
  id: number;
  media_type?: MediaType | string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  original_language?: string;
  popularity?: number;
  adult?: boolean;
}

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
  published_at?: string;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
}

export interface TmdbDetail extends TmdbItem {
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres?: TmdbGenre[];
  tagline?: string;
  status?: string;
  videos?: { results: TmdbVideo[] };
  credits?: { cast: TmdbCastMember[] };
  similar?: { results: TmdbItem[] };
  production_countries?: { iso_3166_1: string; name: string }[];
}

export interface ListResponse<T = TmdbItem> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// ---------- Image helpers (image CDN is hit directly by the browser) ----------

const IMG = "https://image.tmdb.org/t/p";

export const img = (
  path: string | null | undefined,
  size: "w200" | "w300" | "w500" | "w780" | "w1280" | "original" = "w500"
): string | null => (path ? `${IMG}/${size}${path}` : null);

// ---------- Genre map (for hover cards / modal chips) ----------

export const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller",
  10752: "War", 37: "Western", 10759: "Action & Adventure",
  10762: "Kids", 10763: "News", 10764: "Reality", 10765: "Sci-Fi & Fantasy",
  10766: "Soap", 10767: "Talk", 10768: "War & Politics",
};

export const genreNames = (ids: number[] | undefined, limit = 3): string[] =>
  (ids || [])
    .map((id) => GENRE_MAP[id])
    .filter(Boolean)
    .slice(0, limit) as string[];

// ---------- Utility ----------

export const titleOf = (item: TmdbItem): string =>
  item.title || item.name || item.original_title || item.original_name || "Untitled";

export const yearOf = (item: TmdbItem): string => {
  const d = item.release_date || item.first_air_date || "";
  return d ? d.slice(0, 4) : "";
};

export const typeOf = (item: TmdbItem): MediaType =>
  (item.media_type === "tv" || (!item.title && item.name) ? "tv" : "movie");

export const matchPct = (vote: number): string =>
  `${Math.min(Math.round(vote * 10), 99)}%`;

export const runtimeOf = (d: TmdbDetail): string => {
  const mins = d.runtime || d.episode_run_time?.[0];
  if (!mins) return "";
  return `${Math.floor(mins / 60) ? `${Math.floor(mins / 60)}h ` : ""}${mins % 60}m`;
};

// ---------- INTERNATIONAL: region catalog ----------

export interface Region {
  code: string;      // TMDB region (ISO 3166-1) — empty string = Global
  label: string;     // display name
  flag: string;      // emoji flag
  language?: string; // TMDB discover original_language
  country?: string;  // TMDB discover with_origin_country
}

export const REGIONS: Region[] = [
  { code: "",    label: "Global",            flag: "🌍" },
  { code: "IN",  label: "India",             flag: "🇮🇳", country: "IN", language: "hi" },
  { code: "US",  label: "United States",     flag: "🇺🇸", country: "US", language: "en" },
  { code: "GB",  label: "United Kingdom",    flag: "🇬🇧", country: "GB", language: "en" },
  { code: "KR",  label: "South Korea",       flag: "🇰🇷", country: "KR", language: "ko" },
  { code: "JP",  label: "Japan",             flag: "🇯🇵", country: "JP", language: "ja" },
  { code: "FR",  label: "France",            flag: "🇫🇷", country: "FR", language: "fr" },
  { code: "DE",  label: "Germany",           flag: "🇩🇪", country: "DE", language: "de" },
  { code: "ES",  label: "Spain",             flag: "🇪🇸", country: "ES", language: "es" },
  { code: "BR",  label: "Brazil",            flag: "🇧🇷", country: "BR", language: "pt" },
  { code: "MX",  label: "Mexico",            flag: "🇲🇽", country: "MX", language: "es" },
  { code: "AU",  label: "Australia",         flag: "🇦🇺", country: "AU", language: "en" },
  { code: "CA",  label: "Canada",            flag: "🇨🇦", country: "CA", language: "en" },
  { code: "NG",  label: "Nigeria",           flag: "🇳🇬", country: "NG" },
  { code: "TR",  label: "Türkiye",           flag: "🇹🇷", country: "TR", language: "tr" },
];

export const DEFAULT_REGION = REGIONS[1]; // India — MovieBox heritage

// ---------- Client-side fetch through the API proxy ----------

export async function tmdbFetch<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
  }
  const url = `/api/tmdb/${path}${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json() as Promise<T>;
}

// Row configuration — each row is an independent, cacheable request.
// Params functions receive the active region so rows become region-aware.
export interface RowConfig {
  id: string;
  title: (region: Region) => string;
  path: string;
  params?: (region: Region) => Record<string, string | number | undefined>;
  mediaHint?: MediaType;
  /** Hide this row for the given region codes (empty array = always shown) */
  hideFor?: string[];
}

export const buildRows = (region: Region): RowConfig[] => [
  {
    id: "trending",
    title: () => "Trending Now",
    path: "trending/all/week",
  },
  {
    id: "regionPopular",
    title: (r) => (r.code ? `Popular in ${r.label}` : "Popular Worldwide"),
    path: "movie/popular",
    params: (r) => ({ region: r.code }),
  },
  {
    id: "top10",
    title: () => "Top 10 Today",
    path: "trending/all/day",
  },
  {
    id: "nowPlaying",
    title: (r) => (r.code ? `New Releases in ${r.label}` : "New Releases"),
    path: "movie/now_playing",
    params: (r) => ({ region: r.code }),
  },
  {
    id: "topRated",
    title: () => "Top Rated of All Time",
    path: "movie/top_rated",
  },
  {
    id: "countryMovies",
    title: (r) => `${r.flag} ${r.label} Movies`,
    path: "discover/movie",
    params: (r) => ({
      with_origin_country: r.country,
      "vote_count.gte": r.code === "IN" || r.code === "US" ? 40 : 8,
      sort_by: "popularity.desc",
    }),
    hideFor: [""], // country-specific: hide in Global mode
  },
  {
    id: "kdrama",
    title: () => "🇰🇷 K-Dramas & Korean Hits",
    path: "discover/tv",
    params: () => ({ with_origin_country: "KR", "vote_count.gte": 10, sort_by: "popularity.desc" }),
    mediaHint: "tv",
  },
  {
    id: "anime",
    title: () => "🇯🇵 Anime Spotlight",
    path: "discover/tv",
    params: () => ({ with_genres: 16, with_origin_country: "JP", "vote_count.gte": 15, sort_by: "popularity.desc" }),
    mediaHint: "tv",
  },
  {
    id: "worldTV",
    title: () => "Binge-Worthy International TV",
    path: "discover/tv",
    params: () => ({ "vote_count.gte": 100, sort_by: "popularity.desc" }),
    mediaHint: "tv",
  },
  {
    id: "latino",
    title: () => "Latin & Spanish Heat",
    path: "discover/movie",
    params: () => ({ with_original_language: "es", "vote_count.gte": 30, sort_by: "popularity.desc" }),
  },
];
