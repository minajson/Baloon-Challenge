import { QUESTIONS } from "@/data/questions";
import { loadCustomQuestions } from "./storage";
import type { CategoryStat, GameState, Question } from "./types";

/** The active question set: CSV-imported custom set if present, else bundled. */
export function activeQuestions(): Question[] {
  return loadCustomQuestions() ?? QUESTIONS;
}

export function questionForBalloon(
  questions: Question[],
  balloonNumber: number,
): Question | undefined {
  return questions.find((q) => q.balloonNumber === balloonNumber);
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
