// ============================================================
// MovieBox International — main page (server component).
// Platform enforcement (Layer 1): the user agent is checked
// HERE on the server against the admin-configurable blocklist.
// Blocked devices receive ONLY the gate screen — no app markup,
// no JS bundles (one tiny beacon script counts the block),
// no API data. The gate ALSO logs the block for the dashboard.
// ============================================================

import { headers } from "next/headers";
import { detectPlatform } from "@/lib/platform";
import { getSettings } from "@/lib/settings-server";
import GateScreen from "@/components/gate-screen";
import AppShell from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function Page() {
  const h = await headers();
  const ua = h.get("user-agent") || "";
  const platform = detectPlatform(ua);
  const settings = await getSettings();

  if (settings.blockedPlatforms.includes(platform)) {
    return <GateScreen userAgent={ua} platform={platform} />;
  }

  return (
    <AppShell
      settings={{
        blockedPlatforms: settings.blockedPlatforms,
        autoRedirectEnabled: settings.autoRedirectEnabled,
        autoRedirectSeconds: settings.autoRedirectSeconds,
        popupMessage: settings.popupMessage,
      }}
    />
  );
}
