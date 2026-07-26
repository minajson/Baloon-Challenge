import type { Difficulty, Question } from "./types";
import { nowIso } from "./questionStore";

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

export const QUESTION_CSV_HEADERS = [
  "id",
  "order",
  "balloonNumber",
  "question",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "correctAnswer",
  "explanation",
  "category",
  "difficulty",
  "active",
  "image",
] as const;

type CsvHeader = (typeof QUESTION_CSV_HEADERS)[number];

export interface CsvImportSummary {
  questions: Question[];
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Import questions from CSV into the existing bank.
 *
 * Rows with an id matching an existing question are updated only when
 * `updateExisting` is true, otherwise they are skipped. Invalid rows are
 * never imported silently — each problem is reported with its line number.
 */
export function importQuestionBankCsv(
  text: string,
  existing: Question[],
  updateExisting: boolean,
): CsvImportSummary {
  const rows = parseCsv(text);
  const errors: string[] = [];
  if (rows.length < 2) {
    return { questions: existing, imported: 0, updated: 0, skipped: 0, errors: ["CSV has no data rows."] };
  }
  const header = rows[0].map((h) => h.trim());
  const idx = (name: CsvHeader) => header.indexOf(name);
  const required: CsvHeader[] = ["question", "optionA", "optionB", "correctAnswer"];
  const missingHeaders = required.filter((h) => idx(h) === -1);
  if (missingHeaders.length > 0) {
    return {
      questions: existing,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [
        `Missing required column(s): ${missingHeaders.join(", ")}. Expected headers: ${QUESTION_CSV_HEADERS.join(", ")}.`,
      ],
    };
  }

  const bank = [...existing];
  const byId = new Map(bank.map((q) => [q.id, q] as const));
  const seenIds = new Set<string>();
  const seenBalloons = new Set<number>();
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let autoId = bank.length;

  rows.slice(1).forEach((row, i) => {
    const line = i + 2;
    const get = (name: CsvHeader) => {
      const j = idx(name);
      return j === -1 ? "" : (row[j] ?? "").trim();
    };

    const question = get("question");
    if (!question) {
      errors.push(`Line ${line}: question text is missing.`);
      return;
    }
    const options = [get("optionA"), get("optionB"), get("optionC"), get("optionD")]
      .filter((o) => o !== "");
    if (options.length < 2) {
      errors.push(`Line ${line}: at least two options (optionA, optionB) are required.`);
      return;
    }
    const correctRaw = get("correctAnswer").toUpperCase();
    let correctAnswerIndex = ["A", "B", "C", "D"].indexOf(correctRaw);
    if (correctAnswerIndex === -1 && /^[1-4]$/.test(correctRaw)) {
      correctAnswerIndex = Number(correctRaw) - 1;
    }
    if (correctAnswerIndex === -1 || correctAnswerIndex >= options.length) {
      errors.push(`Line ${line}: correctAnswer must be A–D (or 1–4) and match an existing option.`);
      return;
    }
    const activeRaw = get("active").toLowerCase();
    if (activeRaw && !["true", "false", "yes", "no", "1", "0"].includes(activeRaw)) {
      errors.push(`Line ${line}: active must be true/false.`);
      return;
    }
    const active = activeRaw === "" || ["true", "yes", "1"].includes(activeRaw);
    const difficultyRaw = get("difficulty") || "Medium";
    if (!["Easy", "Medium", "Hard"].includes(difficultyRaw)) {
      errors.push(`Line ${line}: difficulty must be Easy, Medium or Hard.`);
      return;
    }
    const difficulty = difficultyRaw as Difficulty;
    const balloonRaw = get("balloonNumber");
    let balloonNumber: number | null = null;
    if (balloonRaw !== "") {
      const n = Number(balloonRaw);
      if (!Number.isInteger(n) || n < 1 || n > 50) {
        errors.push(`Line ${line}: balloonNumber must be 1–50 (or empty).`);
        return;
      }
      balloonNumber = n;
      if (active && seenBalloons.has(n)) {
        errors.push(`Line ${line}: duplicate balloonNumber ${n} within the file.`);
        return;
      }
      if (active) seenBalloons.add(n);
    }

    let id = get("id");
    if (id && seenIds.has(id)) {
      errors.push(`Line ${line}: duplicate id "${id}" within the file.`);
      return;
    }
    const orderRaw = Number(get("order"));

    if (id && byId.has(id)) {
      if (!updateExisting) {
        skipped += 1;
        return;
      }
      const prev = byId.get(id)!;
      const next: Question = {
        ...prev,
        order: Number.isFinite(orderRaw) && orderRaw > 0 ? orderRaw : prev.order,
        balloonNumber,
        question,
        options,
        correctAnswerIndex,
        explanation: get("explanation"),
        category: get("category") || prev.category,
        difficulty,
        image: get("image") || null,
        active,
        updatedAt: nowIso(),
      };
      byId.set(id, next);
      const at = bank.findIndex((q) => q.id === id);
      bank[at] = next;
      seenIds.add(id);
      updated += 1;
      return;
    }

    if (!id) {
      do {
        autoId += 1;
        id = `question-${String(autoId).padStart(3, "0")}`;
      } while (byId.has(id) || seenIds.has(id));
    }
    const ts = nowIso();
    const created: Question = {
      id,
      order: Number.isFinite(orderRaw) && orderRaw > 0 ? orderRaw : bank.length + 1,
      balloonNumber,
      question,
      options,
      correctAnswerIndex,
      explanation: get("explanation"),
      category: get("category") || "General",
      difficulty,
      image: get("image") || null,
      active,
      timeLimit: null,
      createdAt: ts,
      updatedAt: ts,
    };
    bank.push(created);
    byId.set(id, created);
    seenIds.add(id);
    imported += 1;
  });

  bank.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  return { questions: bank, imported, updated, skipped, errors };
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Export the full question bank in the import-compatible template format. */
export function exportQuestionBankCsv(questions: Question[]): string {
  const lines = [QUESTION_CSV_HEADERS.join(",")];
  [...questions]
    .sort((a, b) => a.order - b.order)
    .forEach((q) => {
      lines.push(
        [
          q.id,
          String(q.order),
          q.balloonNumber === null ? "" : String(q.balloonNumber),
          csvEscape(q.question),
          csvEscape(q.options[0] ?? ""),
          csvEscape(q.options[1] ?? ""),
          csvEscape(q.options[2] ?? ""),
          csvEscape(q.options[3] ?? ""),
          ["A", "B", "C", "D"][q.correctAnswerIndex] ?? "A",
          csvEscape(q.explanation),
          csvEscape(q.category),
          q.difficulty,
          q.active ? "true" : "false",
          q.image ?? "",
        ].join(","),
      );
    });
  return lines.join("\n");
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
