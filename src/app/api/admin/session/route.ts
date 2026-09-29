// ============================================================
// GET  /api/admin/session — is the current cookie valid?
// DELETE /api/admin/session — logout.
// ============================================================

import { NextResponse } from "next/server";
import { clearAdminCookie, isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ authed: await isAdmin() });
}

export async function DELETE() {
  await clearAdminCookie();
  return NextResponse.json({ ok: true });
}
