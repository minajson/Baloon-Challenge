import type { GameSettings, GameState, Question } from "./types";

const STATE_KEY = "runamsafe.state.v1";
const SETTINGS_KEY = "runamsafe.settings.v1";
const QUESTIONS_KEY = "runamsafe.questions.v1";

export const DEFAULT_SETTINGS: GameSettings = {
  timerEnabled: true,
  timerDuration: 30,
  soundEnabled: true,
  avatarVideosEnabled: true,
  musicEnabled: true,
  musicVolume: 0.12,
  confettiEnabled: true,
  secondAttemptMode: false,
  startingAvatar: "male",
  adminPin: "1234",
};

export function initialGameState(startingAvatar: "male" | "female"): GameState {
  return {
    phase: "idle",
    poppedBalloons: [],
    outcomes: [],
    correctCount: 0,
    incorrectCount: 0,
    nextAvatar: startingAvatar,
    startedAt: null,
  };
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadState(): GameState | null {
  if (typeof window === "undefined") return null;
  const state = safeParse<GameState>(localStorage.getItem(STATE_KEY));
  if (!state || !Array.isArray(state.poppedBalloons)) return null;
  return state;
}

export function saveState(state: GameState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STATE_KEY);
}

export function loadSettings(): GameSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const stored = safeParse<Partial<GameSettings>>(
    localStorage.getItem(SETTINGS_KEY),
  );
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings: GameSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/** Custom question set imported via CSV from the Admin Panel, if any. */
export function loadCustomQuestions(): Question[] | null {
  if (typeof window === "undefined") return null;
  const list = safeParse<Question[]>(localStorage.getItem(QUESTIONS_KEY));
  if (!list || !Array.isArray(list) || list.length === 0) return null;
  return list;
}

export function saveCustomQuestions(questions: Question[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
}

export function clearCustomQuestions(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(QUESTIONS_KEY);
}
