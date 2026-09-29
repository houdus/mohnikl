/* eslint-disable @typescript-eslint/no-require-imports */
// ============================================================
// MovieBox International — E2E verification (Playwright)
// Covers: home render, download CTAs, popup copy, region
// re-rank, modal + trailer, admin login/stats/settings,
// 20s auto-redirect (temporarily 6s), Linux UA gate.
// ============================================================

const { chromium } = require("playwright");

const BASE = "http://localhost:3000";
const SHOT = "/home/z/my-project/download/";
const WIN_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const LINUX_UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const results = [];
const ok = (name, cond) => {
  results.push([name, !!cond]);
  console.log(`${cond ? "PASS" : "FAIL"} — ${name}`);
};

(async () => {
  const browser = await chromium.launch();

  // ---------- Windows visitor ----------
  const ctx = await browser.newContext({
    userAgent: WIN_UA,
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });
  const page = await ctx.newPage();

  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#app-root", { timeout: 20000 });
  await page.waitForTimeout(4000); // hero + rows from TMDB

  ok("home renders app root", await page.isVisible("#app-root"));
  ok("navbar download CTA", (await page.locator('a[href*="src=navbar"]').count()) > 0);
  ok("hero download CTA (red, primary)", (await page.locator('a[href*="src=hero"]').count()) > 0);
  ok("hero has Trailer button", (await page.locator('#hero button:has-text("Trailer")').count()) > 0);
  ok("hero has NO Play button (no watching)", (await page.locator('#hero button:has-text("Play")').count()) === 0);
  await page.screenshot({ path: SHOT + "verify-20-home.png" });

  // Download popup via navbar
  await page.locator('a[href*="src=navbar"]').first().click();
  await page.waitForSelector('[aria-label="Download started"]', { timeout: 6000 });
  const popupText = await page.locator('[aria-label="Download started"]').innerText();
  ok(
    'popup says "Download started — Thank you & enjoy the great movies!"',
    /Download started/i.test(popupText) && /Thank you & enjoy the great movies/i.test(popupText)
  );
  await page.screenshot({ path: SHOT + "verify-21-popup.png" });
  await page.locator('button:has-text("Keep browsing")').click();
  await page.waitForTimeout(300);

  // Region switch → whole page re-ranks
  await page.locator('[aria-label^="Region:"]').click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]:has-text("United States")').click();
  await page.waitForTimeout(3000);
  const regionCode = await page.evaluate(
    () => JSON.parse(localStorage.getItem("moviebox.region.v1") || "{}").code
  );
  ok("region switch persisted (US)", regionCode === "US");
  await page.screenshot({ path: SHOT + "verify-22-us.png" });

  // Modal + trailer via hero Trailer button
  await page.locator('#hero button:has-text("Trailer")').click();
  await page.waitForTimeout(3000);
  const modalVisible = await page.isVisible('[role="dialog"][aria-modal="true"]');
  ok("detail modal opens", modalVisible);
  ok("modal has Download App CTA", (await page.locator('a[href*="src=modal"]').count()) > 0);
  ok(
    "modal mentions app-only streaming",
    (await page.locator('text=Stream it in the MovieBox app').count()) > 0
  );
  await page.screenshot({ path: SHOT + "verify-23-modal.png" });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);

  // ---------- Admin ----------
  await page.goto(BASE + "/admin", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("#admin-password", { timeout: 10000 });
  await page.waitForTimeout(1000); // let React hydration attach the submit handler
  await page.fill("#admin-password", "moviebox-admin");
  await page.locator('button:has-text("Enter dashboard")').click();
  await page.waitForSelector('text=Page views', { timeout: 15000 });
  await page.waitForTimeout(1500);
  const adminBody = await page.innerText("body");
  ok("admin dashboard loaded", /App downloads/i.test(adminBody));
  ok("admin store badge", /local demo store|supabase connected/i.test(adminBody));
  await page.screenshot({ path: SHOT + "verify-24-admin.png" });

  // Temporarily set auto-redirect to 6s for the test
  const saved = await page.evaluate(async () => {
    const r = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoRedirectSeconds: 6 }),
    });
    return r.ok;
  });
  ok("settings saved (auto-redirect = 6s)", saved);

  // ---------- Fresh visitor: 6s auto-redirect ----------
  const ctx2 = await browser.newContext({
    userAgent: WIN_UA,
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });
  const p2 = await ctx2.newPage();
  const dlPromise = p2.waitForEvent("download", { timeout: 25000 }).catch(() => null);
  await p2.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await p2.waitForSelector('[aria-label="Download started"]', { timeout: 25000 });
  ok("auto-redirect popup fired (idle visitor)", true);
  const installer = await dlPromise;
  ok("installer download actually triggered", !!installer);
  await p2.screenshot({ path: SHOT + "verify-25-auto-redirect.png" });
  await ctx2.close();

  // Restore 20s via admin context
  await page.evaluate(async () => {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoRedirectSeconds: 20 }),
    });
  });

  // ---------- Blocked visitor (Linux UA) ----------
  const ctx3 = await browser.newContext({ userAgent: LINUX_UA });
  const p3 = await ctx3.newPage();
  await p3.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await p3.waitForTimeout(1000);
  ok("Linux visitor gets gate screen", await p3.isVisible("#platform-gate"));
  ok("Linux visitor gets NO app", (await p3.locator("#app-root").count()) === 0);
  await p3.screenshot({ path: SHOT + "verify-26-gate.png" });
  await ctx3.close();

  // ---------- Stats integrity ----------
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('text=Page views', { timeout: 10000 });
  await page.waitForTimeout(1000);
  const stats = await page.evaluate(async () => (await (await fetch("/api/admin/stats")).json()));
  ok("stats: pageViews >= 2", stats.totals.pageViews >= 2);
  ok("stats: downloads >= 2 (manual + auto)", stats.totals.downloads >= 2);
  ok("stats: blocked >= 1 (Linux)", stats.totals.blocked >= 1);
  ok("stats: autoRedirects >= 1", stats.totals.autoRedirects >= 1);
  ok("stats: regionSwitches >= 1", stats.totals.regionSwitches >= 1);
  ok("stats: settings restored to 20s", stats.settings.autoRedirectSeconds === 20);
  await page.screenshot({ path: SHOT + "verify-27-admin-final.png" });

  await ctx.close();
  await browser.close();

  const failed = results.filter(([, v]) => !v);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error("SCRIPT ERROR:", e.message);
  process.exit(2);
});
