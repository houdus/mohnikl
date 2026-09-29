"use client";

// ============================================================
// Client-side analytics tracker. Fire-and-forget beacons to
// /api/track — the server stamps platform/device from the real
// user agent, the client only supplies session + region + path.
// ============================================================

const SID_KEY = "moviebox.sid.v1";
const REGION_KEY = "moviebox.region.v1";

import { DEFAULT_REGION } from "./tmdb";

export function sessionId(): string {
  try {
    let sid = sessionStorage.getItem(SID_KEY);
    if (!sid) {
      sid =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return "anon";
  }
}

export function regionOf(): string {
  try {
    const raw = localStorage.getItem(REGION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { code?: string };
      const code = String(parsed?.code ?? "");
      if (code) return code;
    }
  } catch {
    /* ignore */
  }
  // Fall back to the site default so events never lose their region
  return DEFAULT_REGION.code || "";
}

export function track(type: string, meta?: Record<string, unknown>): void {
  try {
    const body = JSON.stringify({
      type,
      sessionId: sessionId(),
      region: regionOf(),
      path: typeof location !== "undefined" ? location.pathname : "/",
      meta: meta || {},
    });
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics must never break the page */
  }
}
