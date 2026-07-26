export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Question {
  /** Stable string id, e.g. "question-001". */
  id: string;
  /** Display / play order in the question bank (1-based). */
  order: number;
  /** Fixed balloon assignment (1–50); null = no fixed balloon. */
  balloonNumber: number | null;
  category: string;
  difficulty: Difficulty;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  image: string | null;
  /** Accessible description for the optional image. */
  imageAlt?: string;
  /** Inactive questions are excluded from the playable pool. */
  active: boolean;
  /** Per-question override in seconds; null uses the global timer setting. */
  timeLimit: number | null;
  createdAt: string;
  updatedAt: string;
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

/** How questions are matched to popped balloons. */
export type QuestionMode = "fixed" | "sequential" | "random";

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
  questionMode: QuestionMode;
  /** 0 = play until every balloon is used. */
  questionsPerSession: number;
  /**
   * Reserved for a future re-enable of admin authentication. The PIN gate UI
   * has been removed on request — question management opens directly — but
   * the setting is kept so auth can be reinstated without a data migration.
   */
  adminPin: string;
}

export type GamePhase = "idle" | "running" | "paused";

export interface BalloonOutcome {
  balloonNumber: number;
  questionId: string;
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
  /**
   * Balloon number → question id for this session. Guarantees a question is
   * never served twice in one session, in every question mode.
   */
  assignments: Record<string, string>;
}

export type Screen = "opening" | "wall" | "question" | "results";

export interface CategoryStat {
  category: string;
  correct: number;
  total: number;
  accuracy: number;
}
