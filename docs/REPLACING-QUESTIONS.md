# Replacing the 50 Placeholder Questions

The shipped questions in `data/questions.ts` are **placeholders**. Replace
them with the approved Renaissance question set in either of two ways.

## Option A — CSV import (no code, recommended for event teams)

1. Open `public/questions-template.csv` in Excel or Google Sheets.
2. Fill one row per balloon with these columns:

   | Column | Meaning |
   | --- | --- |
   | `balloonNumber` | 1–50, unique |
   | `category` | e.g. Personal Safety, PPE, Fire Safety… |
   | `difficulty` | Easy, Medium or Hard |
   | `question` | The question text |
   | `optionA`–`optionD` | Answer options (D may be left empty for 3-option questions) |
   | `correctOption` | A, B, C or D |
   | `explanation` | One-sentence explanation shown after answering |
   | `image` | Optional image path (put files in `public/media/images/`) or empty |
   | `timeLimit` | Optional seconds override, or empty for the global timer |

3. Export/save as **CSV**.
4. In the game: **⚙ Admin → Questions → Import Questions (CSV)**.
5. The imported set is stored in the browser's localStorage and survives
   restarts **on that machine**. “Restore Default Questions” returns to the
   bundled set.

Notes:
- Wrap any text containing commas in double quotes (spreadsheets do this
  automatically on export).
- If fewer than 50 valid rows are imported, balloons without questions are
  skipped gracefully when popped (and the admin sees a notice).

## Option B — edit the source (permanent, survives on every machine)

Edit `data/questions.ts` and change the entries directly. Each question is:

```ts
{
  id: 1,
  balloonNumber: 1,
  category: "Personal Safety",
  difficulty: "Easy",
  question: "What should you do before starting an unfamiliar task?",
  options: ["…", "…", "…", "…"],
  correctAnswerIndex: 1,        // 0 = A, 1 = B, 2 = C, 3 = D
  explanation: "…",
  image: null,                  // or "/media/images/my-image.png"
  timeLimit: null,              // or seconds, e.g. 45
}
```

Then rebuild: `npm run build`.
