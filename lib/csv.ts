import type { Difficulty, Question } from "./types";

/**
 * Minimal CSV parser supporting quoted fields, embedded commas, quotes and
 * newlines — no dependency needed.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

const HEADERS = [
  "balloonNumber",
  "category",
  "difficulty",
  "question",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "correctOption",
  "explanation",
  "image",
  "timeLimit",
] as const;

export interface CsvImportResult {
  questions: Question[];
  errors: string[];
}

/**
 * Import questions from CSV text following /public/questions-template.csv.
 * Rows with problems are reported, valid rows are kept.
 */
export function importQuestionsCsv(text: string): CsvImportResult {
  const rows = parseCsv(text);
  const errors: string[] = [];
  if (rows.length < 2) {
    return { questions: [], errors: ["CSV has no data rows."] };
  }
  const header = rows[0].map((h) => h.trim());
  const idx = (name: (typeof HEADERS)[number]) => header.indexOf(name);
  if (idx("balloonNumber") === -1 || idx("question") === -1) {
    return {
      questions: [],
      errors: [
        `Header row must contain the columns: ${HEADERS.join(", ")} (see questions-template.csv).`,
      ],
    };
  }

  const questions: Question[] = [];
  const seenBalloons = new Set<number>();
  rows.slice(1).forEach((row, i) => {
    const line = i + 2;
    const get = (name: (typeof HEADERS)[number]) => {
      const j = idx(name);
      return j === -1 ? "" : (row[j] ?? "").trim();
    };
    const balloonNumber = Number(get("balloonNumber"));
    if (!Number.isInteger(balloonNumber) || balloonNumber < 1 || balloonNumber > 50) {
      errors.push(`Line ${line}: balloonNumber must be 1–50.`);
      return;
    }
    if (seenBalloons.has(balloonNumber)) {
      errors.push(`Line ${line}: duplicate balloonNumber ${balloonNumber}.`);
      return;
    }
    const options = [get("optionA"), get("optionB"), get("optionC"), get("optionD")]
      .filter((o) => o !== "");
    if (options.length < 3) {
      errors.push(`Line ${line}: at least three options (A–C) are required.`);
      return;
    }
    const correctRaw = get("correctOption").toUpperCase();
    const correctAnswerIndex = ["A", "B", "C", "D"].indexOf(correctRaw);
    if (correctAnswerIndex === -1 || correctAnswerIndex >= options.length) {
      errors.push(`Line ${line}: correctOption must be A, B, C or D and match an existing option.`);
      return;
    }
    const question = get("question");
    if (!question) {
      errors.push(`Line ${line}: question text is required.`);
      return;
    }
    const difficultyRaw = get("difficulty") || "Medium";
    const difficulty: Difficulty = ["Easy", "Medium", "Hard"].includes(difficultyRaw)
      ? (difficultyRaw as Difficulty)
      : "Medium";
    const timeLimitRaw = get("timeLimit");
    const timeLimit = timeLimitRaw ? Number(timeLimitRaw) : null;

    seenBalloons.add(balloonNumber);
    questions.push({
      id: balloonNumber,
      balloonNumber,
      category: get("category") || "General Safety",
      difficulty,
      question,
      options,
      correctAnswerIndex,
      explanation: get("explanation"),
      image: get("image") || null,
      timeLimit: timeLimit && Number.isFinite(timeLimit) ? timeLimit : null,
    });
  });

  if (questions.length < 50) {
    errors.push(
      `Only ${questions.length} valid questions imported — the wall has 50 balloons. Balloons without a question show a friendly notice and can be skipped by the admin.`,
    );
  }
  questions.sort((a, b) => a.balloonNumber - b.balloonNumber);
  return { questions, errors };
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportResultsCsv(
  outcomes: {
    balloonNumber: number;
    category: string;
    correct: boolean;
    method: string;
    answeredAt: number;
  }[],
): string {
  const lines = ["balloonNumber,category,result,method,answeredAt"];
  outcomes.forEach((o) => {
    lines.push(
      [
        String(o.balloonNumber),
        csvEscape(o.category),
        o.correct ? "correct" : "incorrect",
        o.method,
        new Date(o.answeredAt).toISOString(),
      ].join(","),
    );
  });
  return lines.join("\n");
}

export function downloadFile(
  filename: string,
  content: string,
  mime = "text/csv",
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
