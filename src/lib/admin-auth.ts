// ============================================================
// Admin dashboard auth — simple password → signed httpOnly
// cookie. Set ADMIN_PASSWORD (and optionally ADMIN_SECRET) in
// the environment. Good enough for a back-office stats page;
// Supabase RLS keeps the data itself locked down.
// ============================================================

import { createHash } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "mb_admin";
const MAX_AGE = 60 * 60 * 12; // 12h

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "moviebox-admin";
}

export function adminToken(): string {
  const secret = process.env.ADMIN_SECRET || "moviebox-admin-secret";
  return createHash("sha256").update(`${adminPassword()}::${secret}`).digest("hex");
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value === adminToken();
}

export async function setAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
