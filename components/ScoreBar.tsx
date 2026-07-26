"use client";

import type { GameSettings, GameState } from "@/lib/types";
import { accuracyPercent } from "@/lib/questions";
import SoundControl from "./SoundControl";

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "red" | "navy" | "orange";
}) {
  const tones: Record<string, string> = {
    green: "bg-safety-green-soft text-safety-green",
    red: "bg-alert-red-soft text-alert-red",
    navy: "bg-ren-navy-soft text-ren-navy",
    orange: "bg-ren-orange-soft text-ren-orange-deep",
  };
  return (
    <div
      className={`flex items-baseline gap-2 rounded-xl px-3 py-1.5 ${tones[tone]}`}
    >
      <span
        className="font-black tabular-nums"
        style={{ fontSize: "clamp(16px, 1.2vw, 26px)" }}
      >
        {value}
      </span>
      <span
        className="font-bold uppercase tracking-wide opacity-80"
        style={{ fontSize: "clamp(10px, 0.7vw, 14px)" }}
      >
        {label}
      </span>
    </div>
  );
}

export default function ScoreBar({
  state,
  totalBalloons,
  settings,
  onSettingsChange,
  onAdminClick,
  paused,
}: {
  state: GameState;
  totalBalloons: number;
  settings: GameSettings;
  onSettingsChange: (patch: Partial<GameSettings>) => void;
  onAdminClick: () => void;
  paused: boolean;
}) {
  const remaining = totalBalloons - state.poppedBalloons.length;
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-1.5 lg:px-8">
      <div className="flex items-center gap-3">
        <span
          className="hidden font-semibold uppercase tracking-widest text-safety-green md:block"
          style={{ fontSize: "clamp(11px, 0.8vw, 15px)" }}
        >
          Pick a balloon. Answer the question.
        </span>
        {paused && (
          <span className="rounded-full bg-warm-yellow px-3 py-1 text-sm font-black text-ren-navy">
            PAUSED
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 lg:gap-3">
        <Stat label="Correct" value={String(state.correctCount)} tone="green" />
        <Stat
          label="Incorrect"
          value={String(state.incorrectCount)}
          tone="red"
        />
        <Stat label="Remaining" value={String(remaining)} tone="navy" />
        <Stat
          label="Accuracy"
          value={`${accuracyPercent(state)}%`}
          tone="orange"
        />
        <SoundControl settings={settings} onChange={onSettingsChange} />
        <button
          type="button"
          onClick={onAdminClick}
          aria-label="Admin settings"
          className="rounded-xl bg-white p-2.5 text-ren-navy shadow-panel transition hover:scale-105 hover:text-ren-orange"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
