"use client";

// ============================================================
// Download funnel helpers — every "Download App" surface goes
// through /api/download so the server logs the event (admin
// dashboard counts it), then redirects to the real installer
// (APP_DOWNLOAD_URL) or the bundled placeholder package.
// ============================================================

import { regionOf, sessionId } from "./tracker";

const DONE_KEY = "moviebox.downloaded.v1";

export function markDownloaded(): void {
  try {
    sessionStorage.setItem(DONE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function wasDownloaded(): boolean {
  try {
    return sessionStorage.getItem(DONE_KEY) === "1";
  } catch {
    return false;
  }
}

export function downloadHref(src: string): string {
  const qs = new URLSearchParams({ src, sid: sessionId(), region: regionOf() });
  return `/api/download?${qs.toString()}`;
}

/** Kick off the installer download + mark the session. */
export function triggerDownload(src: string): void {
  markDownloaded();
  try {
    window.location.href = downloadHref(src);
  } catch {
    /* ignore */
  }
}
