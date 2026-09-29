// ============================================================
// GET /api/health — deployment health check (Render/Railway).
// ============================================================

import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "moviebox-international",
    store: getStore().kind,
    time: new Date().toISOString(),
  });
}
