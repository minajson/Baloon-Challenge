#!/usr/bin/env node
/**
 * Post-export step: describe every file of the static export so the app can
 * download, verify and report on its own offline copy.
 *
 *   node scripts/build-offline-manifest.mjs     (runs after `next build`)
 *
 * Writes out/offline-manifest.json:
 *   { version, generatedAt, totalBytes, files: [{ url, size, hash }] }
 * and stamps the same version into out/sw.js so every deployment gets its own
 * versioned cache. The list is derived from the real files in out/, so a new
 * photo, chunk or video can never be forgotten.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
// OUT_DIR lets tests build a second "version" of a copied export.
const OUT = process.env.OUT_DIR ? join(process.env.OUT_DIR) : join(ROOT, "out");
if (!existsSync(OUT)) {
  console.error("out/ not found — run `next build` first.");
  process.exit(1);
}

// Files that are not part of the offline set.
const SKIP = new Set([".DS_Store", "sw.js", "offline-manifest.json"]);

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (!SKIP.has(name) && !name.endsWith(".map")) files.push(full);
  }
  return files;
}

/** File path in out/ → the URL the browser requests. */
function urlFor(file) {
  const rel = relative(OUT, file).split(sep).join("/");
  if (rel === "index.html") return "/";
  // Page routes are requested without the .html suffix (e.g. /admin/questions).
  if (rel.endsWith(".html")) return `/${rel.slice(0, -5)}`;
  return `/${rel}`;
}

const files = walk(OUT)
  .sort()
  .map((file) => {
    const buf = readFileSync(file);
    return {
      url: urlFor(file),
      size: buf.length,
      hash: createHash("sha256").update(buf).digest("hex").slice(0, 16),
    };
  });

const version = createHash("sha256")
  .update(files.map((f) => `${f.url}:${f.hash}`).join("\n"))
  .digest("hex")
  .slice(0, 12);

const manifest = {
  version,
  generatedAt: new Date().toISOString(),
  totalBytes: files.reduce((sum, f) => sum + f.size, 0),
  files,
};
writeFileSync(join(OUT, "offline-manifest.json"), JSON.stringify(manifest));

const swPath = join(OUT, "sw.js");
const sw = readFileSync(swPath, "utf8");
// Matches the placeholder (fresh build) or an already-stamped version (re-run).
const stamp = /const VERSION = "(?:__OFFLINE_VERSION__|[0-9a-f]{12})";/;
if (!stamp.test(sw)) {
  console.error("sw.js has no VERSION constant to stamp.");
  process.exit(1);
}
const stampedSw = sw.replace(stamp, `const VERSION = "${version}";`);
writeFileSync(swPath, stampedSw);

// Vercel deploys a Next.js static export from its own build output plus public/,
// not from out/. So on Vercel (only — locally this would dirty tracked files)
// also publish the manifest and the stamped worker through public/, which
// Vercel collects after the build command finishes.
if (process.env.VERCEL === "1" && !process.env.OUT_DIR) {
  writeFileSync(join(ROOT, "public", "offline-manifest.json"), JSON.stringify(manifest));
  writeFileSync(join(ROOT, "public", "sw.js"), stampedSw);
  console.log("VERCEL=1: also wrote public/offline-manifest.json and public/sw.js");
}

const mb = (manifest.totalBytes / 1024 / 1024).toFixed(1);
console.log(`offline manifest: ${files.length} files, ${mb} MB, version ${version}`);
