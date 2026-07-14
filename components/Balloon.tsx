"use client";

import { memo, useMemo, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";

export interface BalloonColor {
  base: string;
  dark: string;
  light: string;
}

export const BALLOON_COLORS: BalloonColor[] = [
  { base: "#f26522", dark: "#c94f15", light: "#ff9a66" }, // orange
  { base: "#1d4570", dark: "#0e2a4d", light: "#4a76a8" }, // navy
  { base: "#199a54", dark: "#0f7038", light: "#5cc98a" }, // green
  { base: "#ffc845", dark: "#e0a51e", light: "#ffe08a" }, // yellow
  { base: "#e8542f", dark: "#bb3c1c", light: "#ff8f6e" }, // coral
  { base: "#2f6fb0", dark: "#1d4c7e", light: "#6ea3d6" }, // sky blue
];

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

function BalloonSvg({ color, number }: { color: BalloonColor; number: number }) {
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
        {number}
      </text>
    </svg>
  );
}

interface BalloonProps {
  number: number;
  popped: boolean;
  disabled: boolean;
  onPop: (number: number) => void;
  index: number;
}

function BalloonImpl({ number, popped, disabled, onPop, index }: BalloonProps) {
  const reduced = useReducedMotion();
  const [bursting, setBursting] = useState(false);
  const [shaking, setShaking] = useState(false);
  const color = BALLOON_COLORS[number % BALLOON_COLORS.length];

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
    // Permanently popped: a small deflated remnant with the used number.
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center opacity-45"
        aria-label={`Balloon ${number} already used`}
      >
        <svg viewBox="0 0 40 40" className="h-1/3 w-1/3">
          <path
            d="M20 6 q8 6 2 12 q-8 6 -4 12 q2 4 -2 6"
            fill="none"
            stroke={color.dark}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="20" cy="6" r="4" fill={color.base} />
        </svg>
        <span className="rounded-full bg-white/70 px-2 text-sm font-bold text-ren-navy/60 lg:text-base">
          {number}
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
            aria-label={`Balloon number ${number}`}
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
              <BalloonSvg color={color} number={number} />
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
