# Replacing the Avatar Videos and Voices

## Branding

The game is branded **NAPE 2026 GEOSCIENCE GAMES** and carries no
organisation logos. The title lives in `components/BrandHeader.tsx`,
`components/OpeningScreen.tsx`, `app/layout.tsx` and
`public/manifest.webmanifest`. The decorative emblem is
`components/Emblem.tsx` / `public/icon.svg` (PNG app icons in
`public/media/images/app-icon-*.png`).

**Mascot clothing carries no lettering.** The original host videos and
master images had a printed wordmark on the chest; it was removed
frame-by-frame. If you regenerate any clip, keep the coverall plain.

## Game 4 photographs

`public/media/photos/feature-01.jpg` … `feature-20.jpg` — one per
challenge, with attribution and licence in `data/photo-credits.json` (also
listed on the Challenge Bank page and in `docs/PHOTO-CREDITS.md`). To swap a
photo, overwrite the file (same name, landscape, about 1600–1920 px wide,
no captions or signs) and update its credit entry. Keep filenames neutral —
never name a file after its answer. Run `npm run validate` afterwards.

## Avatar reaction videos

All clips live in:

```
public/media/avatars/male/
  male_correct_01.mp4   male_correct_02.mp4
  male_wrong_01.mp4     male_wrong_02.mp4
  male_final_celebration.mp4
public/media/avatars/female/
  female_correct_01.mp4  female_correct_02.mp4
  female_wrong_01.mp4    female_wrong_02.mp4
  female_final_celebration.mp4
```

To replace a clip, overwrite the file (same name) — nothing else needed.
To add/rename clips or transparent `.webm` versions, also update
`data/avatar-manifest.json`; each entry is:

```json
{
  "gender": "male",
  "responseType": "correct",          // correct | wrong | final
  "file": "/media/avatars/male/male_correct_01.webm",   // transparent webm or null
  "fallbackFile": "/media/avatars/male/male_correct_01.mp4",
  "audioFile": "/media/audio/male_correct.wav",
  "dialogue": "Good job! Well done!",
  "durationSec": 4,
  "hasTransparency": false
}
```

Playback fallback order (automatic, per clip):
1. transparent WebM (`file`)
2. MP4 (`fallbackFile`)
3. mascot master image + recorded audio (`audioFile`)
4. mascot master image + on-screen dialogue
5. skip and continue — the game never crashes on missing media.

## How the shipped clips were generated

The clips were generated during development (the live game never calls any
AI service): stylised 3D mascot master images, Nigerian-accented dialogue
audio (WAVs in `public/media/audio/`) and short gesture videos animated
from each master image so the characters do not drift between clips. To use
a different voice, regenerate the six lines and overwrite the WAVs.

Keep every new clip consistent: same master image, same voice, same plain
coverall.

## Dialogue lines (fixed)

- Correct: **“Good job! Well done!”**
- Wrong: **“Oh-oh! Please try again next time!”**
- Final: **“Well done, everyone! Remember to always stay safe!”**

Subtitles are rendered from `data/avatar-manifest.json` — if you change a
recorded line, update its `dialogue` string so subtitles match.
