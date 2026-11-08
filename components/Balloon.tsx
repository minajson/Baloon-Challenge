"use client";

import { memo, useMemo, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { CATEGORIES } from "@/data/challenges";

export interface BalloonColor {
  base: string;
  dark: string;
  light: string;
}

export const BALLOON_COLORS: BalloonColor[] = CATEGORIES.flatMap(
  (c) => c.colors,
);


function BurstParticles({ color }: { color: BalloonColor }) {
  // Deterministic pseudo-random spread (pure during render).
  const pieces = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        angle: (i / 10) * Math.PI * 2 + ((i * 37) % 10) / 24,
        dist: 34 + ((i * 53) % 31),
        size: 5 + ((i * 29) % 8),
        color: [color.base, color.dark, color.light, "#ffffff"][i % 4],
      })),
    [color],
  );
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.dist,
            y: Math.sin(p.angle) * p.dist,
            opacity: 0,
            scale: 0.3,
          }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

function BalloonSvg({
  color,
  number,
  label,
}: {
  color: BalloonColor;
  number: number;
  label: number;
}) {
  const gradId = `bg-${number}`;
  return (
    <svg viewBox="0 0 100 130" className="h-full w-full drop-shadow-lg">
      <defs>
        <radialGradient id={gradId} cx="0.35" cy="0.3" r="0.9">
          <stop offset="0%" stopColor={color.light} />
          <stop offset="55%" stopColor={color.base} />
          <stop offset="100%" stopColor={color.dark} />
        </radialGradient>
      </defs>
      {/* string */}
      <path
        d="M50 108 q6 8 -2 14 q-6 6 2 8"
        fill="none"
        stroke={color.dark}
        strokeWidth="1.6"
        opacity="0.7"
      />
      {/* body */}
      <ellipse cx="50" cy="52" rx="40" ry="48" fill={`url(#${gradId})`} />
      {/* knot */}
      <path d="M44 99 L50 108 L56 99 Z" fill={color.dark} />
      {/* shine */}
      <ellipse
        cx="34"
        cy="30"
        rx="11"
        ry="16"
        fill="white"
        opacity="0.35"
        transform="rotate(-18 34 30)"
      />
      <text
        x="50"
        y="60"
        textAnchor="middle"
        fontSize="34"
        fontWeight="900"
        fill="white"
        stroke={color.dark}
        strokeWidth="1.2"
        paintOrder="stroke"
        style={{ fontFamily: "inherit" }}
      >
        {label}
      </text>
    </svg>
  );
}

export type BalloonResult = "correct" | "wrong" | "open";

interface BalloonProps {
  /** Global balloon number (1–80). */
  number: number;
  /** Number printed on the balloon (position within its game, 1–20). */
  label: number;
  /** Glossy palette for this balloon's game. */
  palette: BalloonColor[];
  /** Outcome of a completed balloon, shown on its deflated remnant. */
  result?: BalloonResult;
  popped: boolean;
  disabled: boolean;
  onPop: (number: number) => void;
  index: number;
}

function BalloonImpl({
  number,
  label,
  palette,
  result,
  popped,
  disabled,
  onPop,
  index,
}: BalloonProps) {
  const reduced = useReducedMotion();
  const [bursting, setBursting] = useState(false);
  const [shaking, setShaking] = useState(false);
  const color = palette[label % palette.length];

  // Selected balloon: expand slightly, shake briefly, then burst.
  const handlePop = () => {
    if (popped || disabled || bursting || shaking) return;
    if (reduced) {
      setBursting(true);
      onPop(number);
      return;
    }
    setShaking(true);
    window.setTimeout(() => {
      setShaking(false);
      setBursting(true);
      onPop(number);
    }, 300);
  };

  if (popped && !bursting) {
    // Completed balloon: a deflated remnant, clearly different from an
    // unopened balloon, stamped with the facilitator's verdict.
    const badge =
      result === "correct"
        ? { text: "✓", cls: "bg-ok text-white", name: "completed — correct" }
        : result === "wrong"
          ? { text: "✕", cls: "bg-sun text-ink", name: "completed — not quite" }
          : { text: "•", cls: "bg-ink-soft text-ink", name: "already opened" };
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-ink/15 bg-white/55"
        aria-label={`Balloon ${label} ${badge.name}`}
      >
        <svg viewBox="0 0 40 40" className="h-[34%] w-[34%] opacity-60">
          <path
            d="M20 6 q8 6 2 12 q-8 6 -4 12 q2 4 -2 6"
            fill="none"
            stroke={color.dark}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="20" cy="6" r="4" fill={color.base} />
        </svg>
        <span className="rounded-full bg-white px-2.5 text-sm font-black text-ink/60 lg:text-base">
          {label}
        </span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-base font-black shadow lg:h-9 lg:w-9 lg:text-xl ${badge.cls}`}
          aria-hidden="true"
        >
          {badge.text}
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <AnimatePresence onExitComplete={() => setBursting(false)}>
        {!popped && (
          <motion.button
            type="button"
            onClick={handlePop}
            disabled={disabled}
            aria-label={`Balloon number ${label}`}
            className="h-full w-full cursor-pointer disabled:cursor-not-allowed"
            style={{
              animation: reduced
                ? undefined
                : `balloon-float ${3.2 + (index % 5) * 0.45}s ease-in-out ${(index % 7) * 0.35}s infinite`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0, transition: { duration: 0.16 } }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 18,
              delay: reduced ? 0 : Math.min(index * 0.018, 0.9),
            }}
            whileHover={reduced ? undefined : { scale: 1.09, rotate: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <motion.div
              className="h-full w-full"
              animate={
                shaking
                  ? {
                      scale: [1, 1.12, 1.1, 1.14, 1.12],
                      rotate: [0, -7, 7, -7, 5],
                      transition: { duration: 0.3, ease: "easeInOut" },
                    }
                  : { scale: 1, rotate: 0 }
              }
            >
              <BalloonSvg color={color} number={number} label={label} />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
      {bursting && <BurstParticles color={color} />}
    </div>
  );
}

const Balloon = memo(BalloonImpl);
export default Balloon;
