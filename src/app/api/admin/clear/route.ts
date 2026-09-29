// ============================================================
// POST /api/admin/clear — wipe all analytics events (danger
// zone action in the dashboard). Settings are kept.
// ============================================================

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    await getStore().clearEvents();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "clear failed" },
      { status: 500 }
    );
  }
}
