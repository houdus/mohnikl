"use client";

// ============================================================
// GateScreen — server-rendered block screen for platforms the
// admin has blocked (Linux / Android / iOS / macOS / ChromeOS).
// Rendered INSTEAD of the app: blocked visitors never receive
// any app JavaScript or data. One tiny inline beacon counts
// the block for the admin dashboard.
// ============================================================

import { detectPlatform, PLATFORM_COPY, type Platform } from "@/lib/platform";

function GateIcon({ platform }: { platform: Platform }) {
  const common = "h-8 w-8 fill-white";
  switch (platform) {
    case "mobile":
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" />
        </svg>
      );
    case "mac":
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="M17.05 12.04c-.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.88 2.65 3.22 2.6 1.29-.05 1.78-.83 3.34-.83 1.56 0 2 .83 3.37.81 1.39-.03 2.27-1.27 3.12-2.53.98-1.45 1.39-2.85 1.41-2.92-.03-.01-2.71-1.04-2.74-4.13zM14.6 4.59c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.98-1.08 3.15 1.14.09 2.3-.58 3.01-1.44z" />
        </svg>
      );
    case "linux":
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="M12 2c-1.66 0-3 1.34-3 3 0 .7.24 1.34.64 1.85C8.5 7.79 7.5 9.5 7.5 12c0 1.5-.5 2.5-1.5 3.5C5 16.5 4 17.5 4 19.5c0 1 .75 1.5 1.5 1.5.5 0 .9-.2 1.2-.5.3.7 1 1 1.8 1 .75 0 1.25-.3 1.5-.8.25.5.75.8 1.5.8s1.25-.3 1.5-.8c.25.5.75.8 1.5.8.8 0 1.5-.3 1.8-1 .3.3.7.5 1.2.5.75 0 1.5-.5 1.5-1.5 0-2-1-3-2-4-1-1-1.5-2-1.5-3.5 0-2.5-1-4.21-2.14-5.15.4-.51.64-1.15.64-1.85 0-1.66-1.34-3-3-3z" />
        </svg>
      );
    case "chromeos":
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <circle cx="12" cy="12" r="11" fill="white" />
          <path d="M12 1a11 11 0 0 1 9.53 5.5h-9.06A4.5 4.5 0 0 0 8.7 13.4L4.2 5.6A11 11 0 0 1 12 1z" fill="#ea4335" />
          <path d="M22.5 8.5a11 11 0 0 1-9.8 14.5l4.6-7.9a4.5 4.5 0 0 0 1.2-5.1l-1-1.8a11 11 0 0 1 5 0.3z" fill="#fbbc05" />
          <path d="M12 22.5a11 11 0 0 1-9.5-16.9l4.5 7.8a4.5 4.5 0 0 0 8.3.5l3.6 6.6A11 11 0 0 1 12 22.5z" fill="#34a853" />
          <circle cx="12" cy="12" r="4.5" fill="#4285f4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="M3 5.5L10 4.5V11H3V5.5M10 19.5L3 18.5V12H10V19.5M11 4.4L21 3V11H11V4.4M21 21L11 19.6V12H21V21Z" />
        </svg>
      );
  }
}

// Blocked-visitor beacon: the ONLY JavaScript a blocked device
// receives. Counts the block for the admin dashboard.
const BLOCK_BEACON = `
try {
  var sid = sessionStorage.getItem('moviebox.sid.v1');
  if (!sid) {
    sid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ('s-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10));
    try { sessionStorage.setItem('moviebox.sid.v1', sid); } catch (e) {}
  }
  fetch('/api/track?type=blocked&sid=' + encodeURIComponent(sid) + '&path=' + encodeURIComponent(location.pathname), { method: 'POST', keepalive: true });
} catch (e) {}
`;

export default function GateScreen({ userAgent, platform }: { userAgent: string; platform?: Platform }) {
  const detected = platform || detectPlatform(userAgent);
  const copy =
    PLATFORM_COPY[(detected === "windows" ? "other" : detected) as Exclude<Platform, "windows">];

  return (
    <div
      id="platform-gate"
      className="flex min-h-screen items-center justify-center bg-[#050507] p-6"
      role="alertdialog"
      aria-label={copy.title}
    >
      <script dangerouslySetInnerHTML={{ __html: BLOCK_BEACON }} />
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0C0C11] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E50914] to-[#B20710] shadow-[0_10px_30px_rgba(229,9,20,0.45)]">
          <GateIcon platform={detected} />
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
