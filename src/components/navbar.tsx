"use client";

// ============================================================
// Navbar — Netflix-style: transparent over hero, solid on
// scroll. Includes the INTERNATIONAL region switcher, live
// search trigger, and My List shortcut.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { REGIONS, type Region } from "@/lib/tmdb";
import DownloadButton, { DownloadIcon } from "./download-button";

interface NavbarProps {
  region: Region;
  onRegionChange: (r: Region) => void;
  onOpenSearch: () => void;
  onOpenMyList: () => void;
  myListCount: number;
  onDownload: () => void;
}

const NAV_LINKS = [
  { label: "Home", href: "#top" },
  { label: "Trending", href: "#row-trending" },
  { label: "Top 10", href: "#row-top10" },
  { label: "TV Shows", href: "#row-worldTV" },
  { label: "My List", href: "#my-list" },
];

export default function Navbar({
  region,
  onRegionChange,
  onOpenSearch,
  onOpenMyList,
  myListCount,
  onDownload,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) {
        setRegionOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header
      id="mb-navbar"
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0A0A0F]/95 shadow-lg backdrop-blur-md"
          : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[1800px] items-center gap-2 px-4 sm:h-[70px] sm:gap-6 sm:px-8 lg:px-12">
        {/* Brand */}
        <a href="#top" className="flex shrink-0 items-center gap-2" aria-label="MovieBox home">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-[#E50914] to-[#B20710] shadow-[0_4px_14px_rgba(229,9,20,0.5)]">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="text-lg font-black tracking-tight text-[#E50914] sm:text-xl">
            MOVIE<span className="text-white">BOX</span>
          </span>
        </a>

        {/* Links */}
        <ul className="ml-2 hidden items-center gap-5 text-sm text-white/75 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="transition-colors hover:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .querySelector(l.href === "#top" ? "body" : l.href)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {l.label}
                {l.label === "My List" && myListCount > 0 && (
                  <span className="ml-1 rounded-full bg-[#E50914] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {myListCount}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          {/* THE download CTA — watching happens in the app, not here */}
          <DownloadButton
            src="navbar"
            onTriggered={onDownload}
            className="flex items-center gap-1.5 rounded-md bg-[#E50914] px-3 py-1.5 text-xs font-bold text-white shadow-[0_4px_16px_rgba(229,9,20,0.45)] transition hover:bg-[#F6121D] sm:px-4 sm:py-2 sm:text-sm"
          >
            <DownloadIcon className="h-4 w-4 fill-current" />
            <span className="hidden sm:inline">Download App</span>
            <span className="sm:hidden">App</span>
          </DownloadButton>

          {/* Region switcher — the international control */}
          <div className="relative" ref={regionRef}>
            <button
              onClick={() => setRegionOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1.5 text-xs font-semibold text-white/90 transition hover:border-white/40 sm:px-3.5 sm:text-sm"
              aria-haspopup="listbox"
              aria-expanded={regionOpen}
              aria-label={`Region: ${region.label}`}
            >
              <span className="text-base leading-none">{region.flag}</span>
              <span className="hidden sm:inline">{region.label}</span>
              <svg
                viewBox="0 0 24 24"
                className={`h-3.5 w-3.5 fill-current transition-transform ${regionOpen ? "rotate-180" : ""}`}
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>

            {regionOpen && (
              <div
                role="listbox"
                aria-label="Choose region"
                className="absolute right-0 top-12 max-h-[70vh] w-64 overflow-y-auto rounded-xl border border-white/10 bg-[#101017] p-1.5 shadow-2xl"
              >
                <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-white/40">
                  Choose your country
                </p>
                {REGIONS.map((r) => (
                  <button
                    key={r.code || "global"}
                    role="option"
                    aria-selected={r.code === region.code}
                    onClick={() => {
                      onRegionChange(r);
                      setRegionOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                      r.code === region.code
                        ? "bg-[#E50914]/20 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="text-lg leading-none">{r.flag}</span>
                    <span className="flex-1">{r.label}</span>
                    {r.code === region.code && (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#E50914]">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <button
            onClick={onOpenSearch}
            className="grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Search movies and shows"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
            </svg>
          </button>

          {/* My List */}
          <button
            onClick={onOpenMyList}
            className="relative grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="My List"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
            </svg>
            {myListCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#E50914] px-1 text-[9px] font-bold text-white">
                {myListCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
