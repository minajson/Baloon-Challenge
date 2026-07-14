# POP THE BALLOON CHALLENGE — “Run Am Safe”

An interactive, offline-capable safety game for **Renaissance People Day**
(Renaissance Africa Energy Company). Fifty numbered balloons hide fifty
safety questions; participants pop a balloon, answer the question and get an
instant reaction from one of two animated Nigerian safety-ambassador mascots.

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
questions, sounds, images and avatar videos are local files.

## Tech stack

- Next.js (App Router, static export) + TypeScript
- Tailwind CSS v4
- Framer Motion for animations
- HTML5 audio/video with a Web Audio synthesis fallback
- `localStorage` for game progress and settings (survives refresh)

## Project layout

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Game orchestrator (screens, state machine, persistence) |
| `components/` | Balloon wall, question card, avatar overlay, admin panel, results… |
| `data/questions.ts` | **The 50 placeholder questions — replace before the event** |
| `data/avatar-manifest.json` | Avatar clip manifest (files, dialogue, fallbacks) |
| `lib/` | Types, storage, sound manager, CSV import/export, avatar selection |
| `public/media/avatars/` | Mascot reaction videos (male/, female/) |
| `public/media/audio/` | Recorded dialogue lines (fallback tier + reference) |
| `public/media/images/` | Mascot master images, wardrobe references, logo slot |
| `public/media/sfx/` | Sound effects (regenerate with `npm run sfx`) |
| `public/questions-template.csv` | CSV template for question import |
| `docs/` | Operator guide, checklists, replacement instructions |
| `scripts/generate-sfx.mjs` | Offline sound-effect generator |

## Game flow

1. **Opening screen** — Start Game / How to Play / Sound Test / Full Screen / Admin.
2. **Balloon wall** — 50 floating balloons, permanent “RENAISSANCE PEOPLE DAY”
   brand panel, live counters (correct, incorrect, remaining, accuracy).
3. **Question card** — large A–D answers, optional 30 s timer with soft
   countdown, one attempt (or admin-enabled second-attempt mode).
4. **Reaction** — the male and female mascots alternate automatically.
   Correct: *“Good job! Run am safe!”* + confetti. Wrong: *“Oh-oh! Please try
   again next time, but still run am safe o!”* — always warm, never mocking.
5. **Results** — totals, accuracy, strongest/weakest categories, final
   celebration clips, export, restart.

Progress is saved automatically; an accidental refresh offers
**Resume Previous Game**.

## Admin panel

Open with the ⚙ icon (top-right) — default PIN: **1234** (change or clear it
in the panel). Includes: start/pause/resume/reset, timer settings, sound /
music / confetti / avatar toggles, avatar previews, manual mark
correct/incorrect, skip damaged question, CSV question import, results
export and fullscreen.

## Replacing content

- **Questions** — see `docs/REPLACING-QUESTIONS.md` (edit
  `data/questions.ts` or import a CSV in the Admin panel).
- **Avatar videos / voices** — see `docs/REPLACING-MEDIA.md`.

Event branding is the text mark **RENAISSANCE PEOPLE DAY** (no image logo).

## Deployment

See `docs/DEPLOYMENT.md` for Netlify and Vercel instructions.

## Event day

Read `docs/OPERATOR-GUIDE.md` and run through
`docs/PRE-EVENT-CHECKLIST.md` on the actual event machine.
