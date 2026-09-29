"use client";

// ============================================================
// DownloadButton — the ONE true download CTA. Every surface
// (navbar, hero, modal, footer, floating bar) uses this, so
// every click: (1) opens the thank-you popup via onTriggered,
// (2) hits /api/download which logs the event and redirects to
// the installer.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { downloadHref, markDownloaded } from "@/lib/download";

interface Props {
  src: string;
  onTriggered?: () => void;
  className?: string;
  children?: React.ReactNode;
  ariaLabel?: string;
}

export default function DownloadButton({ src, onTriggered, className = "", children, ariaLabel }: Props) {
  // debounce double-clicks so one click = one counted download
  const lastRef = useRef(0);

  // SSR renders a static href (sessionStorage doesn't exist server-side);
  // after hydration we enrich it with the session id + active region.
  const [href, setHref] = useState(`/api/download?src=${encodeURIComponent(src)}`);
  useEffect(() => {
    setHref(downloadHref(src));
  }, [src]);

  return (
    <a
      href={href}
      aria-label={ariaLabel || "Download the MovieBox app"}
      onClick={() => {
        const now = Date.now();
        if (now - lastRef.current < 1200) return; // debounce
        lastRef.current = now;
        markDownloaded();
        onTriggered?.();
      }}
      className={className}
    >
      {children}
    </a>
  );
}

export function DownloadIcon({ className = "h-4 w-4 fill-current" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z" />
    </svg>
  );
}
