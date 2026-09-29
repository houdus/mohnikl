"use client";

// ============================================================
// DownloadPopup — the funnel closer. Shown whenever a download
// is triggered (manual CTA or the 20-second auto-redirect):
//   "Download started — thank you & enjoy the great movies!"
// Copy is editable from the admin dashboard (popupMessage).
// ============================================================

import { useEffect } from "react";
import DownloadButton, { DownloadIcon } from "./download-button";

interface Props {
  open: boolean;
  message: string;
  onClose: () => void;
}

export default function DownloadPopup({ open, message, onClose }: Props) {
  // ESC to dismiss + scroll lock while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm mb-fade"
      role="alertdialog"
      aria-modal="true"
      aria-label="Download started"
      onClick={onClose}
    >
      <div
        className="mb-pop w-full max-w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#101017] p-7 text-center shadow-[0_30px_90px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouncing download icon */}
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#E50914] to-[#B20710] shadow-[0_10px_40px_rgba(229,9,20,0.5)]">
          <DownloadIcon className="mb-bounce h-7 w-7 fill-white" />
        </div>

        <h2 className="text-lg font-black text-white sm:text-xl">Download started</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/70">{message}</p>

        {/* Progress shimmer */}
        <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-white/10 mb-shimmer" />

        <div className="mt-6 space-y-2.5">
          <DownloadButton
            src="popup-retry"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E50914] px-5 py-3 text-sm font-bold text-white shadow-[0_6px_20px_rgba(229,9,20,0.45)] transition hover:bg-[#F6121D]"
          >
            <DownloadIcon className="h-4 w-4 fill-current" />
            Download again
          </DownloadButton>
          <button
            onClick={onClose}
            className="w-full rounded-lg px-5 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            Keep browsing
          </button>
        </div>

        <p className="mt-5 text-[11px] text-white/35">MovieBox app · Windows 10/11 · Free</p>
      </div>
    </div>
  );
}
