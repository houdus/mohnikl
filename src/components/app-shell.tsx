"use client";

// ============================================================
// AppShell — client orchestrator (only mounted on allowed
// platforms):
// • hero billboard = live #1 trending for the active region
// • row matrix (region-aware, country-specific rails)
// • Top 10 giant-number rail
// • My List (localStorage)
// • detail modal + global search + region switcher
// • DOWNLOAD FUNNEL: navbar/hero/modal/footer/floating CTAs →
//   thank-you popup → /api/download (counted server-side)
// • 20s auto-redirect: idle visitors get the popup + download
//   automatically ("Download starting… thank you & enjoy the
//   great movies!")
// • NO WATCHING happens on the website — trailers only, the
//   app is where the great movies live.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "./navbar";
import HeroBillboard from "./hero-billboard";
import ContentRow from "./content-row";
import Top10Row from "./top10-row";
import MyListRow from "./my-list-row";
import DetailModal from "./detail-modal";
import SearchOverlay from "./search-overlay";
import Footer from "./footer";
import PlatformGate from "./platform-gate";
import DownloadPopup from "./download-popup";
import FloatingDownloadBar from "./floating-download-bar";
import {
  buildRows,
  DEFAULT_REGION,
  tmdbFetch,
  type ListResponse,
  type Region,
  type TmdbItem,
} from "@/lib/tmdb";
import { useMyList } from "@/lib/use-my-list";
import { track } from "@/lib/tracker";
import { triggerDownload, wasDownloaded } from "@/lib/download";

const REGION_KEY = "moviebox.region.v1";
const AUTO_KEY = "moviebox.auto.fired.v1";

export interface PublicSettings {
  blockedPlatforms: string[];
  autoRedirectEnabled: boolean;
  autoRedirectSeconds: number;
  popupMessage: string;
}

export default function AppShell({ settings }: { settings: PublicSettings }) {
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [hero, setHero] = useState<TmdbItem | null>(null);
  const [heroLoading, setHeroLoading] = useState(true);
  const [detailItem, setDetailItem] = useState<{ id: number; mediaType: "movie" | "tv" } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  const { items: myList, loaded: listLoaded, has, toggle } = useMyList();

  // Analytics: one page_view per load
  useEffect(() => {
    track("page_view");
  }, []);

  // THE 20-SECOND RULE: a visitor who stays gets redirected to
  // the download automatically, with the thank-you popup.
  useEffect(() => {
    if (!settings.autoRedirectEnabled) return;
    let fired = false;
    try {
      if (sessionStorage.getItem(AUTO_KEY) || wasDownloaded()) return;
    } catch {
      /* ignore */
    }
    const secs = Math.max(5, Math.min(600, settings.autoRedirectSeconds || 20));
    const timer = setTimeout(() => {
      if (fired) return;
      fired = true;
      try {
        sessionStorage.setItem(AUTO_KEY, "1");
      } catch {
        /* ignore */
      }
      if (wasDownloaded()) return; // they already downloaded manually
      track("auto_redirect");
      triggerDownload("auto");
      setPopupOpen(true);
    }, secs * 1000);
    return () => {
      fired = true;
      clearTimeout(timer);
    };
  }, [settings.autoRedirectEnabled, settings.autoRedirectSeconds]);

  // Restore region preference (async boundary: keeps SSR-safe hydration).
  // Seeds the default region too, so analytics always carry a region.
  useEffect(() => {
    let saved: Region | null = null;
    try {
      const raw = localStorage.getItem(REGION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Region;
        if (typeof parsed?.code === "string" && parsed.label) saved = parsed;
      }
    } catch {
      /* ignore */
    }
    if (saved) {
      const s = saved;
      queueMicrotask(() => setRegion(s));
    } else {
      try {
        localStorage.setItem(REGION_KEY, JSON.stringify(DEFAULT_REGION));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const changeRegion = useCallback(
    (r: Region, fromCode: string) => {
      // persist FIRST so the region_switch event records the NEW region
      try {
        localStorage.setItem(REGION_KEY, JSON.stringify(r));
      } catch {
        /* ignore */
      }
      setRegion(r);
      track("region_switch", { from: fromCode, to: r.code });
    },
    []
  );

  // Render-time adjustment: reset hero when region changes
  const heroKey = region.code;
  const [prevHeroKey, setPrevHeroKey] = useState(heroKey);
  if (prevHeroKey !== heroKey) {
    setPrevHeroKey(heroKey);
    setHero(null);
    setHeroLoading(true);
  }

  // Hero: #1 trending for the region (fallback to #2 if no backdrop)
  useEffect(() => {
    let alive = true;
    tmdbFetch<ListResponse>("trending/all/day", region.code ? { region: region.code } : {})
      .then((d) => {
        if (!alive) return;
        const clean = (d.results || []).filter(
          (r) => r.backdrop_path && r.media_type !== "person" && r.overview
        );
        setHero(clean[0] || null);
        setHeroLoading(false);
      })
      .catch(() => {
        if (alive) {
          setHero(null);
          setHeroLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [region.code]);

  const rows = useMemo(() => buildRows(region), [region]);
  const visibleRows = useMemo(
    () => rows.filter((r) => !r.hideFor?.includes(region.code)),
    [rows, region.code]
  );

  const openInfo = useCallback((item: TmdbItem) => {
    const isTv = item.media_type === "tv" || (!item.title && !!item.name);
    track("detail_open", { id: item.id, mediaType: isTv ? "tv" : "movie" });
    setDetailItem({ id: item.id, mediaType: isTv ? "tv" : "movie" });
  }, []);

  const openInfoById = useCallback((id: number, mediaType: "movie" | "tv") => {
    track("detail_open", { id, mediaType });
    setDetailItem({ id, mediaType });
  }, []);

  const handleToggle = useCallback(
    (item: Parameters<typeof toggle>[0]) => {
      const added = toggle(item);
      track("my_list", { id: item.id, action: added ? "add" : "remove" });
      if (added) {
        document.title = `✓ ${item.title} — My List | MovieBox`;
        setTimeout(() => {
          document.title = "MovieBox International — Stream Worldwide on Windows";
        }, 1600);
      }
    },
    [toggle]
  );

  const openDownloadPopup = useCallback(() => setPopupOpen(true), []);

  return (
    <div id="app-root" className="min-h-screen bg-[#0A0A0F] text-white">
      <PlatformGate blockedPlatforms={settings.blockedPlatforms} />

      <Navbar
        region={region}
        onRegionChange={(r) => changeRegion(r, region.code)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenMyList={() => {
          document.getElementById("my-list")?.scrollIntoView({ behavior: "smooth" });
        }}
        myListCount={myList.length}
        onDownload={openDownloadPopup}
      />

      <main>
        <HeroBillboard
          item={hero}
          loading={heroLoading}
          onPlay={(item) => openInfo(item)}
          onInfo={openInfo}
          regionLabel={region.label}
          onDownload={openDownloadPopup}
        />

        <div className="relative z-20 -mt-[8vh] space-y-1 sm:-mt-[10vh]">
          <ContentRow
            config={visibleRows[0]}
            region={region}
            onInfo={openInfo}
            onDownload={openDownloadPopup}
            inList={has}
            onToggleList={handleToggle}
          />

          <Top10Row onInfo={openInfo} region={region} />

          {listLoaded && myList.length > 0 && (
            <MyListRow
              items={myList}
              loaded={listLoaded}
              onRemove={handleToggle}
              onInfo={openInfoById}
            />
          )}

          {visibleRows.slice(1).map((config) => (
            <ContentRow
              key={config.id}
              config={config}
              region={region}
              onInfo={openInfo}
              onDownload={openDownloadPopup}
              inList={has}
              onToggleList={handleToggle}
            />
          ))}
        </div>
      </main>

      <Footer onDownload={openDownloadPopup} />

      <DetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        inList={has}
        onToggleList={handleToggle}
        onOpenItem={openInfoById}
        onDownload={openDownloadPopup}
      />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} onInfo={openInfo} />

      <FloatingDownloadBar onTriggered={openDownloadPopup} />

      <DownloadPopup
        open={popupOpen}
        message={settings.popupMessage}
        onClose={() => setPopupOpen(false)}
      />
    </div>
  );
}
