"use client";

import { useState } from "react";
import type { GameSettings } from "@/lib/types";

/**
 * Compact audio controls for the top-right: music on/off, sound-effects
 * on/off and a music volume slider. Settings persist via the parent.
 */
export default function SoundControl({
  settings,
  onChange,
}: {
  settings: GameSettings;
  onChange: (patch: Partial<GameSettings>) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Sound controls"
        aria-expanded={open}
        className="rounded-xl bg-white p-2.5 text-ink shadow-panel transition hover:scale-105 hover:text-terra"
      >
        {settings.soundEnabled ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl bg-white p-4 shadow-panel"
          role="menu"
        >
          <Row
            label="Sound effects"
            checked={settings.soundEnabled}
            onChange={(v) => onChange({ soundEnabled: v })}
          />
          <Row
            label="Background music"
            checked={settings.musicEnabled}
            onChange={(v) => onChange({ musicEnabled: v })}
          />
          <label className="mt-3 block text-sm font-bold text-ink">
            Music volume
            <input
              type="range"
              min={0}
              max={40}
              value={Math.round(settings.musicVolume * 100)}
              onChange={(e) =>
                onChange({ musicVolume: Number(e.target.value) / 100 })
              }
              className="mt-1 w-full accent-ok"
              aria-label="Music volume"
            />
          </label>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5 font-bold text-ink">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-ok" : "bg-ink/25"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </label>
  );
}
