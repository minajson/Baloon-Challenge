# Managing the Questions

The bundled questions in `data/questions.ts` are the **defaults**. Manage
the live question bank in the **Question Manager** — open **⚙ Admin →
Manage Questions**, or go straight to `/admin/questions` (no PIN or
password).

## Option A — Question Manager (no code, recommended for event teams)

The manager supports adding, editing, duplicating, deleting (with
confirmation), enabling/disabling, reordering (drag-and-drop, move up/down
or manual order numbers), balloon assignment, question preview, images with
alt text, CSV import/export and Restore Defaults. Changes are stored in the
browser's localStorage and survive restarts **on that machine**.

### CSV import

1. Open `public/questions-template.csv` (or use **Export CSV** to start
   from the current bank) in Excel or Google Sheets.
2. Fill one row per question with these columns:

   | Column | Meaning |
   | --- | --- |
   | `id` | Optional stable id (e.g. `question-001`); empty = auto-generated. Rows matching an existing id update it only when “update existing” is ticked. |
   | `order` | Display/play order (1, 2, 3…) |
   | `balloonNumber` | Optional 1–50, unique among active questions (used by fixed mode) |
   | `question` | The question text (required) |
   | `optionA`–`optionD` | Answer options (C and D may be left empty) |
   | `correctAnswer` | A, B, C or D (1–4 also accepted) |
   | `explanation` | Optional explanation shown after answering |
   | `category` | e.g. Personal Safety, PPE, Fire Safety… |
   | `difficulty` | Easy, Medium or Hard |
   | `active` | true/false — inactive questions are excluded from play |
   | `image` | Optional image path (put files in `public/media/images/`) or empty |

3. Export/save as **CSV**, then **Import CSV** in the Question Manager.
4. The import summary reports imported / updated / skipped rows and lists
   every invalid row — nothing invalid is imported silently.

Notes:
- Wrap any text containing commas in double quotes (spreadsheets do this
  automatically on export).
- In fixed mode, balloons without an assigned question are skipped
  gracefully when popped (and the admin sees a notice). Sequential and
  random modes ignore fixed balloon assignments.

## Option B — edit the defaults (permanent, survives on every machine)

Edit `data/questions.ts` and change the entries directly. Each seed entry is:

```ts
{
  id: 1,                          // becomes "question-001"
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

Then rebuild: `npm run build`. Machines that already customised their bank
keep their localStorage copy until **Restore Defaults** is used.
