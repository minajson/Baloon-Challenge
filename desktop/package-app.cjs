// Assembles "NAPE 2026 Geoscience Games.app" from the Electron runtime that
// `npm install` placed in desktop/node_modules, plus our main process and the
// staged game (desktop/app/out). Needs no network at all.
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const NAME = "NAPE 2026 Geoscience Games";
const BUNDLE_ID = "com.nape.geosciencegames";
const root = path.join(__dirname, "..");
const runtime = path.join(__dirname, "node_modules", "electron", "dist", "Electron.app");
const dest = path.join(root, "dist", `${NAME}.app`);

if (!fs.existsSync(runtime)) {
  console.error("Electron runtime not found — run `npm install` in desktop/ first.");
  process.exit(1);
}
if (!fs.existsSync(path.join(__dirname, "app", "out", "index.html"))) {
  console.error("Staged game not found in desktop/app/out.");
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(path.dirname(dest), { recursive: true });
// ditto preserves symlinks, permissions and extended attributes inside the frameworks.
execFileSync("ditto", [runtime, dest]);

const contents = path.join(dest, "Contents");
fs.renameSync(path.join(contents, "MacOS", "Electron"), path.join(contents, "MacOS", NAME));

const plist = path.join(contents, "Info.plist");
const buddy = (cmd) => execFileSync("/usr/libexec/PlistBuddy", ["-c", cmd, plist]);
const set = (key, value) => {
  try {
    buddy(`Set :${key} ${value}`);
  } catch {
    buddy(`Add :${key} string ${value}`);
  }
};
set("CFBundleExecutable", `"${NAME}"`);
set("CFBundleName", `"${NAME}"`);
set("CFBundleDisplayName", `"${NAME}"`);
set("CFBundleIdentifier", BUNDLE_ID);
set("CFBundleIconFile", "app.icns");
set("LSApplicationCategoryType", "public.app-category.education");
set("NSHumanReadableCopyright", `"NAPE 2026 Geoscience Games"`);

// Icon, and drop Electron's own default app.
const res = path.join(contents, "Resources");
fs.copyFileSync(path.join(__dirname, "icon.icns"), path.join(res, "app.icns"));
fs.rmSync(path.join(res, "electron.icns"), { force: true });
fs.rmSync(path.join(res, "default_app.asar"), { force: true });

// The app itself.
const appDir = path.join(res, "app");
fs.mkdirSync(appDir, { recursive: true });
for (const f of ["main.cjs", "preload.cjs"]) fs.copyFileSync(path.join(__dirname, f), path.join(appDir, f));
fs.writeFileSync(
  path.join(appDir, "package.json"),
  JSON.stringify({ name: "nape-2026-geoscience-games", productName: NAME, version: "1.0.0", main: "main.cjs" }, null, 2),
);
fs.cpSync(path.join(__dirname, "app"), path.join(appDir, "app"), { recursive: true });

console.log(dest);
