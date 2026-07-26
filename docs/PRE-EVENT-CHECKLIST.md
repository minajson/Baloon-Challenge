# Pre-Event Testing Checklist

Run this on the **actual event machine + projector/screen**, ideally the
day before.

## Machine & display

- [ ] `npm install` and `npm run build` complete without errors.
- [ ] Game opens and fills the screen in fullscreen mode (no scrollbars).
- [ ] Layout checked at the projector's real resolution (verified for
      1366×768 and 1920×1080).
- [ ] Text is readable from the back of the room.
- [ ] Internet disconnected → game still works completely.

## Content

- [ ] Final approved question set imported (or `data/questions.ts` updated).
- [ ] Every balloon opens one unique question; no question repeats.
- [ ] Official logo placed at `public/media/images/logo.png`.
- [ ] Explanations and category names spelled correctly.

## Sound & media

- [ ] Sound Test button: pop, cheer and fanfare audible through the PA.
- [ ] Correct answer → cheerful sound + confetti + mascot clip
      (“Good job! Well done!”).
- [ ] Wrong answer → gentle sound, correct answer highlighted after a
      pause, mascot clip (“Oh-oh! Please try again next time!”).
- [ ] Subtitles match the spoken dialogue.
- [ ] Male and female mascots alternate between questions.
- [ ] No overlapping audio when clicking quickly (interaction locks while a
      reaction plays).
- [ ] Avatar Skip ▸ button works.

## Game logic

- [ ] Popped balloons stay popped and cannot be selected again.
- [ ] Counter shows “N of 50 balloons remaining” correctly.
- [ ] Refresh the browser mid-game → Resume Previous Game restores
      everything (score, popped balloons, avatar turn).
- [ ] Timer counts down, pulses and beeps softly in the last 5 seconds;
      timeout is handled as a wrong answer.
- [ ] Timer can be disabled in Admin.
- [ ] Admin panel opens directly (no PIN); Mark Correct / Mark Incorrect / Skip Damaged
      Question work on a live question.
- [ ] Reset Game asks for confirmation and restores all 50 balloons.
- [ ] After balloon 50, the results screen appears with totals, accuracy,
      category breakdown and both final celebration clips.
- [ ] Export Results downloads the CSV + JSON summary.

## Accessibility

- [ ] Keyboard: Tab reaches balloons and buttons; A–D/1–4 answer; Enter
      advances.
- [ ] Correct/incorrect states show icons (✓/✕), not colour alone.
- [ ] Reduced-motion mode (OS setting) calms animations and still plays.

## Spares

- [ ] A second browser (Chrome + Edge/Firefox) tested.
- [ ] Backup copy of the built `out/` folder on a USB stick.
- [ ] This checklist re-run after any last-minute content change.
