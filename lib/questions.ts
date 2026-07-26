import { loadQuestionBank, sortByOrder } from "./questionStore";
import type {
  CategoryStat,
  GameState,
  Question,
  QuestionMode,
} from "./types";

/** The playable pool: active questions from the managed bank, in order. */
export function activeQuestions(): Question[] {
  return sortByOrder(loadQuestionBank().filter((q) => q.active));
}

/**
 * Resolve the question already assigned to a balloon in this session.
 * Assignments are recorded in GameState so a refresh restores them and a
 * question can never be served twice in one session.
 */
export function assignedQuestion(
  questions: Question[],
  state: GameState,
  balloonNumber: number,
): Question | undefined {
  const id = state.assignments[String(balloonNumber)];
  return id ? questions.find((q) => q.id === id) : undefined;
}

/**
 * Pick the question for a freshly popped balloon according to the question
 * mode. Returns undefined when no unused question is available.
 *
 * - fixed:      the question whose balloonNumber matches the balloon.
 * - sequential: the next unused question by display order.
 * - random:     a random unused question.
 */
export function pickQuestionForBalloon(
  questions: Question[],
  state: GameState,
  mode: QuestionMode,
  balloonNumber: number,
): Question | undefined {
  const existing = assignedQuestion(questions, state, balloonNumber);
  if (existing) return existing;
  const usedIds = new Set(Object.values(state.assignments));
  const unused = questions.filter((q) => !usedIds.has(q.id));
  if (mode === "fixed") {
    return unused.find((q) => q.balloonNumber === balloonNumber);
  }
  if (mode === "sequential") {
    return unused[0];
  }
  if (unused.length === 0) return undefined;
  return unused[Math.floor(Math.random() * unused.length)];
}

export function categoryStats(
  questions: Question[],
  state: GameState,
): CategoryStat[] {
  const byCategory = new Map<string, { correct: number; total: number }>();
  state.outcomes.forEach((o) => {
    const entry = byCategory.get(o.category) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (o.correct) entry.correct += 1;
    byCategory.set(o.category, entry);
  });
  return [...byCategory.entries()]
    .map(([category, { correct, total }]) => ({
      category,
      correct,
      total,
      accuracy: total === 0 ? 0 : Math.round((correct / total) * 100),
    }))
    .sort((a, b) => b.accuracy - a.accuracy);
}

export function accuracyPercent(state: GameState): number {
  const answered = state.correctCount + state.incorrectCount;
  if (answered === 0) return 0;
  return Math.round((state.correctCount / answered) * 100);
}
