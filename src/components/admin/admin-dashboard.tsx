"use client";

// ============================================================
// MovieBox Admin Dashboard
// • Who viewed the site, on what devices
// • How many blocked (Linux / Android / macOS / iOS / …)
// • How many downloaded the app (and from which surface)
// • 14-day trend charts, region breakdown, live event feed
// • Runtime settings: blocklist, auto-redirect, popup copy,
//   real installer URL — editable without a redeploy
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { PLATFORM_KEYS, PLATFORM_NAMES, EVENT_LABELS } from "@/lib/platform-meta";

interface Settings {
  blockedPlatforms: string[];
  autoRedirectEnabled: boolean;
  autoRedirectSeconds: number;
  popupMessage: string;
  downloadUrl: string;
}

interface Stats {
  store: "supabase" | "local";
  generatedAt: string;
  totals: {
    pageViews: number;
    uniqueVisitors: number;
    downloads: number;
    blocked: number;
    autoRedirects: number;
    detailOpens: number;
    regionSwitches: number;
  };
  platforms: { key: string; views: number; downloads: number; blocked: number; sessions: number }[];
  devices: { key: string; count: number }[];
  regions: { code: string; views: number }[];
  daily: { date: string; views: number; downloads: number; blocked: number }[];
  recent: {
    type: string;
    sessionId: string;
    platform: string;
    region: string;
    path: string;
    createdAt: string;
    meta: Record<string, unknown>;
  }[];
  settings: Settings;
}

const REGION_FLAGS: Record<string, string> = {
  "": "🌍", IN: "🇮🇳", US: "🇺🇸", GB: "🇬🇧", KR: "🇰🇷", JP: "🇯🇵", FR: "🇫🇷",
  DE: "🇩🇪", ES: "🇪🇸", BR: "🇧🇷", MX: "🇲🇽", AU: "🇦🇺", CA: "🇨🇦", NG: "🇳🇬", TR: "🇹🇷",
};

const EVENT_STYLES: Record<string, string> = {
  page_view: "bg-white/10 text-white/70",
  region_switch: "bg-teal-500/15 text-teal-300",
  detail_open: "bg-violet-500/15 text-violet-300",
  trailer_open: "bg-cyan-500/15 text-cyan-300",
  blocked: "bg-[#E50914]/20 text-[#FF6B72]",
  download: "bg-emerald-500/15 text-emerald-300",
  auto_redirect: "bg-amber-500/15 text-amber-300",
  search: "bg-white/10 text-white/60",
  my_list: "bg-white/10 text-white/60",
};

function Kpi({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111119] p-4 sm:p-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">{label}</p>
      <p className={`mt-1.5 text-2xl font-black tabular-nums sm:text-3xl ${accent || "text-white"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111119] p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white sm:text-base">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-white/40">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [form, setForm] = useState<Settings | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [clearArmed, setClearArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const data = (await res.json()) as Stats;
      setStats(data);
      setForm(data.settings);
      setAuthed(true);
    } catch {
      setAuthed(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        const data = (await res.json()) as { authed: boolean };
        if (data.authed) void loadStats();
        else setAuthed(false);
      } catch {
        setAuthed(false);
      }
    })();
  }, [loadStats]);

  // Auto-refresh every 30s while authed
  useEffect(() => {
    if (!authed) return;
    const t = setInterval(() => void loadStats(), 30_000);
    return () => clearInterval(t);
  }, [authed, loadStats]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setPassword("");
        await loadStats();
      } else {
        setLoginError("Wrong password — try again.");
      }
    } catch {
      setLoginError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => {});
    setAuthed(false);
    setStats(null);
  };

  const saveSettings = async () => {
    if (!form) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2500);
        void loadStats();
      }
    } finally {
      setBusy(false);
    }
  };

  const clearAnalytics = async () => {
    if (!clearArmed) {
      setClearArmed(true);
      setTimeout(() => setClearArmed(false), 4000);
      return;
    }
    setBusy(true);
    try {
      await fetch("/api/admin/clear", { method: "POST" });
      setClearArmed(false);
      void loadStats();
    } finally {
      setBusy(false);
    }
  };

  // ---------- Login gate ----------
  if (authed !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F] p-6">
        <form
          onSubmit={login}
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111119] p-8 shadow-2xl"
        >
          <div className="mb-6 text-center">
            <span className="text-lg font-black tracking-tight text-[#E50914]">
              MOVIE<span className="text-white">BOX</span>
            </span>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">
              Admin Console
            </p>
          </div>
          <label htmlFor="admin-password" className="mb-1.5 block text-xs font-semibold text-white/60">
            Admin password
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white outline-none transition focus:border-[#E50914]"
            placeholder="••••••••••••"
          />
          {loginError && <p className="mt-2 text-xs font-semibold text-[#FF6B72]">{loginError}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-lg bg-[#E50914] py-2.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(229,9,20,0.4)] transition hover:bg-[#F6121D] disabled:opacity-60"
          >
            {busy ? "Checking…" : "Enter dashboard"}
          </button>
          <p className="mt-4 text-center text-[11px] leading-relaxed text-white/30">
            Default password: <code className="text-white/50">moviebox-admin</code>
            <br />
            Change it with the <code className="text-white/50">ADMIN_PASSWORD</code> env var.
          </p>
        </form>
      </div>
    );
  }

  if (!stats || !form) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0A0A0F]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-[#E50914]" />
      </div>
    );
  }

  const t = stats.totals;
  const maxDaily = Math.max(1, ...stats.daily.map((d) => Math.max(d.views, d.downloads, d.blocked)));
  const deviceTotal = Math.max(1, stats.devices.reduce((a, d) => a + d.count, 0));

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0F]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <span className="text-lg font-black tracking-tight text-[#E50914]">
            MOVIE<span className="text-white">BOX</span>
            <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              Admin
            </span>
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
              stats.store === "supabase"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-amber-500/15 text-amber-300"
            }`}
          >
            {stats.store === "supabase" ? "Supabase connected" : "Local demo store"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => void loadStats()}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
            >
              ⟳ Refresh
            </button>
            <a
              href="/"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
            >
              View site
            </a>
            <button
              onClick={() => void logout()}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/20"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* KPI grid */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Key metrics">
          <Kpi label="Page views" value={t.pageViews} />
          <Kpi label="Unique visitors" value={t.uniqueVisitors} />
          <Kpi label="App downloads" value={t.downloads} accent="text-emerald-400" />
          <Kpi label="Blocked" value={t.blocked} accent="text-[#FF6B72]" />
          <Kpi label="20s auto-redirects" value={t.autoRedirects} accent="text-amber-300" />
          <Kpi label="Titles opened" value={t.detailOpens} />
        </section>

        {/* Trend */}
        <Card title="Last 14 days" subtitle="Views vs downloads vs blocked visitors (UTC days)">
          <div className="flex h-44 items-end gap-1.5 sm:gap-2.5">
            {stats.daily.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-36 w-full items-end justify-center gap-[3px]">
                  <div
                    className="w-1/3 rounded-t bg-white/25"
                    style={{ height: `${(d.views / maxDaily) * 100}%`, minHeight: d.views ? 3 : 0 }}
                    title={`${d.views} views`}
                  />
                  <div
                    className="w-1/3 rounded-t bg-emerald-500"
                    style={{ height: `${(d.downloads / maxDaily) * 100}%`, minHeight: d.downloads ? 3 : 0 }}
                    title={`${d.downloads} downloads`}
                  />
                  <div
                    className="w-1/3 rounded-t bg-[#E50914]"
                    style={{ height: `${(d.blocked / maxDaily) * 100}%`, minHeight: d.blocked ? 3 : 0 }}
                    title={`${d.blocked} blocked`}
                  />
                </div>
                <span className="text-[9px] text-white/30">{d.date.slice(8)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-white/50">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-white/25" /> Views</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Downloads</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#E50914]" /> Blocked</span>
          </div>
        </Card>

        {/* Devices + platforms */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Devices" subtitle="Desktop vs mobile page views">
            <div className="space-y-4">
              {(["desktop", "mobile"] as const).map((key) => {
                const count = stats.devices.find((d) => d.key === key)?.count || 0;
                const pct = Math.round((count / deviceTotal) * 100);
                return (
                  <div key={key}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold capitalize text-white/80">
                        {key === "desktop" ? "🖥 Desktop" : "📱 Mobile / Tablet"}
                      </span>
                      <span className="tabular-nums text-white/50">
                        {count.toLocaleString()} · {pct}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[#E50914]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Platform split</p>
              {stats.devices.some((d) => d.key === "mobile") && (
                <p className="text-xs leading-relaxed text-white/50">
                  Mobile traffic is expected — Android / iOS / tablets hit the block screen and are counted
                  under &quot;Blocked&quot;, so they rarely generate page views.
                </p>
              )}
            </div>
          </Card>

          <Card title="Platforms" subtitle="Views, downloads and blocks per platform">
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#111119] text-[10px] uppercase tracking-widest text-white/40">
                  <tr>
                    <th className="pb-2 pr-2 font-bold">Platform</th>
                    <th className="pb-2 px-2 font-bold">Views</th>
                    <th className="pb-2 px-2 font-bold">Unique</th>
                    <th className="pb-2 px-2 font-bold">Dlds</th>
                    <th className="pb-2 pl-2 font-bold">Blocked</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {(stats.platforms.length
                    ? stats.platforms
                    : PLATFORM_KEYS.map((k) => ({ key: k, views: 0, downloads: 0, blocked: 0, sessions: 0 }))
                  ).map((p) => (
                    <tr key={p.key} className="border-t border-white/5">
                      <td className="py-2 pr-2 font-semibold text-white/85">{PLATFORM_NAMES[p.key] || p.key}</td>
                      <td className="py-2 px-2 text-white/70">{p.views.toLocaleString()}</td>
                      <td className="py-2 px-2 text-white/70">{p.sessions.toLocaleString()}</td>
                      <td className="py-2 px-2 text-emerald-300">{p.downloads.toLocaleString()}</td>
                      <td className={`py-2 pl-2 ${p.blocked ? "font-bold text-[#FF6B72]" : "text-white/40"}`}>
                        {p.blocked.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Regions + recent */}
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <Card title="Top regions" subtitle="Page views by selected country">
            <div className="max-h-72 space-y-2.5 overflow-y-auto">
              {stats.regions.length === 0 && (
                <p className="text-xs text-white/40">No region data yet — switch regions on the site to generate some.</p>
              )}
              {stats.regions.map((r) => {
                const max = Math.max(1, stats.regions[0].views);
                return (
                  <div key={r.code} className="flex items-center gap-2 text-xs">
                    <span className="w-6 text-base leading-none">{REGION_FLAGS[r.code] || "🌍"}</span>
                    <span className="w-24 shrink-0 truncate text-white/80">{r.code || "Global"}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-teal-400" style={{ width: `${(r.views / max) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right tabular-nums text-white/50">{r.views}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Live event feed" subtitle="Latest 80 raw events">
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#111119] text-[10px] uppercase tracking-widest text-white/40">
                  <tr>
                    <th className="pb-2 pr-2 font-bold">Time</th>
                    <th className="pb-2 px-2 font-bold">Event</th>
                    <th className="pb-2 px-2 font-bold">Platform</th>
                    <th className="pb-2 px-2 font-bold">Region</th>
                    <th className="pb-2 pl-2 font-bold">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-white/40">
                        No events yet — open the site in another tab.
                      </td>
                    </tr>
                  )}
                  {stats.recent.map((e, i) => (
                    <tr key={`${e.createdAt}-${i}`} className="border-t border-white/5">
                      <td className="whitespace-nowrap py-2 pr-2 tabular-nums text-white/50">
                        {new Date(e.createdAt).toLocaleTimeString([], { hour12: false })}
                      </td>
                      <td className="py-2 px-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${EVENT_STYLES[e.type] || "bg-white/10 text-white/70"}`}>
                          {EVENT_LABELS[e.type] || e.type}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-white/70">{PLATFORM_NAMES[e.platform] || e.platform}</td>
                      <td className="py-2 px-2 text-white/60">{e.region || "—"}</td>
                      <td className="py-2 pl-2 text-white/45">
                        {e.type === "download" && typeof e.meta?.src === "string"
                          ? `via ${e.meta.src}`
                          : e.type === "region_switch" && typeof e.meta?.to === "string"
                            ? `→ ${e.meta.to}`
                            : e.path}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Settings */}
        <Card title="Funnel settings" subtitle="Applies to the live site within ~10 seconds — no redeploy needed">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <fieldset>
                <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-white/40">
                  Blocked platforms (kept out of the site)
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORM_KEYS.map((key) => {
                    const checked = form.blockedPlatforms.includes(key);
                    return (
                      <label
                        key={key}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                          checked
                            ? "border-[#E50914]/60 bg-[#E50914]/10 text-white"
                            : "border-white/10 bg-black/30 text-white/55 hover:border-white/25"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              blockedPlatforms: e.target.checked
                                ? [...form.blockedPlatforms, key]
                                : form.blockedPlatforms.filter((p) => p !== key),
                            })
                          }
                          className="h-4 w-4 accent-[#E50914]"
                        />
                        {PLATFORM_NAMES[key]}
                        {checked && <span className="ml-auto text-[10px] text-[#FF6B72]">🚫</span>}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-white/85">Auto-redirect after idle</p>
                  <p className="text-[11px] text-white/40">
                    Visitors who stay get the download popup automatically.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.autoRedirectEnabled}
                  onChange={(e) => setForm({ ...form, autoRedirectEnabled: e.target.checked })}
                  className="h-5 w-5 accent-[#E50914]"
                  aria-label="Enable auto-redirect"
                />
              </div>

              <div>
                <label htmlFor="auto-secs" className="mb-1.5 block text-xs font-semibold text-white/60">
                  Seconds before auto-redirect ({form.autoRedirectSeconds}s)
                </label>
                <input
                  id="auto-secs"
                  type="number"
                  min={5}
                  max={600}
                  value={form.autoRedirectSeconds}
                  onChange={(e) => setForm({ ...form, autoRedirectSeconds: Number(e.target.value) })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-[#E50914]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="popup-msg" className="mb-1.5 block text-xs font-semibold text-white/60">
                  Download popup message
                </label>
                <textarea
                  id="popup-msg"
                  rows={3}
                  value={form.popupMessage}
                  onChange={(e) => setForm({ ...form, popupMessage: e.target.value })}
                  className="w-full resize-none rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label htmlFor="dl-url" className="mb-1.5 block text-xs font-semibold text-white/60">
                  Real installer URL (APP_DOWNLOAD_URL)
                </label>
                <input
                  id="dl-url"
                  type="url"
                  placeholder="https://your-cdn.com/MovieBox-Setup.exe"
                  value={form.downloadUrl}
                  onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-[#E50914]"
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-white/35">
                  Empty = bundled placeholder <code>/downloads/MovieBox-Setup.zip</code>. Point this at your
                  real .exe / .dmg / .apk link when ready.
                </p>
              </div>

              <button
                onClick={() => void saveSettings()}
                disabled={busy}
                className="w-full rounded-lg bg-[#E50914] py-2.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(229,9,20,0.4)] transition hover:bg-[#F6121D] disabled:opacity-60"
              >
                {savedFlash ? "Saved ✓ — live in ~10s" : busy ? "Saving…" : "Save settings"}
              </button>
            </div>
          </div>
        </Card>

        {/* Danger zone */}
        <Card title="Danger zone" subtitle="Settings are kept — only raw analytics events are wiped">
          <button
            onClick={() => void clearAnalytics()}
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              clearArmed
                ? "bg-[#E50914] text-white"
                : "border border-[#E50914]/40 text-[#FF6B72] hover:bg-[#E50914]/10"
            }`}
          >
            {clearArmed ? "Really wipe ALL analytics? Click again" : "Clear analytics data"}
          </button>
        </Card>

        <p className="pb-4 text-center text-[11px] text-white/25">
          Last updated {new Date(stats.generatedAt).toLocaleString()} · auto-refreshes every 30s
          {stats.store === "local" && " · local demo store — add Supabase env vars for production persistence"}
        </p>
      </main>
    </div>
  );
}
