// Builds desktop/icon.icns from the game's icon.svg (uses sharp from the root install + macOS iconutil).
const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const sharp = require(path.join(__dirname, "..", "node_modules", "sharp"));

(async () => {
  const svg = path.join(__dirname, "..", "public", "icon.svg");
  const set = path.join(__dirname, "icon.iconset");
  fs.rmSync(set, { recursive: true, force: true });
  fs.mkdirSync(set);
  const sizes = [16, 32, 128, 256, 512];
  for (const s of sizes) {
    await sharp(svg, { density: 1200 }).resize(s, s).png().toFile(path.join(set, `icon_${s}x${s}.png`));
    await sharp(svg, { density: 1200 }).resize(s * 2, s * 2).png().toFile(path.join(set, `icon_${s}x${s}@2x.png`));
  }
  execFileSync("iconutil", ["-c", "icns", set, "-o", path.join(__dirname, "icon.icns")]);
  fs.rmSync(set, { recursive: true, force: true });
  console.log("icon.icns written");
})();
