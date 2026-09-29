// ============================================================
// Analytics + settings storage layer.
//
// Two interchangeable backends behind one tiny interface:
//  • SupabaseStore  — used when SUPABASE_URL + SERVICE ROLE KEY
//    are configured (production: Vercel / Render / Railway).
//    Talks PostgREST directly over fetch — zero extra deps.
//  • FileStore      — JSONL + JSON files under ./data (default
//    demo mode, works in the sandbox and in Docker volumes).
//
// All writes are server-side only (service role / local fs).
// ============================================================

import { PLATFORM_KEYS, type PlatformKey } from "./platform-meta";

export { PLATFORM_KEYS, PLATFORM_NAMES } from "./platform-meta";
export type { PlatformKey } from "./platform-meta";

export type EventType =
  | "page_view"
  | "region_switch"
  | "detail_open"
  | "trailer_open"
  | "blocked"
  | "download"
  | "auto_redirect"
  | "search"
  | "my_list";

export const EVENT_TYPES: EventType[] = [
  "page_view",
  "region_switch",
  "detail_open",
  "trailer_open",
  "blocked",
  "download",
  "auto_redirect",
  "search",
  "my_list",
];

export interface AnalyticsEventInput {
  type: string;
  sessionId?: string;
  platform?: string;
  device?: string;
  region?: string;
  path?: string;
  referrer?: string;
  meta?: Record<string, unknown>;
}

export interface AnalyticsEventRow {
  id?: number;
  type: string;
  sessionId: string;
  platform: string;
  device: string;
  region: string;
  path: string;
  referrer: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface AppSettings {
  blockedPlatforms: string[];
  autoRedirectEnabled: boolean;
  autoRedirectSeconds: number;
  popupMessage: string;
  downloadUrl: string;
}

export function defaultSettings(): AppSettings {
  let blocked: string[] = ["mobile", "mac", "chromeos", "linux", "other"];
  const env = process.env.BLOCKED_PLATFORMS;
  if (env) {
    try {
      const parsed = JSON.parse(env);
      if (Array.isArray(parsed)) {
        blocked = parsed.map(String).filter((p): p is PlatformKey =>
          (PLATFORM_KEYS as readonly string[]).includes(p)
        );
      }
    } catch {
      /* keep default */
    }
  }
  return {
    blockedPlatforms: blocked,
    autoRedirectEnabled: true,
    autoRedirectSeconds: 20,
    popupMessage: "Download starting… Thank you & enjoy the great movies! 🍿",
    downloadUrl: process.env.APP_DOWNLOAD_URL || "",
  };
}

// ------------------------------------------------------------
// Interface
// ------------------------------------------------------------

export interface Store {
  readonly kind: "supabase" | "local";
  insertEvent(e: AnalyticsEventInput): Promise<void>;
  getAllEvents(): Promise<AnalyticsEventRow[]>;
  getSettings(): Promise<AppSettings>;
  saveSettings(patch: Partial<AppSettings>): Promise<AppSettings>;
  clearEvents(): Promise<void>;
}

// ------------------------------------------------------------
// Supabase (PostgREST over fetch — no SDK dependency)
// ------------------------------------------------------------

class SupabaseStore implements Store {
  readonly kind = "supabase" as const;
  private base: string;
  private key: string;

  constructor(base: string, key: string) {
    this.base = base.replace(/\/$/, "");
    this.key = key;
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      "Content-Type": "application/json",
      ...extra,
    };
  }

  async insertEvent(e: AnalyticsEventInput): Promise<void> {
    const row = {
      type: e.type,
      session_id: e.sessionId || null,
      platform: e.platform || "other",
      device: e.device || "desktop",
      region: e.region || "",
      path: e.path || "/",
      referrer: e.referrer || "",
      meta: e.meta || {},
    };
    const res = await fetch(`${this.base}/rest/v1/analytics_events`, {
      method: "POST",
      headers: this.headers({ Prefer: "return=minimal" }),
      body: JSON.stringify(row),
    });
    if (!res.ok) throw new Error(`supabase insert ${res.status}`);
  }

  async getAllEvents(): Promise<AnalyticsEventRow[]> {
    const out: AnalyticsEventRow[] = [];
    const PAGE = 1000;
    const MAX = 200_000; // hard safety cap
    for (let offset = 0; offset < MAX; offset += PAGE) {
      const res = await fetch(
        `${this.base}/rest/v1/analytics_events?select=id,type,session_id,platform,device,region,path,referrer,meta,created_at&order=id.asc&limit=${PAGE}&offset=${offset}`,
        { headers: this.headers(), cache: "no-store" }
      );
      if (!res.ok) throw new Error(`supabase select ${res.status}`);
      const rows = (await res.json()) as Array<Record<string, unknown>>;
      for (const r of rows) {
        out.push({
          id: typeof r.id === "number" ? r.id : undefined,
          type: String(r.type ?? ""),
          sessionId: String(r.session_id ?? ""),
          platform: String(r.platform ?? "other"),
          device: String(r.device ?? "desktop"),
          region: String(r.region ?? ""),
          path: String(r.path ?? "/"),
          referrer: String(r.referrer ?? ""),
          meta: (r.meta && typeof r.meta === "object" ? r.meta : {}) as Record<string, unknown>,
          createdAt: String(r.created_at ?? new Date().toISOString()),
        });
      }
      if (rows.length < PAGE) break;
    }
    return out;
  }

  async getSettings(): Promise<AppSettings> {
    const res = await fetch(
      `${this.base}/rest/v1/app_settings?id=eq.1&select=blocked_platforms,auto_redirect_enabled,auto_redirect_seconds,popup_message,download_url`,
      { headers: this.headers(), cache: "no-store" }
    );
    if (!res.ok) throw new Error(`supabase settings ${res.status}`);
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    const defaults = defaultSettings();
    if (!rows.length) return defaults;
    const r = rows[0];
    const blocked = Array.isArray(r.blocked_platforms)
      ? (r.blocked_platforms as unknown[]).map(String).filter((p) => (PLATFORM_KEYS as readonly string[]).includes(p))
      : defaults.blockedPlatforms;
    return {
      blockedPlatforms: blocked.length ? blocked : defaults.blockedPlatforms,
      autoRedirectEnabled: r.auto_redirect_enabled !== false,
      autoRedirectSeconds: clampSeconds(Number(r.auto_redirect_seconds ?? 20)),
      popupMessage: String(r.popup_message ?? defaults.popupMessage),
      downloadUrl: String(r.download_url ?? ""),
    };
  }

  async saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const next: AppSettings = {
      blockedPlatforms: patch.blockedPlatforms ?? current.blockedPlatforms,
      autoRedirectEnabled: patch.autoRedirectEnabled ?? current.autoRedirectEnabled,
      autoRedirectSeconds: clampSeconds(patch.autoRedirectSeconds ?? current.autoRedirectSeconds),
      popupMessage: (patch.popupMessage ?? current.popupMessage).slice(0, 200),
      downloadUrl: (patch.downloadUrl ?? current.downloadUrl).slice(0, 1000),
    };
    const res = await fetch(`${this.base}/rest/v1/app_settings`, {
      method: "POST",
      headers: this.headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify({
        id: 1,
        blocked_platforms: next.blockedPlatforms,
        auto_redirect_enabled: next.autoRedirectEnabled,
        auto_redirect_seconds: next.autoRedirectSeconds,
        popup_message: next.popupMessage,
        download_url: next.downloadUrl,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) throw new Error(`supabase save settings ${res.status}`);
    return next;
  }

  async clearEvents(): Promise<void> {
    const res = await fetch(`${this.base}/rest/v1/analytics_events?id=gte.0`, {
      method: "DELETE",
      headers: this.headers({ Prefer: "return=minimal" }),
    });
    if (!res.ok) throw new Error(`supabase clear ${res.status}`);
  }
}

// ------------------------------------------------------------
// Local file store (demo / sandbox / Docker volume)
// ------------------------------------------------------------

import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";

class FileStore implements Store {
  readonly kind = "local" as const;
  private dir: string;

  constructor(dir: string) {
    this.dir = dir;
  }

  private eventsPath(): string {
    return path.join(this.dir, "analytics.jsonl");
  }
  private settingsPath(): string {
    return path.join(this.dir, "settings.json");
  }

  private async ensureDir(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
  }

  async insertEvent(e: AnalyticsEventInput): Promise<void> {
    await this.ensureDir();
    const row: AnalyticsEventRow = {
      type: e.type,
      sessionId: (e.sessionId || "").slice(0, 64),
      platform: e.platform || "other",
      device: e.device || "desktop",
      region: (e.region || "").slice(0, 8),
      path: (e.path || "/").slice(0, 200),
      referrer: (e.referrer || "").slice(0, 300),
      meta: e.meta || {},
      createdAt: new Date().toISOString(),
    };
    await appendFile(this.eventsPath(), JSON.stringify(row) + "\n", "utf8");
  }

  async getAllEvents(): Promise<AnalyticsEventRow[]> {
    try {
      const raw = await readFile(this.eventsPath(), "utf8");
      const out: AnalyticsEventRow[] = [];
      for (const line of raw.split("\n")) {
        if (!line.trim()) continue;
        try {
          out.push(JSON.parse(line) as AnalyticsEventRow);
        } catch {
          /* skip malformed line */
        }
      }
      return out;
    } catch {
      return [];
    }
  }

  async getSettings(): Promise<AppSettings> {
    try {
      const raw = await readFile(this.settingsPath(), "utf8");
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      const defaults = defaultSettings();
      return {
        blockedPlatforms: Array.isArray(parsed.blockedPlatforms)
          ? parsed.blockedPlatforms.filter((p) => (PLATFORM_KEYS as readonly string[]).includes(p))
          : defaults.blockedPlatforms,
        autoRedirectEnabled: parsed.autoRedirectEnabled !== false,
        autoRedirectSeconds: clampSeconds(Number(parsed.autoRedirectSeconds ?? 20)),
        popupMessage: String(parsed.popupMessage ?? defaults.popupMessage),
        downloadUrl: String(parsed.downloadUrl ?? defaults.downloadUrl),
      };
    } catch {
      return defaultSettings();
    }
  }

  async saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    await this.ensureDir();
    const current = await this.getSettings();
    const next: AppSettings = {
      blockedPlatforms: patch.blockedPlatforms ?? current.blockedPlatforms,
      autoRedirectEnabled: patch.autoRedirectEnabled ?? current.autoRedirectEnabled,
      autoRedirectSeconds: clampSeconds(patch.autoRedirectSeconds ?? current.autoRedirectSeconds),
      popupMessage: (patch.popupMessage ?? current.popupMessage).slice(0, 200),
      downloadUrl: (patch.downloadUrl ?? current.downloadUrl).slice(0, 1000),
    };
    await writeFile(this.settingsPath(), JSON.stringify(next, null, 2), "utf8");
    return next;
  }

  async clearEvents(): Promise<void> {
    await this.ensureDir();
    await writeFile(this.eventsPath(), "", "utf8");
  }
}

// ------------------------------------------------------------
// Singleton accessor
// ------------------------------------------------------------

let cached: Store | null = null;

export function getStore(): Store {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_KEY;
  if (url && key) {
    cached = new SupabaseStore(url, key);
  } else {
    cached = new FileStore(process.env.DATA_DIR || path.join(process.cwd(), "data"));
  }
  return cached;
}

export function clampSeconds(n: number): number {
  if (!Number.isFinite(n)) return 20;
  return Math.min(600, Math.max(5, Math.round(n)));
}
