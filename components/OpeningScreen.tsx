"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import HowToPlay from "./HowToPlay";
import { sound } from "@/lib/sound";
import { BALLOON_COLORS } from "./Balloon";
import { CATEGORIES } from "@/data/challenges";
import Emblem from "./Emblem";

function FloatingBalloons() {
  const reduced = useReducedMotion();
  const balloons = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: (i * 7.3 + 3) % 96,
        delay: (i * 1.7) % 8,
        duration: 14 + (i % 5) * 3,
        size: 40 + (i % 4) * 22,
        color: BALLOON_COLORS[i % BALLOON_COLORS.length],
      })),
    [],
  );
  if (reduced) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {balloons.map((b, i) => (
        <motion.div
          key={i}
          initial={{ y: "110vh" }}
          animate={{ y: "-20vh" }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute opacity-30"
          style={{ left: `${b.left}%`, width: b.size, height: b.size * 1.3 }}
        >
          <svg viewBox="0 0 100 130" className="h-full w-full">
            <ellipse cx="50" cy="52" rx="40" ry="48" fill={b.color.base} />
            <path d="M44 99 L50 108 L56 99 Z" fill={b.color.dark} />
            <path
              d="M50 108 q6 8 -2 14 q-6 6 2 8"
              fill="none"
              stroke={b.color.dark}
              strokeWidth="1.6"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

export default function OpeningScreen({
  hasSavedGame,
  onStart,
  onResume,
  onAdmin,
}: {
  hasSavedGame: boolean;
  onStart: () => void;
  onResume: () => void;
  onAdmin: () => void;
}) {
  const [showHelp, setShowHelp] = useState(false);
  const [soundTested, setSoundTested] = useState(false);

  const testSound = () => {
    sound.preload();
    void sound.play("pop");
    window.setTimeout(() => void sound.play("correct"), 500);
    window.setTimeout(() => void sound.play("fanfare"), 1200);
    setSoundTested(true);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  };

  const buttonBase =
    "rounded-2xl px-6 py-3 text-lg font-black shadow-panel transition hover:scale-105 lg:px-8 lg:py-4 lg:text-xl";

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden">
      <FloatingBalloons />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="opening-content relative z-10 flex flex-col items-center text-center"
      >
        <Emblem className="mb-3 h-16 w-16 drop-shadow-lg lg:h-24 lg:w-24" />
        <h1 className="hero-title font-black tracking-tight text-ink">
          <span className="text-terra">NAPE 2026</span>
          <br />
          GEOSCIENCE GAMES
        </h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold text-ink/80 lg:text-2xl">
          Pop a balloon, take on the challenge, and see whether you can think
          like a geoscientist.
        </p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:gap-3">
          {CATEGORIES.map((c) => (
            <li
              key={c.id}
              className="rounded-full px-4 py-1.5 text-base font-black shadow-panel lg:text-xl"
              style={{ background: c.accentSoft, color: c.accent }}
            >
              {c.emoji} {c.name}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:gap-4">
          {hasSavedGame && (
            <button
              type="button"
              onClick={onResume}
              className={`${buttonBase} bg-ok text-white hover:bg-ok/90`}
            >
              ▶ Resume Previous Game
            </button>
          )}
          <button
            type="button"
            onClick={onStart}
            className={`${buttonBase} bg-terra text-white hover:bg-terra-deep`}
          >
            {hasSavedGame ? "Start New Game" : "Start Game"}
          </button>
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className={`${buttonBase} bg-ink text-white hover:bg-ink-mid`}
          >
            How to Play
          </button>
          <button
            type="button"
            onClick={testSound}
            className={`${buttonBase} bg-white text-ink`}
          >
            {soundTested ? "🔊 Sound OK" : "Sound Test"}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`${buttonBase} bg-white text-ink`}
          >
            ⛶ Full Screen
          </button>
          <button
            type="button"
            onClick={onAdmin}
            aria-label="Admin settings"
            className={`${buttonBase} bg-white text-ink`}
          >
            ⚙ Admin
          </button>
        </div>
      </motion.div>
      {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
    </div>
  );
}
