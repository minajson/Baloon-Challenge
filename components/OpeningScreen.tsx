"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import HowToPlay from "./HowToPlay";
import { sound } from "@/lib/sound";
import { BALLOON_COLORS } from "./Balloon";

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
        className="relative z-10 flex flex-col items-center px-6 text-center"
      >
        <p className="text-2xl font-black tracking-[0.3em] text-safety-green lg:text-3xl">
          RENAISSANCE PEOPLE DAY
        </p>
        <h1 className="mt-3 text-5xl font-black leading-[0.95] tracking-tight text-ren-navy md:text-6xl lg:text-7xl xl:text-8xl">
          POP THE <span className="text-ren-orange">BALLOON</span>
          <br />
          CHALLENGE
        </h1>
        <p className="mt-5 max-w-2xl text-lg font-semibold text-ren-navy/80 lg:text-xl">
          Choose a balloon, answer the safety question and see whether you got
          it right.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:gap-4">
          {hasSavedGame && (
            <button
              type="button"
              onClick={onResume}
              className={`${buttonBase} bg-safety-green text-white hover:bg-safety-green/90`}
            >
              ▶ Resume Previous Game
            </button>
          )}
          <button
            type="button"
            onClick={onStart}
            className={`${buttonBase} bg-ren-orange text-white hover:bg-ren-orange-deep`}
          >
            {hasSavedGame ? "Start New Game" : "Start Game"}
          </button>
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className={`${buttonBase} bg-ren-navy text-white hover:bg-ren-navy-mid`}
          >
            How to Play
          </button>
          <button
            type="button"
            onClick={testSound}
            className={`${buttonBase} bg-white text-ren-navy`}
          >
            {soundTested ? "🔊 Sound OK" : "Sound Test"}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`${buttonBase} bg-white text-ren-navy`}
          >
            ⛶ Full Screen
          </button>
          <button
            type="button"
            onClick={onAdmin}
            aria-label="Admin settings"
            className={`${buttonBase} bg-white text-ren-navy`}
          >
            ⚙ Admin
          </button>
        </div>
      </motion.div>
      {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
    </div>
  );
}
