// ============================================================
// GET /api/tmdb/[...path]
// Secure TMDB proxy:
//   • API key lives ONLY on the server (never shipped to client)
//   • Path whitelist (no arbitrary upstream calls)
//   • TTL cache + dedupe via tmdbGatewayFetch
//   • Normalized JSON errors
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { tmdbGatewayFetch } from "@/lib/tmdb-server";

const TMDB_KEY = process.env.TMDB_API_KEY || "3fd2be6f0c70a2a598f084ddfb75487c";

// Whitelisted TMDB path prefixes (both static lists and detail paths)
const ALLOWED = [
  /^trending\/(all|movie|tv)\/(day|week)$/,
  /^movie\/(popular|top_rated|now_playing|upcoming)$/,
  /^tv\/(popular|top_rated|airing_today|on_the_air)$/,
  /^discover\/(movie|tv)$/,
  /^search\/(multi|movie|tv)$/,
  /^genre\/(movie|tv)\/list$/,
  /^(movie|tv)\/\d+$/, // details
  /^(movie|tv)\/\d+\/(videos|credits|similar|recommendations)$/,
];

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const tmdbPath = (path || []).join("/");

  if (!ALLOWED.some((re) => re.test(tmdbPath))) {
    return NextResponse.json(
      { error: "Path not allowed", path: tmdbPath },
      { status: 400 }
    );
  }

  // Forward a safe subset of query params (drop anything suspicious)
  const safeParams = new URLSearchParams();
  const allowedParams = new Set([
    "region", "language", "page", "query", "include_adult", "sort_by",
    "with_genres", "with_origin_country", "with_original_language",
    "primary_release_year", "first_air_date_year", "year",
    "vote_count.gte", "vote_average.gte", "append_to_response",
    "watch_region", "with_watch_providers", "timezone",
  ]);
  req.nextUrl.searchParams.forEach((v, k) => {
    if (allowedParams.has(k) && v.length < 200) safeParams.set(k, v);
  });
  safeParams.set("include_adult", "false");

  try {
    const data = await tmdbGatewayFetch(tmdbPath, safeParams, TMDB_KEY);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown gateway error";
    return NextResponse.json({ error: "Upstream failed", detail: msg }, { status: 502 });
  }
}
