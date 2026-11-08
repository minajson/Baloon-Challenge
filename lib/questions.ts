import { CATEGORIES, CHALLENGES, featurePoints } from "@/data/challenges";
import type {
  CategoryStat,
  Challenge,
  GameState,
  OddChallenge,
} from "./types";

/** The playable pool: all 80 NAPE challenges, in balloon order. */
export function activeChallenges(): Challenge[] {
  return CHALLENGES;
}

/**
 * The challenge assigned to a balloon in this session. Balloon n always opens
 * challenge n (fixed assignment), recorded in GameState so a refresh restores
 * it and a challenge can never be served twice in one session.
 */
export function assignedChallenge(
  challenges: Challenge[],
  state: GameState,
  balloonNumber: number,
): Challenge | undefined {
  const id = state.assignments[String(balloonNumber)];
  return id ? challenges.find((c) => c.id === id) : undefined;
}

export function challengeForBalloon(
  challenges: Challenge[],
  state: GameState,
  balloonNumber: number,
): Challenge | undefined {
  const existing = assignedChallenge(challenges, state, balloonNumber);
  if (existing) return existing;
  const used = new Set(Object.values(state.assignments));
  return challenges.find((c) => c.balloon === balloonNumber && !used.has(c.id));
}

/** The next unopened balloon after `from` within the same game, if any. */
export function nextUnopenedInCategory(
  challenges: Challenge[],
  state: GameState,
  from: number,
): Challenge | undefined {
  const current = challenges.find((c) => c.balloon === from);
  if (!current) return undefined;
  const popped = new Set(state.poppedBalloons);
  const inType = challenges.filter((c) => c.type === current.type);
  const after = inType.filter((c) => c.balloon > from && !popped.has(c.balloon));
  if (after.length > 0) return after[0];
  return inType.find((c) => !popped.has(c.balloon));
}

/** Base points for a correct attempt (bonus is awarded separately). */
export function basePoints(
  challenge: Challenge,
  cluesRevealed: number,
): number {
  return challenge.type === "feature" ? featurePoints(cluesRevealed) : 1;
}

export const BONUS_POINTS = 1;

export function supportsBonus(challenge: Challenge): challenge is OddChallenge {
  return challenge.type === "odd";
}

export function categoryStats(state: GameState): CategoryStat[] {
  return CATEGORIES.map((cat) => {
    const rows = state.outcomes.filter((o) => o.category === cat.name);
    const correct = rows.filter((o) => o.correct).length;
    return {
      category: cat.name,
      correct,
      total: rows.length,
      accuracy: rows.length === 0 ? 0 : Math.round((correct / rows.length) * 100),
      points: rows.reduce((sum, o) => sum + o.points, 0),
    };
  }).filter((s) => s.total > 0).sort((a, b) => b.accuracy - a.accuracy);
}

export function accuracyPercent(state: GameState): number {
  const answered = state.correctCount + state.incorrectCount;
  if (answered === 0) return 0;
  return Math.round((state.correctCount / answered) * 100);
}
