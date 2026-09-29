"use client";

// ============================================================
// Footer — Netflix-flavored: big "Get the app" CTA, link
// columns, social row, platform availability badges (which
// mirrors the admin blocklist), discreet admin console link.
// ============================================================

import DownloadButton, { DownloadIcon } from "./download-button";

const COLUMNS: { title: string; links: string[] }[] = [
  { title: "Company", links: ["About MovieBox", "Newsroom", "Careers", "Investors"] },
  { title: "Support", links: ["Help Center", "Windows Requirements", "Contact Us", "Speed Test"] },
  { title: "Legal", links: ["Terms of Use", "Privacy", "Cookie Preferences", "DMCA"] },
  { title: "Regions", links: ["India", "United States", "United Kingdom", "South Korea", "Japan", "Latin America"] },
];

const SOCIAL = [
  {
    label: "Facebook",
    path: "M13.5 9H16l.5-3h-3V4.5c0-.87.22-1.5 1.5-1.5H17V.14C16.74.1 15.75 0 14.6 0 12.2 0 10.5 1.49 10.5 4.2V6H8v3h2.5v9h3z",
  },
  {
    label: "X",
    path: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z",
  },
  {
    label: "Instagram",
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm6.41-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z",
  },
  {
    label: "YouTube",
    path: "M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.51 3.55 12 3.55 12 3.55s-7.51 0-9.38.5A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.87.5 9.38.5 9.38.5s7.51 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.55 15.57V8.43L15.82 12z",
  },
];

export default function Footer({ onDownload }: { onDownload: () => void }) {
  return (
    <footer className="mt-10 border-t border-white/5 bg-[#050507]">
      <div className="mx-auto max-w-[1500px] px-6 py-12 sm:px-10 lg:px-14">
        {/* THE app pitch — clean, confident, no self-deprecating copy */}
        <div className="mb-12 overflow-hidden rounded-2xl border border-[#E50914]/25 bg-gradient-to-r from-[#E50914]/15 via-[#B20710]/10 to-transparent p-6 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-black leading-tight text-white sm:text-3xl">
                Ready for the great movies?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70 sm:text-base">
                MovieBox brings the world&apos;s biggest movies and series to your Windows
                desktop in up to 4K. Download the free app and start watching in minutes.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#E50914] px-3 py-1 text-[11px] font-bold text-white shadow-[0_4px_14px_rgba(229,9,20,0.4)]">
                  ✓ Windows 10/11
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-white/50">
                  More platforms coming soon
                </span>
              </div>
            </div>
            <div className="shrink-0">
              <DownloadButton
                src="footer"
                onTriggered={onDownload}
                className="flex items-center gap-2.5 rounded-lg bg-[#E50914] px-8 py-4 text-base font-bold text-white shadow-[0_10px_36px_rgba(229,9,20,0.55)] transition hover:scale-[1.02] hover:bg-[#F6121D]"
              >
                <DownloadIcon className="h-5 w-5 fill-current" />
                Download App — Free
              </DownloadButton>
              <p className="mt-2.5 text-center text-[11px] text-white/40">
                Free installer · Windows 10/11
              </p>
            </div>
          </div>
        </div>

        {/* Social */}
        <div className="mb-8 flex items-center gap-5">
          {SOCIAL.map((s) => (
            <a
              key={s.label}
              href="#top"
              onClick={(e) => e.preventDefault()}
              aria-label={s.label}
              className="text-white/50 transition hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d={s.path} />
              </svg>
            </a>
          ))}
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-8 text-sm md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#top"
                      onClick={(e) => e.preventDefault()}
                      className="text-white/55 transition hover:text-white hover:underline"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/5 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MovieBox International — Windows 10/11 Edition</p>
          <div className="flex items-center gap-4">
            <p className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
              Serving 15 regions · Catalog by TMDB
            </p>
            <a
              href="/admin"
              className="text-white/25 transition hover:text-white/60"
              title="Admin console"
            >
              Admin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
