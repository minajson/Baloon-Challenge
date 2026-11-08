# Pre-Event Testing Checklist

Run this on the **actual event machine + projector/screen**, ideally the
day before.

## Machine & display

- [ ] `npm install` and `npm run check` and `npm run build` pass.
- [ ] Game fills the screen in fullscreen mode (no scrollbars) at the
      projector's real resolution (checked at 1366×768, 1920×1080 and
      ultrawide).
- [ ] Text, tiles and photographs are readable from the back of the room.
- [ ] Internet disconnected → game still works completely — follow the full
      offline checklist in `docs/OFFLINE.md` (including a restart).

## Content (all four games)

- [ ] Board shows four tabs with 20 balloons each; tab counters read
      “0 / 20 played” on a new game.
- [ ] **Picture Puzzles:** two panels with a **+**, answer box shows “?” until
      Reveal Answer.
- [ ] **Missing Letters:** tiles can be tapped and typed; letters can be
      changed; Hint works from both the puzzle and the facilitator bar.
- [ ] **Odd One Out:** four cards; Reveal Answer, then Reveal Why; bonus
      point only when the facilitator presses it.
- [ ] **Guess the Feature:** photo loads; clues appear one at a time; points
      readout drops 3 → 2 → 1; credit line appears only after the answer.
- [ ] No answer is visible before Reveal Answer in any game.
- [ ] `npm run validate` reports all checks passed.

## Sound & media

- [ ] Sound Test: pop, cheer and fanfare audible through the PA.
- [ ] Correct → cheerful sound + confetti + host clip; Not Quite → gentle
      sound + encouraging clip.
- [ ] Male and female hosts alternate; Skip ▸ works.
- [ ] No overlapping audio when clicking quickly.

## Game logic

- [ ] Popped balloons stay deflated, show ✓ or ✕, and cannot be reused.
- [ ] Score bar: Points, Correct, Not Quite, Remaining, Accuracy all update.
- [ ] Next Challenge opens the next unopened balloon in the same game;
      Return to Board keeps the same tab.
- [ ] Refresh mid-game → **Resume Previous Game** restores everything.
- [ ] Timer pulses and ticks in the last 5 seconds and never auto-marks.
- [ ] ⚙ Admin: Pause, Reset (asks to confirm), End Game & View Results,
      Export Results all work.

## Accessibility

- [ ] Tab reaches balloons, tiles, cards and facilitator buttons.
- [ ] Results use icons/labels (✓ / ✕ / “Odd one out!”), not colour alone.
- [ ] Reduced-motion mode calms animations and still works.

## Spares

- [ ] A second browser tested.
- [ ] Backup copy of the built `out/` folder on a USB stick.
