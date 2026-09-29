// ============================================================
// Server-side TMDB gateway cache
// • TTL in-memory cache (endpoint-type aware)
// • In-flight request deduplication (thundering-herd safe)
// • Stale-on-error fallback (resilience: if upstream blips,
//   serve the last good copy instead of failing the row)
// ============================================================

import "server-only";

interface CacheEntry {
  data: unknown;
  ts: number;
  ttl: number;
}

const store = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

const MAX_ENTRIES = 500;

function ttlForPath(path: string): number {
  // milliseconds
  if (path.startsWith("trending")) return 10 * 60_000; // 10 min — freshness matters
  if (path.startsWith("search")) return 15 * 60_000; // 15 min
  if (/^(movie|tv)\/\d+/.test(path)) return 6 * 60 * 60_000; // 6 h — details rarely change
  if (path.startsWith("genre")) return 24 * 60 * 60_000; // 24 h
  return 30 * 60_000; // lists: 30 min
}

export async function tmdbGatewayFetch<T = unknown>(
  path: string,
  params: URLSearchParams,
  apiKey: string
): Promise<T> {
  const upstream = new URL(`https://api.themoviedb.org/3/${path}`);
  params.forEach((v, k) => upstream.searchParams.set(k, v));
  upstream.searchParams.set("api_key", apiKey);

  const key = `${path}?${params.toString()}`;

  // 1) Fresh cache hit
  const hit = store.get(key);
  if (hit && Date.now() - hit.ts < hit.ttl) {
    return hit.data as T;
  }

  // 2) Deduplicate concurrent identical requests
  const running = inflight.get(key);
  if (running) return running as Promise<T>;

  const p = (async () => {
    try {
      const res = await fetch(upstream.toString(), {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(12_000),
        // Next.js data cache: share across requests for same URL for 10 min
        next: { revalidate: 600 },
      } as RequestInit & { next?: { revalidate: number } });

      if (!res.ok) throw new Error(`TMDB upstream ${res.status}`);
      const data = await res.json();

      // Evict oldest when over budget (simple FIFO keep-alive)
      if (store.size >= MAX_ENTRIES) {
        const oldest = store.keys().next().value;
        if (oldest) store.delete(oldest);
      }
      store.set(key, { data, ts: Date.now(), ttl: ttlForPath(path) });
      return data as T;
    } catch (err) {
      // 3) Stale-on-error: prefer last known good data over a broken row
      const stale = store.get(key);
      if (stale) return stale.data as T;
      throw err;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p as Promise<T>;
}
