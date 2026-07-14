"use client";

import { motion } from "framer-motion";

const STEPS = [
  { icon: "🎈", text: "Walk up and choose any available balloon on the wall." },
  { icon: "💥", text: "The balloon pops and reveals your safety question." },
  { icon: "🅰️", text: "Pick ONE answer — A, B, C or D. Big buttons, no pressure!" },
  {
    icon: "✅",
    text: "See instantly whether you got it right, with a quick explanation.",
  },
  {
    icon: "🧑🏾‍🏭",
    text: "Our Renaissance safety ambassadors will cheer you on either way.",
  },
  { icon: "👥", text: "Hand over to the next participant. One balloon per person!" },
];

export default function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ren-navy/60 p-6 backdrop-blur-sm"
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
          <h2 className="text-3xl font-black text-ren-navy">How to Play</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl bg-ren-navy-soft px-3 py-1.5 text-xl font-black text-ren-navy hover:bg-ren-orange hover:text-white"
          >
            ✕
          </button>
        </div>
        <ul className="mt-5 space-y-4">
          {STEPS.map((s, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="text-3xl">{s.icon}</span>
              <p className="text-lg font-semibold text-ren-navy/90 lg:text-xl">
                {s.text}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-6 rounded-2xl bg-safety-green-soft p-4 text-center text-lg font-black text-safety-green">
          No names, no sign-up — just pick a balloon and play!
        </p>
      </motion.div>
    </motion.div>
  );
}
