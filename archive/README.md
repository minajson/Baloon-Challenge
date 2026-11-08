# Archive — original question bank

The Balloon Game's original 50-question bank and its question-management
tools, kept **outside the active application** for future restoration. Nothing
here is compiled, bundled or imported by the app (`archive/` is excluded from
TypeScript and ESLint, and `npm run validate` checks that nothing imports it).

| File | What it is |
| --- | --- |
| `original-question-bank/questions.ts` | The original 50 multiple-choice questions |
| `original-question-bank/questions-template.csv` | The original CSV import template |
| `original-question-bank/questionStore.ts.txt` | The old localStorage question store |
| `original-question-bank/question-manager-page.tsx.txt` | The old Question Manager page |

The `.txt` extension keeps the two code files from being picked up as source.

## Restoring

The app now plays the 80 NAPE challenges in `data/nape2026.json`. To bring the
original multiple-choice game back, restore from Git history at commit
`4de2448` (the last commit before the NAPE conversion) — the archive here holds
the question content, not the old multiple-choice game screens.
