#!/usr/bin/env bash
# Builds the standalone macOS app:   npm run build:mac
# Output:  dist/NAPE 2026 Geoscience Games.app   (+ a .zip for copying to another Mac)
# Builds for the Mac you run it on (Apple Silicon or Intel). Build on the Mac that will run the game.
set -euo pipefail
cd "$(dirname "$0")/.."
APP_NAME="NAPE 2026 Geoscience Games"
mkdir -p dist

echo "1/6  Building the game (static export + offline manifest)…"
npm run build

echo "2/6  Installing the desktop tooling (first run downloads Electron)…"
(cd desktop && npm install --no-audit --no-fund)

echo "3/6  Staging the game files into the app…"
rm -rf desktop/app
mkdir -p desktop/app
cp -R out desktop/app/out

echo "4/6  Making the app icon…"
node desktop/make-icon.cjs

echo "5/6  Assembling the .app…"
node desktop/package-app.cjs >/dev/null

echo "6/6  Signing (ad-hoc, local use) and zipping…"
codesign --force --deep --sign - "dist/$APP_NAME.app"
codesign --verify --deep --strict "dist/$APP_NAME.app"
ARCH_LABEL="$(uname -m | sed 's/x86_64/x64/')"
ditto -c -k --sequesterRsrc --keepParent "dist/$APP_NAME.app" "dist/NAPE-2026-Geoscience-Games-mac-$ARCH_LABEL.zip"

echo
echo "Done:  dist/$APP_NAME.app"
du -sh "dist/$APP_NAME.app" | awk '{print "Size:  " $1}'
echo "Double-click it in Finder, or drag it to your Applications folder."
