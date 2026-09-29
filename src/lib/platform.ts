// ============================================================
// Platform detection — pure & shareable (server + client).
// MovieBox is Windows-desktop-only: Linux / Android / iOS /
// macOS / ChromeOS are blocked, exactly as before, but now
// enforced in three layers:
//   1. Server: blocked UAs never receive the app bundle
//   2. Inline pre-paint script: no flash of app content
//   3. Client: DOM strip + re-check after hydration
// ============================================================

export type Platform =
  | "windows"
  | "mac"
  | "mobile"
  | "chromeos"
  | "linux"
  | "other";

export function detectPlatform(ua: string): Platform {
  const s = (ua || "").toLowerCase();

  const isMobile =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|silk/i.test(s);

  const isMac =
    /macintosh|mac os x|mac_?os/.test(s) && !/iphone|ipad|ipod/.test(s);

  const isChromeOS =
    /\bcros\b|chromebook|crkey/.test(s);

  const isLinux =
    /linux|x11/.test(s) && !/android/.test(s) && !isChromeOS;

  const isWindows =
    /windows|win32|win64|win_?nt/.test(s);

  // Order matters: mobile tablets may embed "like Mac OS X", etc.
  if (isMobile) return "mobile";
  if (isWindows) return "windows";
  if (isMac) return "mac";
  if (isChromeOS) return "chromeos";
  if (isLinux) return "linux";
  if (isWindows) return "windows";
  return "other";
}

export const PLATFORM_COPY: Record<
  Exclude<Platform, "windows">,
  { badge: string; title: string; message: string; icon: string }
> = {
  mobile: {
    badge: "Android / iOS Not Supported",
    title: "MovieBox is Windows-only",
    message:
      "You're on a phone or tablet — MovieBox streams in a Windows desktop app. Open this site on a Windows 10/11 PC to continue.",
    icon: "mobile",
  },
  mac: {
    badge: "macOS Not Supported",
    title: "MovieBox is Windows-only",
    message:
      "You're on a Mac — MovieBox is built for Windows 10/11 and doesn't run on macOS. Open this site on a Windows PC to continue.",
    icon: "mac",
  },
  chromeos: {
    badge: "ChromeOS Not Supported",
    title: "MovieBox is Windows-only",
    message:
      "You're on a Chromebook — MovieBox requires a Windows 10/11 PC. Open this site on Windows to continue.",
    icon: "chromeos",
  },
  linux: {
    badge: "Linux Not Supported",
    title: "MovieBox is Windows-only",
    message:
      "You're on Linux — MovieBox is a Windows app and doesn't run on Linux distros. Open this site on a Windows 10/11 PC to continue.",
    icon: "linux",
  },
  other: {
    badge: "Windows PC Required",
    title: "MovieBox is Windows-only",
    message:
      "MovieBox is built for Windows 10/11 only. Please open this site on a Windows PC to continue.",
    icon: "windows",
  },
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  windows: "Windows 10/11 detected",
  mac: "macOS",
  mobile: "Mobile / Tablet",
  chromeos: "ChromeOS",
  linux: "Linux",
  other: "Unknown platform",
};
