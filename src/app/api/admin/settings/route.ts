// ============================================================
// GET|POST /api/admin/settings — view / update the runtime
// settings (blocklist, auto-redirect, popup copy, download URL).
// Changes take effect on the public site within ~10 seconds
// (settings cache TTL) — no redeploy needed.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getStore, PLATFORM_KEYS, clampSeconds } from "@/lib/store";
import { getSettings, invalidateSettingsCache } from "@/lib/settings-server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ settings: await getSettings() });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if (Array.isArray(body.blockedPlatforms)) {
    patch.blockedPlatforms = (body.blockedPlatforms as unknown[])
      .map(String)
      .filter((p) => (PLATFORM_KEYS as readonly string[]).includes(p));
  }
  if (typeof body.autoRedirectEnabled === "boolean") {
    patch.autoRedirectEnabled = body.autoRedirectEnabled;
  }
  if (body.autoRedirectSeconds !== undefined) {
    patch.autoRedirectSeconds = clampSeconds(Number(body.autoRedirectSeconds));
  }
  if (body.popupMessage !== undefined) {
    patch.popupMessage = String(body.popupMessage).slice(0, 200);
  }
  if (body.downloadUrl !== undefined) {
    patch.downloadUrl = String(body.downloadUrl).trim().slice(0, 1000);
  }

  try {
    const settings = await getStore().saveSettings(patch);
    invalidateSettingsCache();
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "save failed" },
      { status: 500 }
    );
  }
}
