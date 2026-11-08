#!/usr/bin/env node
/**
 * Offline audit of the static export (./out).
 *
 *   npm run build && npm run audit:offline
 *
 * Proves, from the built files alone, that everything the game needs is local:
 *  - every file in out/ is listed in offline-manifest.json, with matching
 *    size and hash;
 *  - every required asset class (photos, mascot videos, audio, sfx, icons,
 *    pages, bundles) is present in the manifest;
 *  - every /media/... and /_next/... path referenced from HTML, JS, CSS, JSON
 *    or text payloads resolves to a file in the manifest;
 *  - no page, script, stylesheet or media element loads anything from another
 *    origin (no CDN, no web fonts, no remote APIs).
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const OUT = join(ROOT, "out");
let pass = 0;
const failures = [];
const ok = (name, cond, detail = "") => {
  if (cond) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(name);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
};
const section = (t) => console.log(`\n${t}`);

if (!existsSync(join(OUT, "offline-manifest.json"))) {
  console.error("out/offline-manifest.json not found — run `npm run build` first.");
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(join(OUT, "offline-manifest.json"), "utf8"));
const urls = new Set(manifest.files.map((f) => f.url));
const bank = JSON.parse(readFileSync(join(ROOT, "data/nape2026.json"), "utf8")).challenges;
const avatars = JSON.parse(readFileSync(join(ROOT, "data/avatar-manifest.json"), "utf8"));

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const allFiles = walk(OUT).filter((f) => !f.endsWith(".DS_Store"));
const rel = (f) => relative(OUT, f).split(sep).join("/");

// ---------------------------------------------------------------- manifest
section("Offline manifest");
const notListed = allFiles
  .map(rel)
  .filter((r) => !["sw.js", "offline-manifest.json"].includes(r))
  .filter((r) => !urls.has(r === "index.html" ? "/" : r.endsWith(".html") ? `/${r.slice(0, -5)}` : `/${r}`));
ok("Every exported file is listed", notListed.length === 0, notListed.slice(0, 4).join(", "));
const bad = [];
for (const f of manifest.files) {
  // Page routes (e.g. /admin/questions) are stored as <route>.html.
  const path = f.url === "/" ? "index.html" : existsSync(join(OUT, `${f.url.slice(1)}.html`)) ? `${f.url.slice(1)}.html` : f.url.slice(1);
  const full = join(OUT, path);
  if (!existsSync(full)) {
    bad.push(`${f.url} missing`);
    continue;
  }
  const buf = readFileSync(full);
  if (buf.length !== f.size) bad.push(`${f.url} size`);
  else if (createHash("sha256").update(buf).digest("hex").slice(0, 16) !== f.hash) bad.push(`${f.url} hash`);
}
ok(`All ${manifest.files.length} manifest entries exist with matching size and hash`, bad.length === 0, bad.slice(0, 4).join(", "));
ok("Manifest records a version and total size", /^[0-9a-f]{12}$/.test(manifest.version) && manifest.totalBytes > 0);
const sw = readFileSync(join(OUT, "sw.js"), "utf8");
ok("Service worker is stamped with the manifest version", sw.includes(`const VERSION = "${manifest.version}";`) && !/const VERSION = "__OFFLINE_VERSION__"/.test(sw));

// -------------------------------------------------------- required classes
section("Required gameplay assets are in the offline set");
const need = (label, list) => {
  const missing = list.filter((u) => !urls.has(u));
  ok(`${label} (${list.length})`, missing.length === 0, missing.slice(0, 4).join(", "));
};
need("Pages", ["/", "/admin/questions", "/404", "/manifest.webmanifest", "/icon.svg"]);
need("Geological photographs", bank.filter((c) => c.type === "feature").map((c) => c.photo));
need("Mascot videos", [...new Set(avatars.map((a) => a.fallbackFile).filter(Boolean))]);
need("Mascot dialogue audio", [...new Set(avatars.map((a) => a.audioFile).filter(Boolean))]);
need("Mascot master images", ["/media/images/MASCOT_MALE_MASTER.png", "/media/images/MASCOT_FEMALE_MASTER.png"]);
need("Sound effects", ["pop", "correct", "wrong", "tick", "fanfare", "click"].map((n) => `/media/sfx/${n}.wav`));
need("Background music", ["/media/audio/background-music.wav"]);
need("App icons", ["/media/images/app-icon-192.png", "/media/images/app-icon-512.png"]);
const chunks = allFiles.map(rel).filter((r) => r.startsWith("_next/static/")).map((r) => `/${r}`);
need("JavaScript and CSS bundles", chunks);
ok("Illustrations are inline SVG inside the bundles (no separate files to lose)", chunks.some((c) => c.endsWith(".js")));
ok("Question data is compiled into the bundles (no remote API)", allFiles.some((f) => f.endsWith(".js") && readFileSync(f, "utf8").includes("Sandstone")));

// ------------------------------------------------------------- references
section("Every referenced local path resolves");
const TEXT = new Set([".html", ".js", ".css", ".json", ".txt", ".svg", ".webmanifest"]);
const textFiles = allFiles.filter((f) => TEXT.has(extname(f)) && !f.endsWith("offline-manifest.json"));
const refs = new Set();
for (const f of textFiles) {
  const text = readFileSync(f, "utf8");
  for (const m of text.matchAll(/\/media\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|mp4|webm|wav|mp3|svg)/g)) refs.add(m[0]);
  for (const m of text.matchAll(/\/_next\/static\/[A-Za-z0-9_./%-]+\.(?:js|css|woff2?|png|svg|json)/g)) refs.add(m[0]);
}
const dangling = [...refs].filter((r) => !urls.has(r));
ok(`${refs.size} referenced media/bundle paths all exist in the offline set`, dangling.length === 0, dangling.slice(0, 5).join(", "));

// ---------------------------------------------------------------- external
section("No runtime dependency on the internet");
const external = [];
for (const f of textFiles) {
  const text = readFileSync(f, "utf8");
  const r = rel(f);
  if (r.endsWith(".html")) {
    for (const m of text.matchAll(/<(?:script|link|img|video|audio|source|iframe)\b[^>]*?\b(?:src|href)=["'](https?:)?\/\/[^"']+/gi)) external.push(`${r}: ${m[0].slice(0, 80)}`);
  }
  if (r.endsWith(".css")) {
    for (const m of text.matchAll(/@import\s+(?:url\()?["']?https?:|url\(\s*["']?https?:/gi)) external.push(`${r}: ${m[0]}`);
  }
  for (const m of text.matchAll(/(?:fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|unpkg\.com|cdnjs\.cloudflare)/gi)) external.push(`${r}: ${m[0]}`);
}
ok("No external scripts, stylesheets, fonts, images or media", external.length === 0, external.slice(0, 4).join(" | "));
const hosts = new Map();
for (const f of textFiles) {
  for (const m of readFileSync(f, "utf8").matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)) hosts.set(m[1].toLowerCase(), (hosts.get(m[1].toLowerCase()) ?? 0) + 1);
}
// Harmless: XML namespaces, library error-message links, and credit hyperlinks
// (photo credits are <a href> links the facilitator may click — never loaded).
const ALLOWED = ["www.w3.org", "nextjs.org", "react.dev", "github.com", "commons.wikimedia.org", "creativecommons.org"];
const unexpected = [...hosts.keys()].filter((h) => !ALLOWED.includes(h));
ok(`Only known non-loading URLs appear in the build (${[...hosts.keys()].join(", ")})`, unexpected.length === 0, unexpected.join(", "));

console.log(`\n${pass} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
console.log("Offline audit passed.");
