import type { GameSettings, GameState } from "./types";

const STATE_KEY = "napegames2026.state.v1";
const SETTINGS_KEY = "napegames2026.settings.v1";

export const DEFAULT_SETTINGS: GameSettings = {
  timerEnabled: true,
  timerDuration: 45,
  soundEnabled: true,
  avatarVideosEnabled: true,
  musicEnabled: true,
  musicVolume: 0.12,
  confettiEnabled: true,
  startingAvatar: "male",
};

export function initialGameState(startingAvatar: "male" | "female"): GameState {
  return {
    phase: "idle",
    poppedBalloons: [],
    outcomes: [],
    correctCount: 0,
    incorrectCount: 0,
    points: 0,
    nextAvatar: startingAvatar,
    startedAt: null,
    finished: false,
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
  const state = safeParse<GameState>(localStorage.getItem(STATE_KEY));
  if (!state || !Array.isArray(state.poppedBalloons)) return null;
  return {
    ...initialGameState("male"),
    ...state,
    assignments: state.assignments ?? {},
    outcomes: state.outcomes ?? [],
  };
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
