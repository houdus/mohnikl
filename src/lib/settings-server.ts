// ============================================================
// Server-side settings access with a short TTL cache, so the
// gate check on every request doesn't hammer the store.
// ============================================================

import { getStore, type AppSettings } from "./store";

let cache: { at: number; value: AppSettings } | null = null;
const TTL = 10_000; // 10s

export function invalidateSettingsCache(): void {
  cache = null;
}

export async function getSettings(): Promise<AppSettings> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  try {
    const value = await getStore().getSettings();
    cache = { at: Date.now(), value };
    return value;
  } catch {
    // Store misconfigured (e.g. Supabase unreachable) — fall back
    // to safe defaults rather than crashing the page.
    const { defaultSettings } = await import("./store");
    return defaultSettings();
  }
}
