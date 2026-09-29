// ============================================================
// POST|GET /api/track — analytics beacon.
// Platform/device is ALWAYS stamped server-side from the real
// user agent (client can't lie about it here).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requestContext } from "@/lib/request-context";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "page_view",
  "region_switch",
  "detail_open",
  "trailer_open",
  "blocked",
  "auto_redirect",
  "search",
  "my_list",
]);

async function handle(req: NextRequest): Promise<NextResponse> {
  try {
    let body: Record<string, unknown> = {};
    if (req.method === "POST") {
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        /* empty body allowed (query-param beacons) */
      }
    }
    const q = new URL(req.url).searchParams;
    const type = String(body.type ?? q.get("type") ?? "");
    if (!ALLOWED.has(type)) {
      return NextResponse.json({ ok: false, error: "unknown type" }, { status: 400 });
    }

    const ctx = await requestContext();
    const metaRaw = body.meta;
    const meta =
      metaRaw && typeof metaRaw === "object" && !Array.isArray(metaRaw)
        ? (metaRaw as Record<string, unknown>)
        : {};

    await getStore().insertEvent({
      type,
      sessionId: String(body.sessionId ?? q.get("sid") ?? "").slice(0, 64),
      platform: ctx.platform,
      device: ctx.device,
      region: String(body.region ?? q.get("region") ?? "").slice(0, 8),
      path: String(body.path ?? q.get("path") ?? "/").slice(0, 200),
      referrer: ctx.referrer.slice(0, 300),
      meta,
    });
    return NextResponse.json({ ok: true });
  } catch {
    // Analytics must never break the client — swallow everything.
    return NextResponse.json({ ok: false });
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
