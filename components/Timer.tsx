"use client";

import { useEffect, useRef } from "react";
import { sound } from "@/lib/sound";

export default function Timer({
  secondsLeft,
  totalSeconds,
  running,
}: {
  secondsLeft: number;
  totalSeconds: number;
  running: boolean;
}) {
  const lastBeeped = useRef<number | null>(null);
  const critical = secondsLeft <= 5 && secondsLeft > 0;

  useEffect(() => {
    if (!running) return;
    if (critical && lastBeeped.current !== secondsLeft) {
      lastBeeped.current = secondsLeft;
      void sound.play("tick");
    }
  }, [secondsLeft, critical, running]);

  const r = 26;
  const circumference = 2 * Math.PI * r;
  const progress = totalSeconds === 0 ? 0 : secondsLeft / totalSeconds;

  return (
    <div
      className="relative h-16 w-16 lg:h-20 lg:w-20"
      style={critical ? { animation: "timer-pulse 0.9s ease-in-out infinite" } : undefined}
      role="timer"
      aria-label={`${secondsLeft} seconds remaining`}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="white"
          stroke="#e8eef6"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={critical ? "#d63b2f" : secondsLeft <= 10 ? "#f26522" : "#148a4a"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-xl font-black tabular-nums lg:text-2xl ${
          critical ? "text-bad" : "text-ink"
        }`}
      >
        {secondsLeft}
      </span>
    </div>
  );
}
