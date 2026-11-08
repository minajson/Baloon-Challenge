# Running NAPE 2026 Geoscience Games with no internet

Two ways to run the game with no Wi-Fi, no mobile data and no connection of
any kind. **For the live event, use Option B (the standalone Mac app)** — it
contains the whole game and needs nothing from the internet, ever. Option A
(the installable web app) is the backup, and is what runs on the public site.

| | Option A — Web app (PWA) | Option B — Standalone Mac app |
| --- | --- | --- |
| Needs internet | Once, to download the files | Never (only to build it) |
| Install | Open the site, wait for “Offline Ready”, install | Double-click the `.app` |
| Works after restart/reboot | Yes, while the browser keeps its stored files | Yes |
| Risk | Browser may clear stored files (see Limitations) | None of that — files live inside the app |
| Best for | A backup, a second laptop | **The event** |

## Option B — Standalone Mac app (recommended)

### Build it (once, with internet, on your MacBook)

```bash
npm install
npm run build:mac
```

This takes about a minute. It builds the game, bundles it into a Mac app and
signs it for local use. Result:

- `dist/NAPE 2026 Geoscience Games.app` — the app (about 320 MB)
- `dist/NAPE-2026-Geoscience-Games-mac-arm64.zip` — the same app zipped, for
  copying to another Mac (use `ARCH=x64 npm run build:mac` for an Intel Mac)

### Install and launch (no terminal)

1. In Finder, open the project's `dist` folder.
2. Drag **NAPE 2026 Geoscience Games** into **Applications** (or onto the
   Desktop or Dock).
3. Double-click it. The game opens in its own window — no browser, no server,
   no internet. Press **⌃⌘F** (or the game's **Full Screen** button) for the
   projector.

If macOS says the app “can't be opened because it is from an unidentified
developer” (this only happens when the app was copied from another Mac or
downloaded): **right-click the app → Open → Open**, once. An app built on the
same MacBook opens normally.

### Where progress is saved

Scores, completed balloons and settings are saved automatically on the
MacBook (`~/Library/Application Support/NAPE 2026 Geoscience Games`). Quitting
and reopening the app shows **Resume Previous Game**. **Reset Game** is in
⚙ Admin.

### Updating the app after the game changes

Run `npm run build:mac` again and replace the app in Applications. Saved
progress is kept.

## Option A — Installable web app (PWA)

The public site (https://baloon-challenge.vercel.app) downloads a complete
copy of itself the first time it is opened, then runs without internet.

### First-time preparation (do this with internet, ideally the day before)

1. Open the site in **Google Chrome** (or Edge) on the event MacBook.
2. Click **⚙ Admin** and find **Offline Mode**. It shows
   **Preparing Offline Files** with a progress bar for about a minute, then
   **Offline Ready** with the file count (for example *90 / 90 files · 59 MB*).
   Do not rely on anything else — **Offline Ready is the only green light.**
3. Install it (optional but recommended): click **Install App** in the same
   panel (or the install icon at the right of Chrome's address bar). It then
   opens like an app, from Launchpad or the Dock.
4. Close the app, turn Wi-Fi off, open the app again and run the checklist
   below.

For Safari: *File → Add to Dock*, then follow the same steps. Safari clears
stored website data after about a week without use, so with Safari prefer
Option B.

### What the indicator means

| Indicator | Meaning |
| --- | --- |
| **Offline Ready** | Every game file (pages, scripts, photos, illustrations, sounds, mascot videos) is stored on this computer and was read back successfully |
| **Preparing Offline Files** | Downloading or re-checking; wait for it to finish |
| **Offline Files Incomplete** | Something is missing (it names the file). Connect to the internet and press **Verify Now** (or **Retry Download**) |

It looks at the real stored files, **not** at whether Wi-Fi is on. Press
**Verify Now** at any time to re-check every file.

### Updates

When a new version is published, an installed copy downloads it in the
background (you'll see “A newer version has been downloaded”). The running
game is never changed mid-event: the update starts the next time the app is
closed and reopened, or when you press **Apply Update Now**. If an update
download fails part-way, the old complete version stays in use.

## Offline verification checklist (do the day before, on the event MacBook)

Run this for the option you will use at the event.

- [ ] Admin → Offline Mode shows **Offline Ready** (Option A), or the app
      opens by double-click (Option B — Admin shows *Offline Ready · Standalone
      app*).
- [ ] **Turn Wi-Fi off** (menu bar → Wi-Fi → off) and unplug any Ethernet or
      phone tethering. Confirm no internet: a browser page elsewhere won't load.
- [ ] **Quit** the game completely (⌘Q) and **open it again** from the Dock or
      Applications.
- [ ] **Restart the MacBook** (Apple menu → Restart), leave Wi-Fi off, open the
      game again.
- [ ] Play one balloon from **each of the four games**: Picture Puzzles
      (illustrations show), Missing Letters (tiles + hint), Odd One Out (reveal
      answer, then why, then a bonus point), Guess the Feature (**photo loads**,
      clues, answer).
- [ ] Mascot video and voice play after a Correct and after a Not Quite;
      pop / cheer sounds and the background music play.
- [ ] Scores update; completed balloons show ✓ / ✕; **refresh or quit and
      reopen → Resume Previous Game** restores everything.
- [ ] ⚙ Admin → Reset Game works (all 80 balloons return).
- [ ] Connect to the projector, press **Full Screen**, and check text and
      photos from the back of the room.
- [ ] (Option A) Admin → Offline Mode → **Verify Now** still shows Offline Ready.

## How offline readiness is verified in this project

| Command | What it proves |
| --- | --- |
| `npm run audit:offline` | From the built files alone: every file is listed in the offline manifest with the right size and hash; every photo, video, audio file, icon and bundle is included; every `/media` and `/_next` path referenced anywhere exists; no page, script, style, font or media loads from another website |
| `npm run test:offline` | Installs the web app in a fresh Chrome profile, **shuts the web server down completely**, relaunches Chrome and plays everything: four games, scoring, bonus, resume after restart, reset, all 80 challenges, every photo/video/audio file; checks the indicator refuses to say “Ready” when a file is missing; checks updates and that a broken update never replaces a working version |
| `npm run test:offline:safari` | The same, in Safari's engine (WebKit) |
| `npm run build:mac` then `npm run test:desktop` | Launches the packaged Mac app with **every DNS lookup failing**, plays everything, quits and relaunches, and launches it the way a double-click does (macOS LaunchServices) |
| `TARGET_URL=https://baloon-challenge.vercel.app npm run test:offline` | The live deployment, with the browser's network switched off after install |

## Limitations and things that cannot be removed

- **The first load needs internet** (Option A). After “Offline Ready”, none.
  Option B needs internet only to build it.
- **Browsers can clear stored files.** Chrome keeps them unless the disk is
  nearly full or you clear site data; the game asks Chrome to keep them
  permanently. Safari may clear them after about 7 days unused. Re-open the
  site online and check **Offline Ready** before the event — or use Option B.
- **Photo credits links** (Admin → View All 80 Challenges) open Wikimedia
  Commons in your browser and need internet. They are attribution links, not
  game content.
- **An unsigned app** (Option B) shows a one-time “unidentified developer”
  prompt if copied from another Mac. It is signed for the Mac it was built on.
  A fully notarised app needs an Apple Developer account, which this project
  does not use.
- **The final mascot line** says “Remember to always stay safe!” — it is
  recorded audio; replacing it means regenerating the voice clip.
- **Reboot test:** the automated tests restart the browser/app, not the
  computer. Do the restart step in the checklist once on the event MacBook.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Offline Files Incomplete | Connect to the internet → ⚙ Admin → Offline Mode → **Verify Now** (downloads what's missing) or **Retry Download** |
| Stuck on Preparing | Stay connected; if it doesn't finish in 5 minutes press **Retry Download** |
| Site looks old after an update | Admin → **Apply Update Now**, or close and reopen the app |
| Want a clean start (Option A) | Chrome → Settings → Privacy → Site settings → View permissions and data → baloon-challenge.vercel.app → Delete data, then reopen online |
| Option B won't open | Right-click → Open once; or rebuild with `npm run build:mac` on this Mac |
