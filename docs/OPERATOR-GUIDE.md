# Event Operator Guide — NAPE 2026 Geoscience Games

## Before doors open

1. Open the game on the event machine (serve the `out/` folder after
   `npm run build`, or use the deployed URL).
2. Press **Full Screen** on the opening screen (or F11).
3. Press **Sound Test** and confirm pop / cheer / fanfare through the PA.
4. Open **⚙ Admin** (no PIN) and set the challenge timer (default 45 s,
   used for Games 1–3), sound, confetti, host videos and music.
5. Press **Start Game**.

## Running a challenge

The facilitator bar under every challenge holds all the controls. It never
shows an answer, so it is safe on the projected screen.

| Control | When it appears | What it does |
| --- | --- | --- |
| Pop a balloon | Board | Pick a game tab, then click a balloon (it numbers 1–20 inside each game) |
| 💡 Show Hint | Missing Letters | Shows the original hint (players can also tap the Hint button) |
| 🔎 Reveal Clue | Guess the Feature | Reveals clues one at a time — worth 3, then 2, then 1 point |
| 👁 Reveal Answer | Always | Shows the correct answer. Nothing reveals it earlier |
| 📖 Reveal Why | Odd One Out | After the answer, shows the original explanation |
| ✓ Correct / ✕ Not Quite | After the answer is revealed | Records the result, updates the score, triggers the host reaction |
| ★ Award Bonus Point | Odd One Out | +1 for a correct reason. Never automatic. Can be toggled off again |
| Next Challenge ▸ | After marking | Pops the next unopened balloon in the same game |
| 🎈 Return to Board | Always | Back to the board (leaving before marking scores nothing) |

Tips:

- **Missing Letters:** players tap a blank, then tap letters (or type). They
  can change letters freely until the answer is revealed.
- **Odd One Out:** players can also press **1–4** to select a card.
- **Guess the Feature:** the photo is shown with no caption. The credit line
  appears only after the answer is revealed. If time is short, mark Correct
  with 0 or 1 clues shown for the full 3 points.
- The timer (Games 1–3) never marks anything when it runs out — it shows
  “Time's up!” and the facilitator decides. Game 4 has no timer.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Marked the wrong result | ⚙ Admin → Reset Event Score is the only undo; avoid by revealing first, marking second |
| Need a break | ⚙ Admin → **Pause Game** (balloons lock, timer freezes) |
| Browser refreshed | Opening screen → **Resume Previous Game** — nothing is lost |
| A host video won't play | The game falls back to the host image + recorded voice, then on-screen text. Skip ▸ always works; videos can be disabled in Admin |
| No sound | Check the Admin sound toggle, then machine/PA volume. Browsers only start sound after the first click |
| Want to see all answers | ⚙ Admin → **View All 80 Challenges** (facilitator only) |

## Ending the game

- ⚙ Admin → **End Game & View Results** shows totals, points, and each
  game's results with the host celebration. It also appears automatically
  after balloon 80.
- **Export Results** downloads a CSV (per-balloon outcomes with points and
  bonus) and a JSON summary.
- **Restart Game** brings all 80 balloons back (Admin resets ask first).

## Golden rules

- The game never collects names.
- Keep language encouraging — “Not Quite”, never “wrong”.
- Everything runs locally; no internet is needed once loaded.
