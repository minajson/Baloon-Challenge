export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Question {
  id: number;
  balloonNumber: number;
  category: string;
  difficulty: Difficulty;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  image: string | null;
  /** Per-question override in seconds; null uses the global timer setting. */
  timeLimit: number | null;
}

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
  secondAttemptMode: boolean;
  startingAvatar: AvatarGender;
  adminPin: string;
}

export type GamePhase = "idle" | "running" | "paused";

export interface BalloonOutcome {
  balloonNumber: number;
  questionId: number;
  category: string;
  correct: boolean;
  /** "answered" | "timeout" | "admin-correct" | "admin-wrong" | "skipped" */
  method: string;
  answeredAt: number;
}

export interface GameState {
  phase: GamePhase;
  poppedBalloons: number[];
  outcomes: BalloonOutcome[];
  correctCount: number;
  incorrectCount: number;
  nextAvatar: AvatarGender;
  startedAt: number | null;
}

export type Screen = "opening" | "wall" | "question" | "results";

export interface CategoryStat {
  category: string;
  correct: number;
  total: number;
  accuracy: number;
}
