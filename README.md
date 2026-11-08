# NAPE 2026 GEOSCIENCE GAMES

An interactive, offline-capable balloon game for live events. Eighty numbered
balloons hide geoscience challenges across four games. A participant pops a
balloon, takes on the challenge, and the facilitator reveals the answer and
scores it. Animated host mascots react to every result.

No participant names, emails or personal information are collected.

## The four games (20 challenges each)

| # | Game | What players do |
| --- | --- | --- |
| 1 | 🧩 **Picture Puzzles** | Two pictures with a **+** between them — name the geoscience term |
| 2 | 🔤 **Missing Letters** | Fill the blanks using big letter tiles (touch, mouse or keyboard); optional hint |
| 3 | 🎯 **Odd One Out** | Pick the card that doesn't belong; the facilitator reveals the answer, then why |
| 4 | 🌋 **Guess the Geological Feature** | Study a photograph; clues are revealed one at a time for 3 / 2 / 1 points |

Content source: *NAPE 2026 Geoscience Games* (Olem Oruene, 4 November 2026),
transcribed verbatim into [`data/nape2026.json`](data/nape2026.json).

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run check      # lint + typecheck + content validation
npm run build      # static export to ./out
npx serve out      # local production run
```

After the first online visit the game works fully offline — all challenges,
sounds, images, photographs and mascot videos are local files, cached by a
service worker (`public/sw.js`).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run validate` | Content validation (80 challenges, assets, credits, branding scan) |
| `npm run test:e2e` | Browser test of all four games against the static build (needs Chrome; see `scripts/e2e.mjs`) |
| `npm run check` | lint + typecheck + validate |

## Tech stack

Next.js (App Router, static export) · TypeScript · Tailwind CSS v4 ·
Framer Motion · HTML5 audio/video with a Web Audio fallback · `localStorage`
for game progress and settings · service worker + web manifest.

## Project layout

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Game orchestrator (screens, state machine, scoring, persistence) |
| `app/admin/questions/` | Facilitator-only Challenge Bank (read-only, shows answers + photo credits) |
| `components/BalloonWall.tsx`, `Balloon.tsx` | Tabbed balloon board and the balloon pop animation |
| `components/challenge/` | The four game layouts, the facilitator bar and the Game 1 illustrations |
| `components/AdminPanel.tsx` | Facilitator settings: timer, sound, pause, reset, end game, export |
| `data/nape2026.json` | The 80 challenges — authoritative source |
| `data/challenges.ts` | Typed loader, game categories/colours, Odd One Out card emoji |
| `data/photo-credits.json` | Author, licence and source for every Game 4 photograph |
| `lib/` | Types, scoring helpers, storage, sound manager |
| `scripts/validate-content.mjs` | Content validation |
| `archive/original-question-bank/` | The previous question bank, kept for restoration; not part of the app |
| `public/media/` | Photos, mascot videos, audio, sound effects, icons |
| `docs/` | Operator guide, checklist, content and media guides |

## Facilitator flow

1. **Open Balloon** — the participant picks a game tab and pops a balloon.
2. The challenge opens. The participant attempts it (tiles, card or guess).
3. **Show Hint** (Missing Letters) · **Reveal Clue** (Game 4, one at a time).
4. **Reveal Answer** — answers are never on screen before this. In Odd One
   Out, **Reveal Why** shows the original explanation afterwards.
5. **Correct** or **Not Quite** — scoring is always the facilitator's call.
   Game 4 awards 3 / 2 / 1 points by clues used; other games award 1 point.
6. **Award Bonus Point** (Odd One Out) — +1 for a correct reason, only when
   the facilitator presses it.
7. **Next Challenge** (next unopened balloon in the same game) or
   **Return to Board**. Completed balloons stay deflated with a ✓ / ✕ stamp.

**Reset Game** and **End Game & View Results** live in the ⚙ Admin panel.

See [`docs/OPERATOR-GUIDE.md`](docs/OPERATOR-GUIDE.md) and
[`docs/PRE-EVENT-CHECKLIST.md`](docs/PRE-EVENT-CHECKLIST.md) for event day.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
