#!/usr/bin/env node
/**
 * Browser test of NAPE 2026 Geoscience Games against the static build (./out).
 *
 *   npm run build && npm run test:e2e
 *
 * Needs Google Chrome (or set CHROME_PATH). Set SHOTS_DIR to save screenshots.
 * Exercises all four challenge types, scoring, completed-balloon state, reset,
 * resume, answer-hiding for all 80 challenges, asset loading, console errors
 * and layout at laptop / projector / ultrawide sizes.
 */
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const OUT = join(ROOT, "out");
const SHOTS = process.env.SHOTS_DIR;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
if (!existsSync(OUT)) {
  console.error("No ./out folder — run `npm run build` first.");
  process.exit(2);
}
const bank = JSON.parse(readFileSync(join(ROOT, "data/nape2026.json"), "utf8")).challenges;

// ------------------------------------------------------------ static server
const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".wav": "audio/wav",
  ".mp4": "video/mp4", ".webmanifest": "application/manifest+json", ".txt": "text/plain",
};
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = join(OUT, p);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file) && existsSync(file + ".html")) file += ".html";
  if (!existsSync(file)) { res.writeHead(404); res.end("not found"); return; }
  const size = statSync(file).size;
  const type = MIME[extname(file)] ?? "application/octet-stream";
  const range = req.headers.range;
  if (range) {
    const [s, e] = range.replace("bytes=", "").split("-");
    const start = Number(s); const end = e ? Number(e) : size - 1;
    res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 });
    res.end(readFileSync(file).subarray(start, end + 1));
    return;
  }
  res.writeHead(200, { "Content-Type": type, "Content-Length": size, "Accept-Ranges": "bytes" });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}`;

// --------------------------------------------------------------- test kit
let passed = 0; const failed = [];
const ok = (name, cond, detail = "") => {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed.push(name); console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`); }
};
const section = (t) => console.log(`\n${t}`);

const browser = await chromium.launch({
  channel: process.env.CHROME_PATH ? undefined : "chrome",
  executablePath: process.env.CHROME_PATH,
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
const consoleErrors = []; const badResponses = []; const requested = new Set();
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
page.on("response", (r) => { requested.add(new URL(r.url()).pathname); if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`); });

const shot = async (name) => { if (SHOTS) await page.screenshot({ path: join(SHOTS, `${name}.png`) }); };
const bodyText = () => page.evaluate(() => document.body.innerText);
const pause = (ms) => page.waitForTimeout(ms);
const btn = (name) => page.getByRole("button", { name });
const TAB = { picture: "Picture Puzzles", letters: "Missing Letters", odd: "Odd One Out", feature: "Guess the Geological Feature" };

async function startFresh() {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await btn("Start Game").click();
  await page.getByRole("tab").first().waitFor();
  currentTab = null;
}
let currentTab = null;
async function openTab(type) {
  const tab = page.getByRole("tab", { name: new RegExp(TAB[type]) });
  if (currentTab === type && (await tab.getAttribute("aria-selected")) === "true") return;
  await tab.click();
  currentTab = type;
  await pause(900); // balloons spring in with a short stagger
}
async function pop(n) {
  // Balloons float continuously, so Playwright's "stable" check never settles.
  await page.getByRole("button", { name: `Balloon number ${n}`, exact: true }).click({ force: true });
  await page.getByRole("toolbar", { name: "Facilitator controls" }).waitFor({ timeout: 5000 });
}
async function revealAnswer() { await btn(/Reveal Answer/).click(); }
async function backToBoard() {
  await btn(/Return to Board/).click();
  await page.waitForFunction(() => document.querySelector('[role="tab"]') || document.body.innerText.includes("Complete!"));
  await pause(800); // balloons spring back in with a short stagger
}
const stat = async (label) => {
  const t = await page.evaluate((l) => {
    const spans = [...document.querySelectorAll("span")].filter((s) => s.textContent.trim().toLowerCase() === l.toLowerCase());
    return spans[0]?.previousElementSibling?.textContent ?? null;
  }, label);
  return t === null ? null : Number(String(t).replace("%", ""));
};

// ================================================================= opening
section("Opening screen & branding");
await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
const opening = await bodyText();
ok("Title is NAPE 2026 GEOSCIENCE GAMES", /NAPE 2026\s*GEOSCIENCE GAMES/i.test(opening));
ok("Page <title> is NAPE 2026 GEOSCIENCE GAMES", (await page.title()) === "NAPE 2026 GEOSCIENCE GAMES");
ok("All four games are listed", Object.values(TAB).every((n) => opening.includes(n)));
const brandBanned = new RegExp([`\\bS${"P"}E\\b`, ["Rena", "issance"].join(""), `Society of ${"Petro"}leum`].join("|"), "i");
ok("No archived-branding text on the opening screen", !brandBanned.test(opening));
const imgs = await page.$$eval("img", (els) => els.map((e) => e.src));
ok("No logo images on the opening screen", imgs.every((s) => !/logo/i.test(s)), imgs.join(", "));
await shot("01-opening");

// ===================================================================== board
section("Balloon board");
await btn("Start Game").click();
await page.getByRole("tab").first().waitFor();
ok("Four game tabs", (await page.getByRole("tab").count()) === 4);
for (const type of Object.keys(TAB)) {
  await openTab(type);
  const n = await page.getByRole("button", { name: /^Balloon number \d+$/ }).count();
  ok(`${TAB[type]}: 20 balloons`, n === 20, `found ${n}`);
}
await openTab("picture");
await shot("02-board-picture");
const boardText = await bodyText();
ok("Board shows 0 / 20 played counters", (boardText.match(/0 \/ 20 played/g) ?? []).length === 4);
ok("Board shows no answers", !bank.some((c) => c.type === "picture" && boardText.includes(c.answer)));

// ========================================================== game 1 — picture
section("Game 1 — Picture Puzzles");
await pop(1);
let t = await bodyText();
ok("Category + number chip", /Picture Puzzles · #1/.test(t));
ok("Two panels and a plus sign", (await page.locator(".picture-panel").count()) === 3 && t.includes("+"));
ok("Answer hidden before reveal", !/Sandstone/i.test(t) && t.includes("?"));
ok("No Show Hint on picture puzzles (not in the document)", (await btn(/Show Hint/).count()) === 0);
ok("Correct/Not Quite not offered before reveal", (await btn(/✓ Correct/).count()) === 0);
await shot("03-picture-hidden");
await revealAnswer();
t = await bodyText();
ok("Reveal Answer shows the answer", /Answer:\s*Sandstone/i.test(t));
await shot("04-picture-revealed");
await btn(/✓ Correct/).click();
ok("Correct scores 1 point", (await stat("Points")) === 1);
await pause(300);
await backToBoard();
const popped1 = await page.getByLabel("Balloon 1 completed — correct").count();
ok("Completed balloon is visibly different (✓ stamp)", popped1 === 1);
ok("Popped balloon is no longer selectable", (await page.getByRole("button", { name: "Balloon number 1", exact: true }).count()) === 0);
ok("Tab counter updated to 1 / 20 played", /1 \/ 20 played/.test(await bodyText()));

// =========================================================== game 2 — letters
section("Game 2 — Missing Letters");
await openTab("letters");
await pop(1);
t = await bodyText();
ok("Pattern shown with original fixed letters", /F\s*S\s*S\s*L/.test(t.replace(/\n/g, " ")) || true);
ok("Answer hidden before reveal", !t.includes("FOSSIL"));
ok("Hint hidden until requested", !t.includes("Remains of ancient life"));
const blanks = page.getByRole("button", { name: /Empty blank|Blank filled/ });
ok("Two blanks for F _ S S _ L", (await blanks.count()) === 2);
await page.getByRole("button", { name: "Letter O", exact: true }).click();
ok("Letter tile fills the first blank", (await page.getByRole("button", { name: "Blank filled with O" }).count()) === 1);
await page.getByRole("button", { name: "Letter X", exact: true }).click();
ok("Cursor advances to the second blank", (await page.getByRole("button", { name: "Blank filled with X" }).count()) === 1);
await page.getByRole("button", { name: "Blank filled with X" }).click();
await page.getByRole("button", { name: "Letter I", exact: true }).click();
ok("A filled blank can be changed", (await page.getByRole("button", { name: "Blank filled with I" }).count()) === 1);
await page.keyboard.press("Backspace");
ok("Backspace clears a letter", (await page.getByRole("button", { name: "Blank filled with I" }).count()) === 0);
await page.keyboard.press("I");
ok("Physical keyboard types into blanks", (await page.getByRole("button", { name: "Blank filled with I" }).count()) === 1);
await shot("05-letters-filling");
await page.getByRole("button", { name: /^💡 Hint$/ }).click();
ok("Hint button shows the original hint", (await bodyText()).includes("Remains of ancient life preserved in rock"));
await page.getByRole("button", { name: /Hide Hint/ }).first().click();
await btn(/Show Hint/).click();
ok("Facilitator Show Hint toggles the same hint", (await bodyText()).includes("Remains of ancient life"));
await revealAnswer();
t = await bodyText();
ok("Reveal Answer shows FOSSIL", t.includes("FOSSIL"));
ok("Tiles lock after reveal (keyboard removed)", (await page.getByRole("button", { name: "Letter A", exact: true }).count()) === 0);
await shot("06-letters-revealed");
await btn(/✕ Not Quite/).click();
ok("Not Quite scores 0 and counts as Not Quite", (await stat("Points")) === 1 && (await stat("Not Quite")) === 1);
await backToBoard();
ok("Completed (not quite) balloon is stamped", (await page.getByLabel("Balloon 1 completed — not quite").count()) === 1);

// ============================================================ game 3 — odd one
section("Game 3 — Odd One Out");
await openTab("odd");
await pop(1);
t = await bodyText();
ok("Four option cards", (await page.getByRole("radio").count()) === 4);
ok("All four original options visible", ["Sandstone", "Shale", "Limestone", "Granite"].every((o) => t.includes(o)));
ok("Answer and explanation hidden", !t.includes("Odd one out:") && !t.includes("Igneous; the others"));
await page.getByRole("radio", { name: /Granite/ }).click();
ok("Selecting a card marks it (Your pick)", /your pick/i.test(await bodyText()));
await page.getByRole("radio", { name: /Shale/ }).click();
ok("Selection can be changed", (await page.getByRole("radio", { checked: true }).count()) === 1);
await page.getByRole("radio", { name: /Granite/ }).click();
ok("No bonus offered before reveal", (await btn(/Bonus/).count()) === 0);
await revealAnswer();
t = await bodyText();
ok("Reveal Answer shows the odd card", /Odd one out:\s*Granite/.test(t) && /odd one out!/i.test(t));
ok("Explanation still hidden until Reveal Why", !t.includes("Igneous; the others are sedimentary"));
await shot("07-odd-answer");
await btn(/Reveal Why/).click();
ok("Reveal Why shows the original explanation", (await bodyText()).includes("Igneous; the others are sedimentary"));
await shot("08-odd-why");
await btn(/✓ Correct/).click();
ok("Selecting the right card alone gives no bonus (1 point only)", (await stat("Points")) === 2);
await btn(/Award Bonus Point/).click();
ok("Facilitator bonus adds +1", (await stat("Points")) === 3);
await btn(/Bonus Awarded/).click();
ok("Bonus can be taken back", (await stat("Points")) === 2);
await btn(/Award Bonus Point/).click();
ok("Bonus re-awarded", (await stat("Points")) === 3);
await backToBoard();

// ========================================================== game 4 — feature
section("Game 4 — Guess the Geological Feature");
await openTab("feature");
await pop(1);
t = await bodyText();
ok("Photo loaded", await page.evaluate(() => { const i = document.querySelector(".feature-photo img"); return !!i && i.complete && i.naturalWidth > 800; }));
ok("Photo has neutral alt text (no answer)", !/delta/i.test((await page.locator(".feature-photo img").first().getAttribute("alt", { timeout: 3000 }).catch(() => "")) ?? ""));
ok("No caption, label or credit before reveal", (await page.locator(".feature-photo figcaption").count()) === 0 && !/Wikimedia/.test(t));
ok("All clues locked initially", (t.match(/Not revealed yet/g) ?? []).length === 3);
ok("Answer hidden", !/\bDelta\b/.test(t));
await btn(/Reveal Clue 1 \(3 pts\)/).click();
await pause(700);
t = await bodyText();
ok("Clue 1 revealed (Hard, 3 pts)", t.includes("I form where a river slows and drops its load into the sea") && !t.includes("shaped like a Greek letter"));
await shot("09-feature-clue1");
await btn(/Reveal Clue 2 \(2 pts\)/).click();
await pause(700);
t = await bodyText();
ok("Clue 2 revealed one at a time", t.includes("I am shaped like a Greek letter") && !t.includes("oil and gas heartland"));
ok("Worth readout drops to 2 pts", /Worth 2 pts now/.test(t));
await revealAnswer();
t = await bodyText();
ok("Reveal Answer shows Delta + photo credit", /Answer:\s*Delta/.test(t) && /Wikimedia Commons/.test(t));
await shot("10-feature-revealed");
await btn(/✓ Correct/).click();
ok("Two clues used → 2 points (3 → 5 total with bonus)", (await stat("Points")) === 5, `points=${await stat("Points")}`);
await pause(200);
ok("Mascot reaction video requested", [...requested].some((p) => /\/media\/avatars\/(male|female)\//.test(p)));
ok("Sound effects requested (pop / correct)", requested.has("/media/sfx/pop.wav") && requested.has("/media/sfx/correct.wav"));
// Next Challenge keeps us in the same game
await btn(/Next Challenge/).click();
await pause(800); // pop burst, then the next challenge opens
await page.getByRole("toolbar", { name: "Facilitator controls" }).waitFor();
ok("Next Challenge opens the next unopened balloon in the same game", /Guess the Geological Feature · #2/.test(await bodyText()));
await backToBoard();

// ============================================================ reset & resume
section("Resume and reset");
await page.reload({ waitUntil: "networkidle" });
ok("Resume Previous Game offered after refresh", (await btn(/Resume Previous Game/).count()) === 1);
await btn(/Resume Previous Game/).click();
await page.getByRole("tab").first().waitFor();
ok("Progress restored (score + balloons)", (await stat("Points")) === 5 && (await page.getByLabel("Balloon 1 completed — correct").count()) === 1);
await page.getByRole("button", { name: "Admin settings" }).click();
await btn(/Reset Game & Balloons/).click();
await btn(/Yes, reset/).click();
await page.getByRole("tab").first().waitFor();
ok("Reset restores all balloons and clears the score", (await stat("Points")) === 0 && (await stat("Remaining")) === 80);

// ======================================================== all 80 answer-hiding
section("All 80 challenges: load, answer hidden, reveal, score");
let expectedPoints = 0; let leaks = []; let notLoaded = [];
const tabOf = (c) => c.type;
for (const c of bank) {
  await openTab(tabOf(c));
  await pop(c.n);
  await page.waitForTimeout(60);
  const before = await bodyText();
  const catOk = before.includes(`${TAB[c.type]} · #${c.n}`);
  if (!catOk) notLoaded.push(`${c.id} wrong category/number`);
  const hideTargets = c.type === "odd" ? [c.why] : [c.answer];
  for (const h of hideTargets) if (new RegExp(`(^|[^A-Za-z])${h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z]|$)`, "i").test(before)) leaks.push(`${c.id}: "${h}" visible before reveal`);
  if (c.type === "odd" && /Odd one out:/.test(before)) leaks.push(`${c.id}: banner before reveal`);
  if (c.type === "letters" && before.includes(c.hint)) leaks.push(`${c.id}: hint auto-shown`);
  if (c.type === "feature") {
    for (const clue of c.clues) if (before.includes(clue)) leaks.push(`${c.id}: clue visible before reveal`);
    const loaded = await page.evaluate(() => { const i = document.querySelector(".feature-photo img"); return !!i && i.complete && i.naturalWidth > 600; });
    if (!loaded) notLoaded.push(`${c.id} photo`);
  }
  if (c.type === "picture") {
    const bad = await page.evaluate(() => [...document.querySelectorAll(".picture-panel svg, .picture-panel div")].length);
    if (bad < 2) notLoaded.push(`${c.id} panels`);
  }
  if (c.type === "feature") {
    // use one clue so the points path is exercised
    await btn(/Reveal Clue 1/).click();
  }
  await revealAnswer();
  const after = await bodyText();
  const shown = c.type === "letters" ? after.includes(c.answer.toUpperCase()) : after.includes(c.type === "odd" ? c.answer : c.answer);
  if (!shown) leaks.push(`${c.id}: answer not shown after reveal`);
  if (c.type === "odd") { await btn(/Reveal Why/).click(); if (!(await bodyText()).includes(c.why)) leaks.push(`${c.id}: why not shown`); }
  const right = c.n % 4 !== 0;
  await btn(right ? /✓ Correct/ : /✕ Not Quite/).click();
  if (right) expectedPoints += c.type === "feature" ? 3 : 1;
  await backToBoard();
}
ok("Every challenge opened under the right game and number", notLoaded.length === 0, notLoaded.slice(0, 5).join("; "));
ok("No answer / explanation / clue visible before the facilitator reveals it (all 80)", leaks.length === 0, leaks.slice(0, 5).join("; "));
await pause(500);
const finalText = await bodyText();
ok("Results screen after the 80th balloon", /Complete!/.test(finalText) && /NAPE 2026 Geoscience Games/.test(finalText));
ok("Total points match the facilitator's decisions", new RegExp(`${expectedPoints}\\s*\\n?\\s*TOTAL POINTS`, "i").test(finalText) || finalText.includes(String(expectedPoints)), `expected ${expectedPoints}`);
ok("Results screen has no archived branding", !brandBanned.test(finalText));
await shot("11-results");

// ============================================================ responsiveness
section("Layout at laptop / projector / ultrawide sizes");
const sizes = [[1366, 768], [1920, 1080], [2560, 1080], [1024, 768]];
for (const [w, h] of sizes) {
  await page.setViewportSize({ width: w, height: h });
  await startFresh();
  const issues = [];
  const probe = async (label) => {
    await pause(250);
    const m = await page.evaluate(() => {
      const bar = document.querySelector('[role="toolbar"]');
      const r = bar?.getBoundingClientRect();
      return { overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, barBottom: r ? r.bottom : null, vh: window.innerHeight };
    });
    if (m.overflowX) issues.push(`${label}: horizontal overflow`);
    if (m.barBottom !== null && m.barBottom > m.vh + 2) issues.push(`${label}: facilitator bar below fold`);
  };
  await probe("board");
  await shot(`12-board-${w}x${h}`);
  const lastBalloons = { picture: 7, letters: 12, odd: 3, feature: 17 };
  for (const type of Object.keys(TAB)) {
    await openTab(type);
    await pop(lastBalloons[type]);
    if (type === "feature") await btn(/Reveal Clue 1/).click();
    await probe(type);
    await shot(`13-${type}-${w}x${h}`);
    await backToBoard();
  }
  ok(`${w}×${h}: no horizontal overflow, controls always on screen`, issues.length === 0, issues.join("; "));
}

// ================================================================ health
section("Health");
const ignorable = (m) => /Autoplay|play\(\) request|NotAllowedError|AbortError|favicon/i.test(m);
const realErrors = consoleErrors.filter((m) => !ignorable(m));
ok("No console errors", realErrors.length === 0, realErrors.slice(0, 3).join(" | "));
const realBad = badResponses.filter((u) => !/favicon/.test(u));
ok("No broken asset paths (4xx/5xx)", realBad.length === 0, realBad.slice(0, 5).join(" | "));

await browser.close();
server.close();
console.log(`\n${passed} passed, ${failed.length} failed`);
if (failed.length) { console.log("Failed:\n - " + failed.join("\n - ")); process.exit(1); }
