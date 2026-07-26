import type { GameSettings, GameState } from "./types";

const STATE_KEY = "balloonchallenge.state.v2";
const SETTINGS_KEY = "balloonchallenge.settings.v2";
// Pre-rebrand keys — read once and migrated forward so a saved game survives.
const LEGACY_STATE_KEY = "runamsafe.state.v1";
const LEGACY_SETTINGS_KEY = "runamsafe.settings.v1";

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
  questionMode: "fixed",
  questionsPerSession: 0,
  adminPin: "",
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
    assignments: {},
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
  const state =
    safeParse<GameState>(localStorage.getItem(STATE_KEY)) ??
    safeParse<GameState>(localStorage.getItem(LEGACY_STATE_KEY));
  if (!state || !Array.isArray(state.poppedBalloons)) return null;
  // Older saves predate session assignments and string question ids.
  if (!state.assignments || typeof state.assignments !== "object") {
    state.assignments = {};
  }
  state.outcomes = (state.outcomes ?? []).map((o) => ({
    ...o,
    questionId: String(o.questionId),
  }));
  return state;
}

export function saveState(state: GameState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STATE_KEY);
  localStorage.removeItem(LEGACY_STATE_KEY);
}

export function loadSettings(): GameSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const stored =
    safeParse<Partial<GameSettings>>(localStorage.getItem(SETTINGS_KEY)) ??
    safeParse<Partial<GameSettings>>(localStorage.getItem(LEGACY_SETTINGS_KEY));
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings: GameSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  localStorage.removeItem(LEGACY_SETTINGS_KEY);
}
