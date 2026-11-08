"use client";

import type { ReactNode } from "react";

type Tone = "green" | "red" | "ink" | "sun" | "terra" | "ghost";

const TONES: Record<Tone, string> = {
  green: "bg-ok text-white hover:bg-ok/90",
  red: "bg-bad text-white hover:bg-bad/90",
  ink: "bg-ink text-white hover:bg-ink-mid",
  sun: "bg-sun text-ink hover:bg-sun/85",
  terra: "bg-terra text-white hover:bg-terra-deep",
  ghost: "bg-white text-ink border-2 border-ink/15 hover:border-ink/40",
};

export function FacButton({
  tone,
  onClick,
  disabled,
  pressed,
  children,
}: {
  tone: Tone;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={`fac-btn rounded-xl font-black shadow-panel transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${TONES[tone]}`}
    >
      {children}
    </button>
  );
}

/**
 * The facilitator control strip, shown under every challenge. It contains
 * controls only — never an answer — so it is safe on the projected screen.
 */
export default function FacilitatorBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="fac-bar mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-ink-soft px-3 py-2 lg:gap-3 lg:px-4"
      role="toolbar"
      aria-label="Facilitator controls"
    >
      <span className="fac-label font-black uppercase tracking-widest text-ink/55">
        Facilitator
      </span>
      {children}
    </div>
  );
}
