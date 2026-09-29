// ============================================================
// Platform metadata shared by server AND client code.
// (store.ts re-exports these — client components import from
// here to avoid pulling node:fs into the browser bundle.)
// ============================================================

export const PLATFORM_KEYS = ["windows", "mobile", "mac", "chromeos", "linux", "other"] as const;
export type PlatformKey = (typeof PLATFORM_KEYS)[number];

export const PLATFORM_NAMES: Record<string, string> = {
  windows: "Windows 10/11",
  mobile: "Android / iOS",
  mac: "macOS",
  chromeos: "ChromeOS",
  linux: "Linux",
  other: "Unknown",
};

export const EVENT_LABELS: Record<string, string> = {
  page_view: "Page view",
  region_switch: "Region switch",
  detail_open: "Title opened",
  trailer_open: "Trailer played",
  blocked: "Blocked",
  download: "App download",
  auto_redirect: "20s auto-redirect",
  search: "Search",
  my_list: "My List",
};
