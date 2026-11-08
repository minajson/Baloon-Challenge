#!/usr/bin/env node
/**
 * Offline test of the installable web app (PWA).
 *
 *   npm run build && npm run test:offline
 *
 * Phase 1 (online): load the app in a fresh Chrome profile, wait for the
 *   service worker to download everything, and check the facilitator's
 *   "Offline Ready" indicator against the real cache — including that it
 *   refuses to say "Ready" when a file is missing.
 * Phase 2 (offline): shut the web server down completely, close and relaunch
 *   Chrome with the same profile, and play the whole game: all four games,
 *   scoring, resume, reset, every photo / illustration / audio / video file,
 *   then all 80 challenges. Every request must be answered by the service
 *   worker, and nothing may be requested from another origin.
 *
 * Needs Google Chrome (or set CHROME_PATH).
 */
import { cpSync, mkdtempSync, readFileSync, rmSync, appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit } from "playwright-core";

// BROWSER=webkit runs the same test in Safari's engine (default: Google Chrome).
const WEBKIT = process.env.BROWSER === "webkit";
const engine = WEBKIT ? webkit : chromium;
const channel = WEBKIT || process.env.CHROME_PATH ? undefined : "chrome";
import { startServer } from "./lib/static-server.mjs";
import { checkMediaFiles, kit, playFourGames, resetCheck, resumeCheck, sweepAll80 } from "./lib/offline-checks.mjs";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const OUT = join(ROOT, "out");
const bank = JSON.parse(readFileSync(join(ROOT, "data/nape2026.json"), "utf8")).challenges;
const avatars = JSON.parse(readFileSync(join(ROOT, "data/avatar-manifest.json"), "utf8"));
const SHOTS = process.env.SHOTS_DIR;
// TARGET_URL=https://… tests a deployed site instead of a local server: phase 2
// then cuts the network at the browser level (a hosted site can't be shut down).
const LIVE = process.env.TARGET_URL ? process.env.TARGET_URL.replace(/\/$/, "") : null;
const manifest = LIVE
  ? await (await fetch(`${LIVE}/offline-manifest.json`, { cache: "no-store" })).json()
  : JSON.parse(readFileSync(join(OUT, "offline-manifest.json"), "utf8"));

let passed = 0;
const failed = [];
const ok = (name, cond, detail = "") => {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed.push(name); console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`); }
};
const section = (t) => console.log(`\n${t}`);

const local = LIVE ? null : await startServer(OUT);
const server = local?.server;
const BASE = LIVE ?? `http://localhost:${local.port}`;
const profile = mkdtempSync(join(tmpdir(), "nape-offline-profile-"));

async function launch(offline = false) {
  const ctx = await engine.launchPersistentContext(profile, {
    channel,
    executablePath: WEBKIT ? undefined : process.env.CHROME_PATH,
    viewport: { width: 1920, height: 1080 },
    args: WEBKIT ? [] : ["--autoplay-policy=no-user-gesture-required"],
  });
  if (offline) await ctx.setOffline(true);
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  const log = { errors: [], external: [], notFromWorker: [], failed: [], requests: 0 };
  page.on("console", (m) => { if (m.type() === "error") log.errors.push(m.text()); });
  page.on("pageerror", (e) => log.errors.push(`pageerror ${e.message}`));
  page.on("requestfailed", (r) => {
    // ERR_ABORTED = the page navigated away mid-request (reload); not a missing file.
    if (r.failure()?.errorText !== "net::ERR_ABORTED") log.failed.push(`${r.url()} ${r.failure()?.errorText}`);
  });
  page.on("response", (r) => {
    log.requests++;
    const u = new URL(r.url());
    if (u.origin !== BASE) log.external.push(r.url());
    else if (!r.fromServiceWorker() && u.pathname !== "/sw.js") log.notFromWorker.push(u.pathname);
  });
  return { ctx, page, log };
}
const adminPhase = (page) => page.locator('[data-testid="offline-status"]').getAttribute("data-offline-phase");
async function openAdmin(page) {
  await page.getByRole("button", { name: "Admin settings" }).click();
  await page.locator('[data-testid="offline-status"]').waitFor();
}
async function closeAdmin(page) {
  await page.getByRole("button", { name: "Close admin panel" }).click();
}

// ============================================================ phase 1: online
section("Phase 1 — install and prepare while online");
let { ctx, page, log } = await launch();
await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: /Start Game/ }).waitFor();
await openAdmin(page);
const seen = new Set();
const t0 = Date.now();
let phase = "";
while (Date.now() - t0 < 180_000) {
  phase = await adminPhase(page);
  seen.add(phase);
  if (phase === "ready") break;
  await page.waitForTimeout(150);
}
ok("Admin indicator reaches “Offline Ready”", phase === "ready", `last phase ${phase}`);
console.log(`    (phases observed: ${[...seen].join(" → ")}; took ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
const txt = await page.locator('[data-testid="offline-status"]').innerText();
ok("Indicator text reads “Offline Ready” with a full file count", /Offline Ready/.test(txt) && new RegExp(`${manifest.files.length} / ${manifest.files.length} files`).test(txt), txt.split("\n").slice(0, 3).join(" | "));
if (SHOTS) await page.screenshot({ path: join(SHOTS, "offline-1-ready.png") });

const independent = await page.evaluate(async (files) => {
  const names = (await caches.keys()).filter((k) => k.startsWith("nape-games-"));
  const cache = await caches.open(names[names.length - 1]);
  let present = 0;
  for (const f of files) if (await cache.match(f.url, { ignoreSearch: true, ignoreVary: true })) present++;
  return { caches: names, present };
}, manifest.files);
ok(`Independent check: all ${manifest.files.length} manifest files are in the browser cache`, independent.present === manifest.files.length, JSON.stringify(independent));
ok("Exactly one versioned cache exists", independent.caches.length === 1 && independent.caches[0] === `nape-games-${manifest.version}`, independent.caches.join(","));
ok("Service worker controls the page", await page.evaluate(() => !!navigator.serviceWorker.controller));

if (!WEBKIT) {
  const cdp = await ctx.newCDPSession(page);
  const inst = await cdp.send("Page.getInstallabilityErrors");
  ok("Chrome reports no installability errors (installable PWA)", inst.installabilityErrors.length === 0, JSON.stringify(inst.installabilityErrors));
}

// The indicator must reflect real files, not connectivity.
section("Indicator honesty — missing file");
const photo = "/media/photos/feature-09.jpg";
await page.evaluate(async (p) => { const n = (await caches.keys())[0]; await (await caches.open(n)).delete(p); }, photo);
await ctx.setOffline(true); // cannot repair while offline
await page.getByRole("button", { name: /Verify Now/ }).click();
await page.waitForFunction(() => document.querySelector('[data-testid="offline-status"]')?.getAttribute("data-offline-phase") === "incomplete", null, { timeout: 30000 });
ok("With a photo missing and no connection: “Offline Files Incomplete”", /Offline Files Incomplete/.test(await page.locator('[data-testid="offline-status"]').innerText()));
ok("…and it names the missing file", (await page.locator('[data-testid="offline-status"]').innerText()).includes("feature-09.jpg"));
if (SHOTS) await page.screenshot({ path: join(SHOTS, "offline-2-incomplete.png") });
await ctx.setOffline(false);
await page.getByRole("button", { name: /Verify Now/ }).click();
await page.waitForFunction(() => document.querySelector('[data-testid="offline-status"]')?.getAttribute("data-offline-phase") === "ready", null, { timeout: 60000 });
ok("Back online, Verify re-downloads the missing file → “Offline Ready”", true);
ok("The repaired file is back in the cache", await page.evaluate(async (p) => { const n = (await caches.keys())[0]; return !!(await (await caches.open(n)).match(p)); }, photo));
await ctx.close();

// ======================================================== phase 2: no server
section("Phase 2 — server shut down, Chrome relaunched (no network of any kind)");
let refused = false;
if (LIVE) {
  // Cut the network at the browser level for the rest of the test.
  refused = true;
} else {
  await new Promise((r) => server.close(r));
  try { await fetch(BASE, { signal: AbortSignal.timeout(2000) }); } catch { refused = true; }
}
ok(LIVE ? "Browser network is switched off" : "Web server is down (connection refused)", refused);

({ ctx, page, log } = await launch(!!LIVE));
await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: /Start Game/ }).waitFor({ timeout: 20000 });
ok("App loads from the service-worker cache with the server down", (await page.title()) === "NAPE 2026 GEOSCIENCE GAMES");
ok("Opening screen shows the NAPE 2026 title", /NAPE 2026\s*GEOSCIENCE GAMES/i.test(await page.evaluate(() => document.body.innerText)));
ok("Service worker is controlling the page", await page.evaluate(() => !!navigator.serviceWorker.controller));
await openAdmin(page);
await page.waitForFunction(() => document.querySelector('[data-testid="offline-status"]')?.getAttribute("data-offline-phase") === "ready", null, { timeout: 60000 });
ok("Offline indicator is “Offline Ready” while truly offline", /Offline Ready/.test(await page.locator('[data-testid="offline-status"]').innerText()));
await closeAdmin(page);

section("Offline media");
await checkMediaFiles(page, ok, {
  videos: [...new Set(avatars.map((a) => a.fallbackFile).filter(Boolean))],
  audios: [...new Set(avatars.map((a) => a.audioFile).filter(Boolean)), "/media/audio/background-music.wav", ...["pop", "correct", "wrong", "tick", "fanfare", "click"].map((n) => `/media/sfx/${n}.wav`)],
  photos: bank.filter((c) => c.type === "feature").map((c) => c.photo),
});

section("Offline gameplay — four games, scoring, resume");
await page.getByRole("button", { name: /Start Game/ }).click();
await playFourGames(page, ok);
if (SHOTS) await page.screenshot({ path: join(SHOTS, "offline-3-playing.png") });
await resumeCheck(page, ok, "After refresh");
await ctx.close();

section("Relaunch the browser (still offline) — progress must survive a restart");
const second = await launch(!!LIVE);
ctx = second.ctx;
page = second.page;
const log2 = second.log;
await page.goto(BASE, { waitUntil: "domcontentloaded" });
await resumeCheck(page, ok, "After restart");
await resetCheck(page, ok);

section("Offline: every challenge");
await sweepAll80(page, ok, bank);

section("Network discipline (all phases offline)");
const logs = [log, log2];
const sum = (k) => logs.flatMap((l) => l[k]);
// Playwright's WebKit does not reliably flag service-worker responses; there the proof is that
// the server is down and no request failed.
ok(WEBKIT ? "Nothing reached the (stopped) server — no request failed" : "Every same-origin response came from the service worker", WEBKIT ? sum("failed").length === 0 : sum("notFromWorker").length === 0, [...new Set(sum("notFromWorker"))].slice(0, 5).join(", "));
ok("Nothing was requested from another origin", sum("external").length === 0, sum("external").slice(0, 3).join(", "));
ok("No failed requests", sum("failed").length === 0, sum("failed").slice(0, 3).join(" | "));
const ignorable = (m) => /Autoplay|play\(\) request|NotAllowedError|AbortError/i.test(m);
ok("No console errors", sum("errors").filter((m) => !ignorable(m)).length === 0, sum("errors").filter((m) => !ignorable(m)).slice(0, 3).join(" | "));
console.log(`    (${logs[0].requests + logs[1].requests} requests answered offline)`);

await ctx.close();

// ====================================================== phase 3: new version
if (!LIVE) {
  section("Phase 3 — updates: a new version downloads in the background and waits");
  const tmp = mkdtempSync(join(tmpdir(), "nape-versions-"));
  const dirA = join(tmp, "A");
  const dirB = join(tmp, "B");
  const dirC = join(tmp, "C");
  cpSync(OUT, dirA, { recursive: true });
  cpSync(OUT, dirB, { recursive: true });
  appendFileSync(join(dirB, "index.html"), "<!-- version B -->");
  execFileSync("node", [join(ROOT, "scripts/build-offline-manifest.mjs")], { env: { ...process.env, OUT_DIR: dirB }, stdio: "pipe" });
  cpSync(OUT, dirC, { recursive: true });
  appendFileSync(join(dirC, "index.html"), "<!-- version C (broken) -->");
  execFileSync("node", [join(ROOT, "scripts/build-offline-manifest.mjs")], { env: { ...process.env, OUT_DIR: dirC }, stdio: "pipe" });
  rmSync(join(dirC, "media/photos/feature-05.jpg")); // listed in C's manifest, but missing → install must fail
  const verA = JSON.parse(readFileSync(join(dirA, "offline-manifest.json"), "utf8")).version;
  const verB = JSON.parse(readFileSync(join(dirB, "offline-manifest.json"), "utf8")).version;
  ok("Versions A and B differ", verA !== verB, `${verA} / ${verB}`);

  const uProfile = mkdtempSync(join(tmpdir(), "nape-update-profile-"));
  const open = async (dir, port) => {
    const srv = await startServer(dir, port);
    const c = await engine.launchPersistentContext(uProfile, { channel, executablePath: WEBKIT ? undefined : process.env.CHROME_PATH, viewport: { width: 1920, height: 1080 } });
    const p = c.pages()[0] ?? (await c.newPage());
    return { srv, c, p, port: srv.port };
  };
  const cachesOf = (p) => p.evaluate(async () => (await caches.keys()).sort());
  const phaseOf = (p) => p.locator('[data-testid="offline-status"]').getAttribute("data-offline-phase");
  const waitReady = (p) => p.waitForFunction(() => document.querySelector('[data-testid="offline-status"]')?.getAttribute("data-offline-phase") === "ready", null, { timeout: 90000 });

  // Install version A.
  let u = await open(dirA);
  const PORT = u.port;
  await u.p.goto(`http://localhost:${PORT}`, { waitUntil: "domcontentloaded" });
  await openAdmin(u.p);
  await waitReady(u.p);
  ok("Version A installed and Offline Ready", (await cachesOf(u.p)).join() === `nape-games-${verA}`);
  await u.c.close();
  await new Promise((r) => u.srv.server.close(r));

  // A broken deployment (a listed file is missing) must NOT replace A.
  const C = await open(dirC, PORT);
  await C.p.goto(`http://localhost:${PORT}`, { waitUntil: "domcontentloaded" });
  await openAdmin(C.p);
  await waitReady(C.p);
  await C.p.waitForTimeout(6000); // give the failed install time to finish
  const cAfter = await cachesOf(C.p);
  ok("Broken new version never becomes active; version A's complete cache stays", cAfter.join() === `nape-games-${verA}`, cAfter.join(","));
  ok("…and the indicator still reads “Offline Ready”", (await phaseOf(C.p)) === "ready");
  await C.c.close();
  await new Promise((r) => C.srv.server.close(r));

  // A good deployment B: downloads, waits, then applies on request.
  u = await open(dirB, PORT);
  await u.p.goto(`http://localhost:${PORT}`, { waitUntil: "domcontentloaded" });
  await openAdmin(u.p);
  await waitReady(u.p);
  await u.p.getByText(/newer version has been downloaded/i).waitFor({ timeout: 60000 });
  ok("Update B downloads in the background and the facilitator is told", true);
  ok("Running game is untouched — A still serves (A and B caches both present)", (await cachesOf(u.p)).includes(`nape-games-${verA}`) && (await cachesOf(u.p)).includes(`nape-games-${verB}`));
  if (SHOTS) await u.p.screenshot({ path: join(SHOTS, "offline-4-update-ready.png") });
  await u.p.getByRole("button", { name: /Apply Update Now/ }).click();
  await u.p.waitForLoadState("domcontentloaded");
  await u.p.getByRole("button", { name: /Start Game|Resume/ }).first().waitFor({ timeout: 30000 });
  await openAdmin(u.p);
  await waitReady(u.p);
  ok("After applying, version B is active", (await u.p.locator('[data-testid="offline-status"]').innerText()).includes(verB));
  ok("Old cache A is deleted", (await cachesOf(u.p)).join() === `nape-games-${verB}`, (await cachesOf(u.p)).join(","));
  await u.c.close();
  await new Promise((r) => u.srv.server.close(r));
}

console.log(`\n${passed} passed, ${failed.length} failed`);
if (failed.length) { console.log("Failed:\n - " + failed.join("\n - ")); process.exit(1); }
console.log("Offline PWA test passed.");
