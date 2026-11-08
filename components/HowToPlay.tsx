"use client";

import { motion } from "framer-motion";

const STEPS = [
  { icon: "🎈", text: "Pick a game tab, then choose any balloon on the board." },
  { icon: "💥", text: "The balloon pops and opens its challenge." },
  {
    icon: "🧩",
    text: "Picture Puzzles, Missing Letters, Odd One Out or Guess the Feature — four games, 80 challenges.",
  },
  {
    icon: "👁",
    text: "Take your guess. The facilitator reveals the answer and decides if you got it.",
  },
  {
    icon: "🔎",
    text: "In Guess the Feature, fewer clues means more points: 3, 2 or 1.",
  },
  { icon: "🎈", text: "Back to the board — the next player pops a new balloon!" },
];

export default function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/60 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="How to play"
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-panel lg:p-8"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-ink">How to Play</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl bg-ink-soft px-3 py-1.5 text-xl font-black text-ink hover:bg-terra hover:text-white"
          >
            ✕
          </button>
        </div>
        <ul className="mt-5 space-y-4">
          {STEPS.map((s, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="text-3xl">{s.icon}</span>
              <p className="text-lg font-semibold text-ink/90 lg:text-xl">
                {s.text}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-6 rounded-2xl bg-ok-soft p-4 text-center text-lg font-black text-ok">
          No names, no sign-up — just pop a balloon and play!
        </p>
      </motion.div>
    </motion.div>
  );
}
