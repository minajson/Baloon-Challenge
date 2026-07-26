# POP THE BALLOON CHALLENGE

An interactive, offline-capable safety game. Fifty numbered balloons hide
safety questions; participants pop a balloon, answer the question and get an
instant reaction from one of two animated Nigerian safety-ambassador mascots.
Branding: Renaissance logo (left) and SPE International logo (right) in a
compact header around the centred game title.

No participant names, emails or personal information are collected.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build (static export to ./out):

```bash
npm run build
```

Serve `out/` from any static host or `npx serve out` for a local
production run. **After the build the game works fully offline** — all
questions, sounds, images and avatar videos are local files, and a service
worker (`public/sw.js`) caches the app shell and every game asset after the
first online visit.

## Tech stack

- Next.js (App Router, static export) + TypeScript
- Tailwind CSS v4
- Framer Motion for animations
- HTML5 audio/video with a Web Audio synthesis fallback
- `localStorage` for game progress, settings and the editable question bank
  (survives refresh); service worker + web app manifest for offline mode

## Project layout

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Game orchestrator (screens, state machine, persistence) |
| `app/admin/questions/` | Question Manager (CRUD, reorder, CSV, settings) |
| `components/` | Balloon wall, question card, avatar overlay, admin panel, results… |
| `components/BrandHeader.tsx` | Renaissance / title / SPE header |
| `data/questions.ts` | The 50 default questions (Restore Defaults source) |
| `data/avatar-manifest.json` | Avatar clip manifest (files, dialogue, fallbacks) |
| `lib/` | Types, storage, question store, sound manager, CSV import/export |
| `public/media/avatars/` | Mascot reaction videos (male/, female/) |
| `public/media/audio/` | Recorded dialogue lines + background music |
| `public/media/images/` | Logos (`renaissance-logo.png`, `spe_logo.png`), mascot masters |
| `public/media/sfx/` | Sound effects (regenerate with `npm run sfx`) |
| `public/questions-template.csv` | CSV template for question import |
| `public/sw.js` / `public/manifest.webmanifest` | Offline service worker + PWA manifest |
| `docs/` | Operator guide, checklists, replacement instructions |

## Game flow

1. **Opening screen** — Start Game / How to Play / Sound Test / Full Screen / Admin.
2. **Balloon wall** — 50 floating balloons under the logo header, live
   counters (correct, incorrect, remaining, accuracy).
3. **Question card** — large A–D answers, optional 30 s timer with soft
   countdown, one attempt (or admin-enabled second-attempt mode).
4. **Reaction** — the male and female mascots alternate automatically.
   Correct: confetti + a warm well-done line. Wrong: an encouraging retry
   line — always warm, never mocking. The mascot stays until the
   facilitator clicks **Next Participant**.
5. **Results** — totals, accuracy, strongest/weakest categories, final
   celebration clips, export, restart.

Progress is saved automatically; an accidental refresh offers
**Resume Previous Game**.

## Admin panel

Open with the ⚙ icon (top-right) — **no PIN or password**. Includes:
start/pause/resume/reset, timer settings, sound / music / confetti / avatar
toggles, avatar previews, manual mark correct/incorrect, skip damaged
question, results export, fullscreen, and a link to the Question Manager.

## Question Manager (`/admin/questions`)

Opens directly (no authentication — see `ADMIN_AUTH_ENABLED` in
`components/AdminPanel.tsx` to reinstate a gate later). Supports: view /
search / filter / sort, add, edit, duplicate, delete (with confirmation),
enable/disable, drag-and-drop + move up/down + manual order, balloon
assignment with duplicate warnings, per-question images with alt text,
question preview, CSV import (with import summary and optional
update-existing), CSV export, restore defaults, active-question count, and
game settings (fixed / sequential / random question modes, questions per
session).

## Deployment

See `docs/DEPLOYMENT.md` for Netlify and Vercel instructions.

## Event day

Read `docs/OPERATOR-GUIDE.md` and run through
`docs/PRE-EVENT-CHECKLIST.md` on the actual event machine.
