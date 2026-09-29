// ============================================================
// GET /api/download — THE download funnel endpoint.
// Logs a "download" event (admin dashboard counts it), then
// 302-redirects to the real installer:
//   • APP_DOWNLOAD_URL / admin-configured URL if set
//   • else the bundled placeholder public/downloads/MovieBox-Setup.zip
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { getSettings } from "@/lib/settings-server";
import { requestContext } from "@/lib/request-context";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams;
  const src = (q.get("src") || "direct").slice(0, 40);

  // Log the download event (never block the redirect on failure)
  try {
    const ctx = await requestContext();
    await getStore().insertEvent({
      type: "download",
      sessionId: (q.get("sid") || "").slice(0, 64),
      platform: ctx.platform,
      device: ctx.device,
      region: (q.get("region") || "").slice(0, 8),
      path: "/",
      referrer: ctx.referrer.slice(0, 300),
      meta: { src },
    });
  } catch {
    /* ignore */
  }

  // Where does the installer live?
  let target = "";
  try {
    const settings = await getSettings();
    target = (settings.downloadUrl || "").trim();
  } catch {
    /* ignore */
  }

  if (target) {
    const url = /^https?:\/\//i.test(target)
      ? target
      : new URL(target, req.url).toString();
    return NextResponse.redirect(url, 302);
  }

  return NextResponse.redirect(
    new URL("/downloads/MovieBox-Setup.zip", req.url).toString(),
    302
  );
}
