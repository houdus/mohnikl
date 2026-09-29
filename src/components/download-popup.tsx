"use client";

// ============================================================
// DownloadPopup — the funnel closer. Shown whenever a download
// is triggered (manual CTA or the 20-second auto-redirect):
//   "Download starting… Thank you & enjoy the great movies! 🍿"
// Copy is editable from the admin dashboard (popupMessage).
// ============================================================

import { useEffect } from "react";
import DownloadButton, { DownloadIcon } from "./download-button";

interface Props {
  open: boolean;
  message: string;
  onClose: () => void;
  region?: string;
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
      aria-label="Download starting"
      onClick={onClose}
    >
      <div
        className="mb-pop w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#101017] p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouncing download icon */}
        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-[#E50914] to-[#B20710] shadow-[0_10px_40px_rgba(229,9,20,0.5)]">
          <DownloadIcon className="mb-bounce h-9 w-9 fill-white" />
        </div>

        <h2 className="text-xl font-black text-white sm:text-2xl">Download starting…</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-white/75">{message}</p>

        {/* Progress shimmer */}
        <div className="relative mt-6 h-1.5 overflow-hidden rounded-full bg-white/10 mb-shimmer" />

        <p className="mt-3 text-[11px] text-white/40">
          Streaming happens inside the Windows app — not on this website.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            className="rounded-md px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Keep browsing
          </button>
          <DownloadButton
            src="popup-retry"
            onTriggered={undefined}
            className="flex items-center gap-2 rounded-md bg-[#E50914] px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(229,9,20,0.45)] transition hover:bg-[#F6121D]"
          >
            <DownloadIcon className="h-4 w-4 fill-current" />
            Download again
          </DownloadButton>
        </div>
      </div>
    </div>
  );
}
