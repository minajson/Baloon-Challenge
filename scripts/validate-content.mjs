#!/usr/bin/env node
/**
 * Content validation for NAPE 2026 Geoscience Games.
 *
 *   npm run validate
 *
 * Checks the 80-challenge bank (data/nape2026.json) against the structure of
 * the source document, that every visual and photo exists, that the original
 * question bank is preserved in archive/, and that no archived-branding text
 * or assets remain in the active application. Exits non-zero on any failure.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const exists = (p) => existsSync(join(ROOT, p));

let failures = 0;
let checks = 0;
const notes = [];
function check(name, ok, detail = "") {
  checks += 1;
  if (ok) console.log(`  ✓ ${name}`);
  else {
    failures += 1;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
function section(title) {
  console.log(`\n${title}`);
}

const bank = JSON.parse(read("data/nape2026.json"));
const all = bank.challenges;
const byType = (t) => all.filter((c) => c.type === t);
const nonEmpty = (v) => typeof v === "string" && v.trim() !== "";

// ---------------------------------------------------------------- structure
section("Challenge bank");
check("Exactly 80 challenges imported", all.length === 80, `found ${all.length}`);
for (const t of ["picture", "letters", "odd", "feature"]) {
  check(`Exactly 20 ${t} challenges`, byType(t).length === 20, `found ${byType(t).length}`);
}
const ids = all.map((c) => c.id);
check("No duplicate challenge IDs", new Set(ids).size === ids.length);
const balloons = all.map((c) => c.balloon).sort((a, b) => a - b);
check(
  "Balloons numbered 1–80 with no gaps or repeats",
  balloons.every((n, i) => n === i + 1),
);
check("No missing correct answers", all.every((c) => nonEmpty(c.answer)));
for (const t of ["picture", "letters", "odd", "feature"]) {
  const ns = byType(t).map((c) => c.n).sort((a, b) => a - b);
  check(`${t}: items numbered 1–20 as in the document`, ns.every((n, i) => n === i + 1));
}
const levelOk = (c) =>
  c.type === "feature" ? c.level === null : ["Easy", "Medium", "Hard"].includes(c.level);
check("Difficulty levels preserved (Game 4 has none)", all.every(levelOk));
const dupAnswers = (t) => {
  const seen = new Set();
  return byType(t).some((c) => (seen.has(c.answer) ? true : (seen.add(c.answer), false)));
};
for (const t of ["picture", "letters", "odd", "feature"]) {
  check(`${t}: no duplicate questions within the game`, !dupAnswers(t));
}

// ----------------------------------------------------------- game 1 pictures
section("Game 1 — Picture Puzzles");
const artSrc = read("components/challenge/art.tsx");
const artKeys = new Set([...artSrc.matchAll(/^  "((?:[^"\\]|\\.)+)": \{$/gm)].map((m) => m[1]));
const pics = byType("picture");
check(
  "All 20 puzzles have two visual panels",
  pics.every((c) => nonEmpty(c.panelA) && nonEmpty(c.panelB)),
);
const missingArt = pics.flatMap((c) => [c.panelA, c.panelB]).filter((d) => !artKeys.has(d));
check(
  "Every panel has an illustration matching the document's exact description",
  missingArt.length === 0,
  missingArt.join(" | "),
);
const textInArt = [...artSrc.matchAll(/<text[^>]*>\s*([^<{]+?)\s*<\/text>/g)].map((m) => m[1]);
const leaks = pics.filter((c) =>
  textInArt.some((t) => t.replace(/[^a-z]/gi, "").toLowerCase() === c.answer.replace(/[^a-z]/gi, "").toLowerCase()),
);
check(
  "No illustration prints the puzzle's answer as text",
  leaks.length === 0,
  leaks.map((c) => c.answer).join(", "),
);
check(
  "Illustrations are inline SVG/emoji — no image filenames to leak answers",
  !/\.(png|jpe?g|webp|gif)/i.test(artSrc),
);

// ------------------------------------------------------------ game 2 letters
section("Game 2 — Missing Letters");
const letters = byType("letters");
const tokens = (p) => p.trim().split(/\s+/);
check("All 20 have their original pattern", letters.every((c) => nonEmpty(c.pattern)));
check("All 20 have their original hint", letters.every((c) => nonEmpty(c.hint)));
check(
  "Pattern length equals answer length",
  letters.every((c) => tokens(c.pattern).length === c.answer.length),
  letters.filter((c) => tokens(c.pattern).length !== c.answer.length).map((c) => c.id).join(", "),
);
check(
  "Letters shown in each pattern agree with the answer",
  letters.every((c) =>
    tokens(c.pattern).every((t, i) => t === "_" || t.toUpperCase() === c.answer[i]),
  ),
);
check("Every pattern has at least one blank", letters.every((c) => tokens(c.pattern).includes("_")));
check("Answers are upper-case words", letters.every((c) => /^[A-Z]+$/.test(c.answer)));

// ----------------------------------------------------------- game 3 odd one
section("Game 3 — Odd One Out");
const odd = byType("odd");
const challengesSrc = read("data/challenges.ts");
const emojiKeys = new Set(
  [...challengesSrc.matchAll(/^  (?:"([^"]+)"|([A-Za-z]+)): "/gm)].map((m) => m[1] ?? m[2]),
);
check("All 20 have four options", odd.every((c) => Array.isArray(c.options) && c.options.length === 4));
check("The odd one out is one of the four options", odd.every((c) => c.options.includes(c.answer)));
check("All 20 have an explanation", odd.every((c) => nonEmpty(c.why)));
check("Options within a question are distinct", odd.every((c) => new Set(c.options).size === 4));
const noEmoji = [...new Set(odd.flatMap((c) => c.options))].filter((o) => !emojiKeys.has(o));
check("Every option has a card emoji", noEmoji.length === 0, noEmoji.join(", "));

// ----------------------------------------------------------- game 4 features
section("Game 4 — Guess the Geological Feature");
const feats = byType("feature");
check(
  "All 20 have three clues",
  feats.every((c) => Array.isArray(c.clues) && c.clues.length === 3 && c.clues.every(nonEmpty)),
);
check("All 20 have a photo brief", feats.every((c) => nonEmpty(c.photoBrief)));
check(
  "Photo filenames are neutral (feature-NN.jpg)",
  feats.every((c) => c.photo === `/media/photos/feature-${String(c.n).padStart(2, "0")}.jpg`),
);
const missingPhotos = feats.filter((c) => !exists(`public${c.photo}`));
check(
  "All 20 photographs exist",
  missingPhotos.length === 0,
  missingPhotos.map((c) => c.photo).join(", "),
);
let credits = [];
try {
  credits = JSON.parse(read("data/photo-credits.json"));
} catch {
  /* reported below */
}
check("Photo credits file lists all 20 photographs", credits.length === 20 && feats.every((c) => credits.some((p) => p.n === c.n && p.file === `feature-${String(c.n).padStart(2, "0")}.jpg`)));
const licenceOk = (l) => /^(CC0|Public domain|PD|CC BY(-SA)? [0-9.]+)/i.test(l ?? "") && !/NC|ND/.test(l ?? "");
check(
  "Every photo has author, source URL and a reuse-friendly licence",
  credits.every((p) => nonEmpty(p.author) && nonEmpty(p.sourceUrl) && licenceOk(p.license)),
  credits.filter((p) => !licenceOk(p.license)).map((p) => `#${p.n} ${p.license}`).join(", "),
);
const words = (s) => s.toLowerCase().replace(/\(.*?\)/g, "").split(/[^a-z]+/).filter((w) => w.length > 3);
const altLeaks = credits.filter((p) => {
  const c = feats.find((f) => f.n === p.n);
  return c && words(c.answer).some((w) => (p.alt ?? "").toLowerCase().includes(w));
});
check(
  "Photo alt text does not give away the answer",
  altLeaks.length === 0,
  altLeaks.map((p) => `#${p.n}`).join(", "),
);
const sizes = feats.map((c) => (exists(`public${c.photo}`) ? statSync(join(ROOT, "public", c.photo)).size : 0));
check("Photographs are web-sized (< 1.2 MB each)", sizes.every((s) => s > 20_000 && s < 1_200_000));

// ------------------------------------------------------------------- assets
section("Assets");
const sw = read("public/sw.js");
const swPaths = [...sw.matchAll(/"(\/(?:media|icon)[^"]+)"/g)].map((m) => m[1]);
const missingSw = swPaths.filter((p) => !exists(`public${p}`));
check("Every offline-cache path exists on disk", missingSw.length === 0, missingSw.join(", "));
const manifest = JSON.parse(read("public/manifest.webmanifest"));
check(
  "Manifest icons exist",
  manifest.icons.every((i) => exists(`public${i.src}`)),
);
const avatars = JSON.parse(read("data/avatar-manifest.json"));
const missingAv = avatars.flatMap((a) => [a.fallbackFile, a.audioFile]).filter((f) => f && !exists(`public${f}`));
check("Mascot videos and audio exist", missingAv.length === 0, missingAv.join(", "));
check(
  "Mascot master images exist",
  exists("public/media/images/MASCOT_MALE_MASTER.png") && exists("public/media/images/MASCOT_FEMALE_MASTER.png"),
);

// -------------------------------------------------- original bank preserved
section("Original question bank");
const archived = exists("archive/original-question-bank/questions.ts")
  ? read("archive/original-question-bank/questions.ts")
  : "";
const archivedCount = (archived.match(/^\s+id: \d+,$/gm) ?? []).length;
check("Original questions archived outside the app (archive/)", archivedCount === 50, `found ${archivedCount}`);
check("Original bank is no longer in the active app (data/questions.ts removed)", !exists("data/questions.ts"));
check(
  "Nothing in the active app imports from archive/",
  !walk(".", ["archive", "node_modules", ".next", "out", ".git", ".playwright-mcp"]).some(
    (f) => /\.(tsx?|mjs|js)$/.test(f) && f !== "scripts/validate-content.mjs" && /from ["'][^"']*archive\//.test(read(f)),
  ),
);

// ------------------------------------------------------ no archived branding
section("Branding removal");
// Patterns are assembled from fragments so this script does not match itself.
const A = ["S", "P", "E"].join("");
const banned = [
  new RegExp(`\\b${A}\\b`, "i"),
  new RegExp(`society of ${"petro"}leum`, "i"),
  new RegExp(["rena", "issance"].join(""), "i"),
  new RegExp(`${A}[_-]?logo`, "i"),
];
const textExt = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".css", ".html", ".svg", ".webmanifest", ".txt", ".csv", ".yml", ".yaml"]);
const files = walk(".", ["archive", "node_modules", ".next", "out", ".git", ".playwright-mcp", ".vercel"]);
const hits = [];
for (const f of files) {
  if (f === "package-lock.json" || f.endsWith("tsbuildinfo")) continue;
  if (banned.some((re) => re.test(f))) hits.push(`${f} (filename)`);
  if (!textExt.has(extname(f))) continue;
  const text = read(f);
  const m = banned.find((re) => re.test(text));
  if (m) hits.push(f);
}
check("No archived-branding references in the active application", hits.length === 0, hits.join(", "));
const layoutSrc = read("app/layout.tsx");
check("Page title is NAPE 2026 GEOSCIENCE GAMES", /title: "NAPE 2026 GEOSCIENCE GAMES"/.test(layoutSrc));
check("Manifest name is NAPE 2026 Geoscience Games", manifest.name === "NAPE 2026 Geoscience Games");

// ------------------------------------------------------------------ summary
console.log(`\n${checks - failures}/${checks} checks passed`);
for (const n of notes) console.log(n);
if (failures > 0) {
  console.log(`\n${failures} check(s) FAILED`);
  process.exit(1);
}
console.log("\nAll content validation checks passed.");

function walk(dir, skip) {
  const out = [];
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = dir === "." ? name : `${dir}/${name}`;
    if (skip.includes(name) && dir === ".") continue;
    if (name === ".DS_Store") continue;
    const st = statSync(join(ROOT, rel));
    if (st.isDirectory()) out.push(...walk(rel, skip));
    else out.push(relative(".", rel));
  }
  return out;
}
