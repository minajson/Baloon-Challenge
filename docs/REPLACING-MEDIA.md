# Replacing the Avatar Videos and Voices

## Event branding

The game uses a text event mark — **RENAISSANCE PEOPLE DAY** (green) — shown
at the top of the opening and results screens and as a slim identifier on
the left edge during gameplay. There is no image logo. To add an official
logo later, drop it into a screen component (e.g. `OpeningScreen.tsx` /
`ResultsScreen.tsx`) next to the RENAISSANCE PEOPLE DAY text. Do not redraw
or recreate the official logo.

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
  "dialogue": "Good job! Run am safe!",
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

## How the shipped clips were generated (regeneration guide)

The pipeline used the **Higgsfield MCP** (all assets generated during
development — the live game never calls any AI service):

1. **Wardrobe references** (photoreal, reference-only):
   `renaissance_male_avatar_master.png`, `renaissance_female_avatar_master.png`
   (Higgsfield Soul 2).
2. **Mascot masters** (stylized 3D, the real characters):
   `RENAISSANCE_MALE_MASCOT_MASTER.png`, `RENAISSANCE_FEMALE_MASCOT_MASTER.png`
   (Nano Banana Pro, wardrobe image as reference, green RENAISSANCE
   wordmark on the chest).
3. **Dialogue audio** (Higgsfield `seed_audio` TTS): male = the account's
   custom "Tunde" voice; female = "Tasha" preset. Files in
   `public/media/audio/`. To use a different Nigerian voice, create a
   custom voice in Higgsfield (Create Voice), regenerate the six lines, and
   overwrite the WAVs.
4. **Reaction videos** (Seedance 2.0): `start_image` = the mascot master,
   `audio_references` = the dialogue WAV, `generate_audio: true`, 1080p,
   3:4, 4–5 s, prompts describing each gesture. The start image anchors
   identity so the characters do not drift between clips.
5. Optional transparency: Higgsfield `remove_background` (video) on each
   clip; save results as `.webm`/`.mov` next to the MP4s and set `file` +
   `hasTransparency` in the manifest.

Keep every new clip consistent: same master image, same voice, same
coverall, same green RENAISSANCE wordmark.

## Dialogue lines (fixed)

- Correct: **“Good job! Run am safe!”**
- Wrong: **“Oh-oh! Please try again next time, but still run am safe o!”**
- Final: **“Well done, everyone! Remember to always run am safe!”**

Subtitles are rendered from `data/avatar-manifest.json` — if you change a
recorded line, update its `dialogue` string so subtitles match.
