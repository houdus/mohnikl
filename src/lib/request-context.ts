// ============================================================
// Server request context — user-agent derived platform/device
// info + referrer, shared by /api/track and /api/download.
// ============================================================

import { headers } from "next/headers";
import { detectPlatform } from "./platform";

export interface RequestContext {
  ua: string;
  platform: string;
  device: string;
  referrer: string;
  country: string;
}

export async function requestContext(): Promise<RequestContext> {
  const h = await headers();
  const ua = h.get("user-agent") || "";
  const platform = detectPlatform(ua);
  return {
    ua,
    platform,
    device: platform === "mobile" ? "mobile" : "desktop",
    referrer: h.get("referer") || "",
    country: h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || "",
  };
}
