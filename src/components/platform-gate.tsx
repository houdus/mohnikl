"use client";

// ============================================================
// PlatformGate — client layer of the platform enforcement.
// The server already refuses to ship the app to blocked UAs
// (per the admin-configurable blocklist). This component
// re-verifies with the browser's real navigator.userAgent
// (catches header-spoofing clients) and, on mismatch, covers
// the app with an opaque gate overlay. It NEVER mutates
// React-owned DOM (that breaks hydration).
// ============================================================

import { useEffect, useState } from "react";
import { detectPlatform, PLATFORM_COPY } from "@/lib/platform";
import { track } from "@/lib/tracker";

interface Props {
  blockedPlatforms: string[];
}

export default function PlatformGate({ blockedPlatforms }: Props) {
  const [blockedAs, setBlockedAs] = useState<null | keyof typeof PLATFORM_COPY>(null);

  useEffect(() => {
    const platform = detectPlatform(navigator.userAgent);
    if (platform !== "windows" && blockedPlatforms.includes(platform)) {
      // Mismatch between header UA and browser UA → cover the app.
      // The overlay is opaque and full-screen; also kill scrolling.
      document.body.style.overflow = "hidden";
      track("blocked", { via: "client" });
      queueMicrotask(() => setBlockedAs(platform));
    } else {
      // Confirmed allowed — ensure the inline pre-paint class is gone
      document.documentElement.classList.remove("mb-blocked");
    }
  }, [blockedPlatforms]);

  if (!blockedAs) return null;
  const copy = PLATFORM_COPY[blockedAs];

  return (
    <div
      id="client-gate"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050507] p-6"
      role="alertdialog"
      aria-label={copy.title}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0C0C11] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E50914] to-[#B20710] shadow-[0_10px_30px_rgba(229,9,20,0.45)]">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white">
            <path d="M3 5.5L10 4.5V11H3V5.5M10 19.5L3 18.5V12H10V19.5M11 4.4L21 3V11H11V4.4M21 21L11 19.6V12H21V21Z" />
          </svg>
        </div>
        <span className="mb-3 inline-block rounded-full bg-[#E50914]/15 px-3 py-1 text-xs font-semibold text-[#FF4D55]">
          {copy.badge}
        </span>
        <h1 className="text-2xl font-bold text-white">{copy.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">{copy.message}</p>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/40">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M3 5.5L10 4.5V11H3V5.5M10 19.5L3 18.5V12H10V19.5M11 4.4L21 3V11H11V4.4M21 21L11 19.6V12H21V21Z" />
          </svg>
          Windows 10 / 11 required
        </div>
      </div>
    </div>
  );
}
