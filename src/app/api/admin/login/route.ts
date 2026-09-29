// ============================================================
// POST /api/admin/login — password → httpOnly admin cookie.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { adminPassword, setAdminCookie } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let password = "";
  try {
    const body = (await req.json()) as { password?: string };
    password = String(body.password || "");
  } catch {
    /* ignore */
  }

  if (!password || password !== adminPassword()) {
    return NextResponse.json({ ok: false, error: "Wrong password" }, { status: 401 });
  }

  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
