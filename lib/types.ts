export type Level = "Easy" | "Medium" | "Hard";

export type ChallengeType = "picture" | "letters" | "odd" | "feature";

interface ChallengeBase {
  /** Stable id, e.g. "pp-01", "ml-07", "oo-20", "gf-13". */
  id: string;
  /** Global balloon number (1–80). Balloon n always opens challenge n. */
  balloon: number;
  /** Item number within its game, exactly as numbered in the source document. */
  n: number;
  category: string;
  /** Difficulty from the source document; Game 4 has none. */
  level: Level | null;
  /** The authoritative correct answer. Never rendered before Reveal Answer. */
  answer: string;
}

export interface PictureChallenge extends ChallengeBase {
  type: "picture";
  panelA: string;
  panelB: string;
}

export interface LettersChallenge extends ChallengeBase {
  type: "letters";
  /** Original pattern, e.g. "F _ S S _ L" (letters and "_" separated by spaces). */
  pattern: string;
  hint: string;
}

export interface OddChallenge extends ChallengeBase {
  type: "odd";
  options: string[];
  /** The original explanation of why the answer doesn't belong. */
  why: string;
}

export interface FeatureChallenge extends ChallengeBase {
  type: "feature";
  /** Clue 1 (hard, 3 pts), Clue 2 (medium, 2 pts), Clue 3 (easy, 1 pt). */
  clues: [string, string, string];
  photoBrief: string;
  /** Public path to the photograph. */
  photo: string;
}

export type Challenge =
  | PictureChallenge
  | LettersChallenge
  | OddChallenge
  | FeatureChallenge;

export type AvatarGender = "male" | "female";
export type ResponseType = "correct" | "wrong" | "final";

export interface AvatarClip {
  gender: AvatarGender;
  responseType: ResponseType;
  /** Preferred transparent WebM, if generated. */
  file: string | null;
  /** MP4 fallback. */
  fallbackFile: string | null;
  /** Standalone recorded audio (tier-3 fallback with the master image). */
  audioFile: string | null;
  dialogue: string;
  durationSec: number | null;
  hasTransparency: boolean;
}

export interface GameSettings {
  timerEnabled: boolean;
  timerDuration: number;
  soundEnabled: boolean;
  avatarVideosEnabled: boolean;
  musicEnabled: boolean;
  musicVolume: number;
  confettiEnabled: boolean;
  startingAvatar: AvatarGender;
}

export type GamePhase = "idle" | "running" | "paused";

export interface BalloonOutcome {
  balloonNumber: number;
  /** Challenge id. */
  questionId: string;
  category: string;
  correct: boolean;
  /** Points scored for this challenge (base points + bonus). */
  points: number;
  /** Facilitator-awarded bonus point (Odd One Out only). */
  bonus: boolean;
  /** "admin-correct" | "admin-wrong" */
  method: string;
  answeredAt: number;
}

export interface GameState {
  phase: GamePhase;
  poppedBalloons: number[];
  outcomes: BalloonOutcome[];
  correctCount: number;
  incorrectCount: number;
  /** Total event points (challenge points + bonus points). */
  points: number;
  nextAvatar: AvatarGender;
  startedAt: number | null;
  /** True once the facilitator ended the game early from the admin panel. */
  finished: boolean;
  /** Balloon number → challenge id for this session. */
  assignments: Record<string, string>;
}

export type Screen = "opening" | "wall" | "question" | "results";

export interface CategoryStat {
  category: string;
  correct: number;
  total: number;
  accuracy: number;
  points: number;
}
