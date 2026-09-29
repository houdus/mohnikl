// ============================================================
// GET /api/admin/stats — aggregated analytics for the dashboard.
// Requires the admin cookie. Aggregation is done in JS over the
// raw events (fine at landing-page scale; Supabase SQL can be
// added later for very large volumes).
// ============================================================

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getStore } from "@/lib/store";
import { getSettings } from "@/lib/settings-server";

export const dynamic = "force-dynamic";

interface PlatformAgg {
  views: number;
  downloads: number;
  blocked: number;
  sessions: Set<string>;
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const store = getStore();
  const [events, settings] = await Promise.all([
    store.getAllEvents(),
    getSettings(),
  ]);

  let pageViews = 0;
  let downloads = 0;
  let blocked = 0;
  let autoRedirects = 0;
  let detailOpens = 0;
  let regionSwitches = 0;

  const platforms = new Map<string, PlatformAgg>();
  const devices = new Map<string, number>();
  const sessions = new Set<string>();
  const regions = new Map<string, number>();

  // 14-day trend (UTC days)
  const days = new Map<string, { views: number; downloads: number; blocked: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    days.set(d, { views: 0, downloads: 0, blocked: 0 });
  }

  const platAgg = (key: string): PlatformAgg => {
    let agg = platforms.get(key);
    if (!agg) {
      agg = { views: 0, downloads: 0, blocked: 0, sessions: new Set<string>() };
      platforms.set(key, agg);
    }
    return agg;
  };

  for (const e of events) {
    const day = String(e.createdAt).slice(0, 10);
    const p = e.platform || "other";
    const d = days.get(day);

    switch (e.type) {
      case "page_view": {
        pageViews++;
        platAgg(p).views++;
        devices.set(e.device || "desktop", (devices.get(e.device || "desktop") || 0) + 1);
        if (e.sessionId) {
          sessions.add(e.sessionId);
          platAgg(p).sessions.add(e.sessionId);
        }
        if (e.region) regions.set(e.region, (regions.get(e.region) || 0) + 1);
        if (d) d.views++;
        break;
      }
      case "download": {
        downloads++;
        platAgg(p).downloads++;
        if (d) d.downloads++;
        break;
      }
      case "blocked": {
        blocked++;
        platAgg(p).blocked++;
        if (e.sessionId) sessions.add(e.sessionId);
        if (d) d.blocked++;
        break;
      }
      case "auto_redirect":
        autoRedirects++;
        break;
      case "detail_open":
        detailOpens++;
        break;
      case "region_switch":
        regionSwitches++;
        break;
      default:
        break;
    }
  }

  const recent = events.slice(-80).reverse();

  return NextResponse.json({
    store: store.kind,
    generatedAt: new Date().toISOString(),
    totals: {
      pageViews,
      uniqueVisitors: sessions.size,
      downloads,
      blocked,
      autoRedirects,
      detailOpens,
      regionSwitches,
    },
    platforms: [...platforms.entries()]
      .map(([key, agg]) => ({
        key,
        views: agg.views,
        downloads: agg.downloads,
        blocked: agg.blocked,
        sessions: agg.sessions.size,
      }))
      .sort((a, b) => b.views + b.blocked - (a.views + a.blocked)),
    devices: [...devices.entries()].map(([key, count]) => ({ key, count })),
    regions: [...regions.entries()]
      .map(([code, views]) => ({ code, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8),
    daily: [...days.entries()].map(([date, v]) => ({ date, ...v })),
    recent,
    settings,
  });
}
