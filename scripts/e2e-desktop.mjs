#!/usr/bin/env node
/**
 * Test of the standalone macOS app (dist/NAPE 2026 Geoscience Games.app).
 *
 *   npm run build:mac && npm run test:desktop
 *
 * Launches the packaged app with every DNS lookup failing (NAPE_NO_NETWORK=1 —
 * a machine with no internet), plays the whole game, quits, relaunches and
 * checks saved progress; finally launches it through macOS LaunchServices
 * (what a double-click in Finder does — no terminal) and inspects it over the
 * debugging port.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { _electron as electron, chromium } from "playwright-core";
import { checkMediaFiles, playFourGames, resetCheck, resumeCheck, sweepAll80 } from "./lib/offline-checks.mjs";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const APP = join(ROOT, "dist", "NAPE 2026 Geoscience Games.app");
const EXE = join(APP, "Contents", "MacOS", "NAPE 2026 Geoscience Games");
if (!existsSync(EXE)) {
  console.error("App not found — run `npm run build:mac` first.");
  process.exit(2);
}
const bank = JSON.parse(readFileSync(join(ROOT, "data/nape2026.json"), "utf8")).challenges;
const avatars = JSON.parse(readFileSync(join(ROOT, "data/avatar-manifest.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(ROOT, "out/offline-manifest.json"), "utf8"));
const SHOTS = process.env.SHOTS_DIR;

let passed = 0;
const failed = [];
const ok = (name, cond, detail = "") => {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed.push(name); console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`); }
};
const section = (t) => console.log(`\n${t}`);

// Some hosts (e.g. the VS Code extension host) set ELECTRON_RUN_AS_NODE, which
// would make the app run as plain Node. A real double-click never has it.
const cleanEnv = { ...process.env, NAPE_NO_NETWORK: "1" };
delete cleanEnv.ELECTRON_RUN_AS_NODE;

const userData = mkdtempSync(join(tmpdir(), "nape-desktop-profile-"));
async function launch() {
  const app = await electron.launch({
    executablePath: EXE,
    args: [`--user-data-dir=${userData}`],
    env: cleanEnv,
  });
  const page = await app.firstWindow();
  const log = { errors: [], failed: [] };
  page.on("console", (m) => { if (m.type() === "error") log.errors.push(m.text()); });
  page.on("pageerror", (e) => log.errors.push(`pageerror ${e.message}`));
  page.on("requestfailed", (r) => { if (r.failure()?.errorText !== "net::ERR_ABORTED") log.failed.push(`${r.url()} ${r.failure()?.errorText}`); });
  await page.setViewportSize?.({ width: 1920, height: 1080 }).catch(() => {});
  await page.waitForLoadState("domcontentloaded");
  return { app, page, log };
}

section("Package");
ok("App bundle is code-signed and intact", spawnSync("codesign", ["--verify", "--deep", "--strict", APP]).status === 0);
ok("Game files are inside the app", existsSync(join(APP, "Contents/Resources/app/app/out/index.html")) && existsSync(join(APP, "Contents/Resources/app/app/out/media/photos/feature-20.jpg")));
ok("App icon is bundled", existsSync(join(APP, "Contents/Resources/app.icns")));

section("Launch with no internet (all DNS lookups fail)");
let { app, page, log } = await launch();
await page.getByRole("button", { name: /Start Game/ }).waitFor({ timeout: 30000 });
ok("Window title is NAPE 2026 GEOSCIENCE GAMES", (await page.title()) === "NAPE 2026 GEOSCIENCE GAMES");
ok("Opening screen shows the NAPE 2026 title", /NAPE 2026\s*GEOSCIENCE GAMES/i.test(await page.evaluate(() => document.body.innerText)));
ok("Runs as the standalone app (desktop bridge present)", await page.evaluate(() => window.napeDesktop?.isDesktop === true));
ok("Game is served from the app, not a web server", (await page.evaluate(() => location.origin)) === "nape://app");
// Projector workflow: the in-game Full Screen button must work inside the app.
await page.getByRole("button", { name: /Full Screen/ }).click();
await page.waitForFunction(() => !!document.fullscreenElement, null, { timeout: 8000 }).catch(() => {});
ok("Full Screen button puts the game full screen", await page.evaluate(() => !!document.fullscreenElement));
await page.evaluate(() => document.exitFullscreen());
await page.getByRole("button", { name: "Admin settings" }).click();
await page.locator('[data-testid="offline-status"]').waitFor();
await page.waitForFunction(() => document.querySelector('[data-testid="offline-status"]')?.getAttribute("data-offline-phase") === "ready", null, { timeout: 60000 });
const statusText = await page.locator('[data-testid="offline-status"]').innerText();
ok("Admin shows “Offline Ready” for the standalone app", /Offline Ready/.test(statusText) && /Standalone app/.test(statusText) && new RegExp(`${manifest.files.length} / ${manifest.files.length} files`).test(statusText), statusText.split("\n").slice(0, 3).join(" | "));
if (SHOTS) await page.screenshot({ path: join(SHOTS, "desktop-1-ready.png") });
await page.getByRole("button", { name: "Close admin panel" }).click();

section("Media inside the app");
await checkMediaFiles(page, ok, {
  videos: [...new Set(avatars.map((a) => a.fallbackFile).filter(Boolean))],
  audios: [...new Set(avatars.map((a) => a.audioFile).filter(Boolean)), "/media/audio/background-music.wav", ...["pop", "correct", "wrong", "tick", "fanfare", "click"].map((n) => `/media/sfx/${n}.wav`)],
  photos: bank.filter((c) => c.type === "feature").map((c) => c.photo),
});

section("Gameplay — four games, scoring, resume");
await page.getByRole("button", { name: /Start Game/ }).click();
await playFourGames(page, ok);
if (SHOTS) await page.screenshot({ path: join(SHOTS, "desktop-2-playing.png") });
await resumeCheck(page, ok, "After refresh");
const external1 = await app.evaluate(() => globalThis.__externalRequests);
await app.close();

section("Quit and relaunch — saved progress");
const second = await launch();
app = second.app;
page = second.page;
const var2 = second.log;
await resumeCheck(page, ok, "After relaunch");
await resetCheck(page, ok);

section("Every challenge inside the app");
await sweepAll80(page, ok, bank);
const external2 = await app.evaluate(() => globalThis.__externalRequests);

section("Network discipline");
ok("The app made no outside network request", external1.length + external2.length === 0, [...external1, ...external2].slice(0, 3).join(", "));
const ignorable = (m) => /Autoplay|play\(\) request|NotAllowedError|AbortError/i.test(m);
const errs = [...log.errors, ...var2.errors].filter((m) => !ignorable(m));
ok("No console errors", errs.length === 0, errs.slice(0, 3).join(" | "));
ok("No failed requests", log.failed.length + var2.failed.length === 0, [...log.failed, ...var2.failed].slice(0, 3).join(" | "));
await app.close();

section("Launch like a double-click (macOS LaunchServices, no terminal command)");
const port = 9333;
spawnSync("pkill", ["-f", "NAPE 2026 Geoscience Games.app/Contents/MacOS"]);
execFileSync("open", ["-n", "--env", "NAPE_NO_NETWORK=1", APP, "--args", `--user-data-dir=${mkdtempSync(join(tmpdir(), "nape-open-"))}`, `--remote-debugging-port=${port}`], { env: (() => { const e = { ...process.env }; delete e.ELECTRON_RUN_AS_NODE; return e; })() });
let browser;
for (let i = 0; i < 40 && !browser; i++) {
  try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 500)); }
}
ok("App started via `open` (LaunchServices)", !!browser);
if (browser) {
  const lp = browser.contexts()[0].pages()[0];
  await lp.getByRole("button", { name: /Start Game/ }).waitFor({ timeout: 20000 });
  ok("…and the game is on screen, offline", (await lp.title()) === "NAPE 2026 GEOSCIENCE GAMES" && (await lp.evaluate(() => window.napeDesktop?.isDesktop === true)));
  const running = spawnSync("pgrep", ["-f", "NAPE 2026 Geoscience Games.app/Contents/MacOS"]).stdout.toString().trim().length > 0;
  ok("App process is running", running);
  await browser.close();
}
spawnSync("pkill", ["-f", "NAPE 2026 Geoscience Games.app/Contents/MacOS"]);

console.log(`\n${passed} passed, ${failed.length} failed`);
if (failed.length) { console.log("Failed:\n - " + failed.join("\n - ")); process.exit(1); }
console.log("Desktop app test passed.");
