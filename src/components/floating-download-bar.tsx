"use client";

// ============================================================
// FloatingDownloadBar — persistent bottom funnel pill.
// Appears once the visitor scrolls past the hero (or after 6s
// on mobile). One more "always download app" surface.
// ============================================================

import { useEffect, useState } from "react";
import DownloadButton, { DownloadIcon } from "./download-button";

export default function FloatingDownloadBar({ onTriggered }: { onTriggered: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const t = setTimeout(() => setVisible(true), 8000); // mobile users who never scroll
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(t);
    };
  }, []);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      aria-hidden={!visible}
    >
      <div
        className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-[#101017]/95 py-2 pl-4 pr-2 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-md"
      >
        <p className="text-xs font-medium text-white/75 sm:text-sm">
          🎬 Watching happens in the app
        </p>
        <DownloadButton
          src="floating"
          onTriggered={onTriggered}
          className="flex items-center gap-1.5 rounded-full bg-[#E50914] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_16px_rgba(229,9,20,0.5)] transition hover:bg-[#F6121D] sm:text-sm"
        >
          <DownloadIcon className="h-4 w-4 fill-current" />
          Download App
        </DownloadButton>
      </div>
    </div>
  );
}
