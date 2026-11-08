import { QUESTIONS as SEED_QUESTIONS } from "@/data/questions";
import type { Question } from "./types";

/**
 * Question-bank persistence layer.
 *
 * The bank lives in localStorage (the project's existing storage pattern —
 * the game is a fully client-side static export). The bundled 50 questions
 * in data/questions.ts are the defaults: they seed the bank on first load
 * and back the "Restore Defaults" action. All admin edits (add / edit /
 * delete / duplicate / reorder / import) persist here and survive refreshes
 * and offline use.
 */

const BANK_KEY = "balloonchallenge.questions.v2";
/** Pre-rebrand key (CSV imports from the old Admin Panel). Migrated once. */
const LEGACY_BANK_KEY = "runamsafe.questions.v1";

function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Normalise a partially-shaped record (seed or legacy) into a full Question. */
function normalize(raw: Record<string, unknown>, index: number): Question {
  const ts = nowIso();
  const idRaw = raw.id;
  const id =
    typeof idRaw === "string" && idRaw.trim() !== ""
      ? idRaw.trim()
      : `question-${pad3(typeof idRaw === "number" ? idRaw : index + 1)}`;
  const options = Array.isArray(raw.options)
    ? (raw.options as unknown[]).map(String).filter((o) => o.trim() !== "")
    : [];
  const correct = Number(raw.correctAnswerIndex);
  const balloonRaw = Number(raw.balloonNumber);
  const difficulty = ["Easy", "Medium", "Hard"].includes(String(raw.difficulty))
    ? (String(raw.difficulty) as Question["difficulty"])
    : "Medium";
  const timeLimit = Number(raw.timeLimit);
  return {
    id,
    order: Number.isFinite(Number(raw.order)) && Number(raw.order) > 0
      ? Number(raw.order)
      : index + 1,
    balloonNumber:
      Number.isInteger(balloonRaw) && balloonRaw >= 1 ? balloonRaw : null,
    category: String(raw.category ?? "General") || "General",
    difficulty,
    question: String(raw.question ?? ""),
    options,
    correctAnswerIndex:
      Number.isInteger(correct) && correct >= 0 && correct < options.length
        ? correct
        : 0,
    explanation: String(raw.explanation ?? ""),
    image: typeof raw.image === "string" && raw.image !== "" ? raw.image : null,
    imageAlt:
      typeof raw.imageAlt === "string" && raw.imageAlt !== ""
        ? raw.imageAlt
        : undefined,
    active: raw.active === undefined ? true : Boolean(raw.active),
    timeLimit: Number.isFinite(timeLimit) && timeLimit > 0 ? timeLimit : null,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : ts,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : ts,
  };
}

/** The bundled defaults, normalised into the full model. */
export function defaultQuestions(): Question[] {
  return SEED_QUESTIONS.map((q, i) =>
    normalize(q as unknown as Record<string, unknown>, i),
  );
}

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Load the full bank (active + inactive), sorted by display order. */
export function loadQuestionBank(): Question[] {
  if (typeof window === "undefined") return defaultQuestions();
  const stored = safeParse(localStorage.getItem(BANK_KEY));
  if (Array.isArray(stored) && stored.length > 0) {
    return sortByOrder(
      stored.map((q, i) => normalize(q as Record<string, unknown>, i)),
    );
  }
  // One-time migration of a legacy CSV import, if present.
  const legacy = safeParse(localStorage.getItem(LEGACY_BANK_KEY));
  if (Array.isArray(legacy) && legacy.length > 0) {
    const migrated = sortByOrder(
      legacy.map((q, i) => normalize(q as Record<string, unknown>, i)),
    );
    saveQuestionBank(migrated);
    localStorage.removeItem(LEGACY_BANK_KEY);
    return migrated;
  }
  return defaultQuestions();
}

export function saveQuestionBank(questions: Question[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BANK_KEY, JSON.stringify(questions));
}

/** Drop all admin edits and return to the bundled defaults. */
export function restoreDefaultQuestions(): Question[] {
  if (typeof window !== "undefined") {
    localStorage.removeItem(BANK_KEY);
    localStorage.removeItem(LEGACY_BANK_KEY);
  }
  return defaultQuestions();
}

export function sortByOrder(questions: Question[]): Question[] {
  return [...questions].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

/** Re-number `order` 1..n following the array's current sequence. */
export function renumber(questions: Question[]): Question[] {
  return questions.map((q, i) =>
    q.order === i + 1 ? q : { ...q, order: i + 1, updatedAt: nowIso() },
  );
}

export function nextQuestionId(existing: Question[]): string {
  const used = new Set(existing.map((q) => q.id));
  let n = existing.length + 1;
  while (used.has(`question-${pad3(n)}`)) n += 1;
  return `question-${pad3(n)}`;
}

export interface QuestionDraft {
  id?: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  category: string;
  difficulty: Question["difficulty"];
  image: string | null;
  imageAlt?: string;
  active: boolean;
  order: number;
  balloonNumber: number | null;
  timeLimit: number | null;
}

/** Validate a draft; returns human-readable errors (empty = valid). */
export function validateDraft(
  draft: QuestionDraft,
  existing: Question[],
  editingId?: string,
): string[] {
  const errors: string[] = [];
  if (!draft.question.trim()) errors.push("Question text is required.");
  const filled = draft.options.filter((o) => o.trim() !== "");
  if (filled.length < 2) errors.push("At least two answer options are required.");
  if (
    draft.correctAnswerIndex < 0 ||
    draft.correctAnswerIndex >= draft.options.length ||
    draft.options[draft.correctAnswerIndex]?.trim() === ""
  ) {
    errors.push("The correct answer must point to a non-empty option.");
  }
  // No gaps: every option before the last filled one must be non-empty.
  const lastFilled = draft.options.reduce(
    (acc, o, i) => (o.trim() !== "" ? i : acc),
    -1,
  );
  for (let i = 0; i < lastFilled; i++) {
    if (draft.options[i].trim() === "") {
      errors.push("Answer options must not have empty gaps.");
      break;
    }
  }
  if (draft.id) {
    const clash = existing.find((q) => q.id === draft.id && q.id !== editingId);
    if (clash) errors.push(`A question with id "${draft.id}" already exists.`);
  }
  if (
    draft.balloonNumber !== null &&
    (!Number.isInteger(draft.balloonNumber) || draft.balloonNumber < 1 || draft.balloonNumber > 50)
  ) {
    errors.push("Balloon number must be between 1 and 50.");
  }
  return errors;
}

/** Active-question balloon numbers that are claimed more than once. */
export function duplicateBalloonAssignments(questions: Question[]): number[] {
  const counts = new Map<number, number>();
  questions
    .filter((q) => q.active && q.balloonNumber !== null)
    .forEach((q) => {
      counts.set(q.balloonNumber!, (counts.get(q.balloonNumber!) ?? 0) + 1);
    });
  return [...counts.entries()].filter(([, c]) => c > 1).map(([n]) => n);
}
