# Event Operator Guide — Pop the Balloon Challenge

## Before doors open

1. Open the game on the event machine (`npm run dev`, or serve the `out/`
   folder after `npm run build`).
2. Press **Full Screen** on the opening screen (or F11 in most browsers).
3. Press **Sound Test** and confirm pop / cheer / fanfare through the PA.
4. Open **⚙ Admin** (no PIN required) and set:
   - Timer on/off and duration (default 30 s),
   - Sound, confetti, avatar videos, background music,
   - Starting avatar (male or female).
5. Preview both avatars (correct + wrong responses) from the Admin panel.
6. If the official question set is ready, import the CSV now
   (Admin → Questions → Import) — see `REPLACING-QUESTIONS.md`.
7. Press **Start Game**.

## During the event

- One participant walks up, calls or taps a balloon number.
- The balloon pops, the question appears, they choose A–D.
- The mascot reacts; press **Next Participant** (or Enter) to return to the
  wall. The male/female mascots alternate automatically.
- Keyboard shortcuts on the question screen: **A–D** or **1–4** to answer,
  **Enter** for next participant.

### Troubleshooting mid-game

| Problem | Fix |
| --- | --- |
| Question is wrong/damaged | Admin → Current Question → **Skip Damaged Question** (no score recorded) |
| Participant answered aloud but clicked wrong button | Admin → **Mark Correct** / **Mark Incorrect** before an option is chosen |
| Need a break | Admin → **Pause Game** (balloons lock, timer freezes) |
| Browser refreshed accidentally | Opening screen → **Resume Previous Game** — nothing is lost |
| Avatar video won’t play | The game automatically falls back to the mascot image + recorded voice, then to on-screen text. You can also disable avatar videos in Admin. |
| No sound | Check the Admin sound toggle first, then the machine/PA volume. Sounds only start after the first click on the page (browser rule). |

- A stuck avatar clip can always be skipped with the small **Skip ▸** button.

## After the last balloon

- The results screen appears automatically: totals, accuracy and the
  strongest / needs-more-awareness safety categories, plus both mascots’
  final message: *“Well done, everyone! Remember to always stay safe!”*
- Press **Export Results** to download a CSV (per-balloon outcomes) and a
  JSON summary.
- **Restart Game** resets all 50 balloons for another session (a
  confirmation is required for resets from the Admin panel).

## Golden rules

- The game never collects names — keep it that way.
- Never announce “failure”; the game language is deliberately encouraging.
- Keep the machine offline-safe: everything runs locally, no internet needed.
