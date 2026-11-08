"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { OddChallenge } from "@/lib/types";
import { OPTION_EMOJI } from "@/data/challenges";
import { sound } from "@/lib/sound";

const CARD_TONES = [
  { bg: "#fdeee4", edge: "#e2571f" },
  { bg: "#e0f5f3", edge: "#0c7f78" },
  { bg: "#ece7fb", edge: "#5b3bc4" },
  { bg: "#fdf3d8", edge: "#a8700a" },
];
const LETTERS = ["A", "B", "C", "D"];

/**
 * Game 3 — four large selectable cards. The player picks the odd one out;
 * the facilitator reveals the correct card (stage 1) and then the original
 * explanation (stage 2). Selecting the right card never awards anything by
 * itself — scoring and the bonus point are facilitator-controlled.
 */
export default function OddOneOut({
  challenge,
  selected,
  onSelect,
  stage,
}: {
  challenge: OddChallenge;
  selected: number | null;
  onSelect: (index: number) => void;
  stage: number;
}) {
  const revealed = stage >= 1;

  // Keys 1–4 select a card (laptop).
  useEffect(() => {
    if (revealed) return;
    const onKey = (e: KeyboardEvent) => {
      const i = ["1", "2", "3", "4"].indexOf(e.key);
      if (i !== -1 && i < challenge.options.length) onSelect(i);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, challenge.options.length, onSelect]);

  return (
    <div className="stage-cq flex min-h-full w-full items-center">
      <div className="odd-grid w-full" role="radiogroup" aria-label="Which one is the odd one out?">
        {challenge.options.map((opt, i) => {
          const tone = CARD_TONES[i % CARD_TONES.length];
          const isOdd = opt === challenge.answer;
          const isSelected = selected === i;
          let state: "idle" | "selected" | "odd" | "wrong" | "dim" = "idle";
          if (revealed) {
            if (isOdd) state = "odd";
            else if (isSelected) state = "wrong";
            else state = "dim";
          } else if (isSelected) state = "selected";

          return (
            <motion.button
              key={opt}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={revealed}
              onClick={() => {
                void sound.play("click");
                onSelect(i);
              }}
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{
                opacity: state === "dim" ? 0.45 : 1,
                y: 0,
                scale: state === "odd" ? 1.04 : isSelected ? 1.03 : 1,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: i * 0.06 }}
              whileHover={revealed ? undefined : { y: -6 }}
              whileTap={revealed ? undefined : { scale: 0.97 }}
              className={`odd-card relative flex flex-col items-center justify-center rounded-3xl text-center shadow-panel ${
                state === "odd" ? "ring-[10px] ring-ok" : ""
              } ${state === "wrong" ? "ring-[10px] ring-bad" : ""} ${
                state === "selected" ? "ring-[10px] ring-sun" : ""
              }`}
              style={{
                background: tone.bg,
                borderBottom: `10px solid ${tone.edge}`,
              }}
            >
              <span
                className="odd-badge absolute left-3 top-3 flex items-center justify-center rounded-xl font-black text-white"
                style={{ background: tone.edge }}
                aria-hidden="true"
              >
                {LETTERS[i]}
              </span>
              <span className="odd-emoji" aria-hidden="true">
                {OPTION_EMOJI[opt] ?? "◆"}
              </span>
              <span className="odd-word font-black leading-tight text-ink">{opt}</span>
              {state === "odd" && (
                <motion.span
                  initial={{ scale: 0, rotate: -12 }}
                  animate={{ scale: 1, rotate: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 14 }}
                  className="odd-ribbon absolute -top-4 right-3 rounded-full bg-ok px-4 py-1 font-black uppercase tracking-wide text-white shadow-panel"
                >
                  Odd one out!
                </motion.span>
              )}
              {state === "wrong" && (
                <span className="odd-ribbon absolute -top-4 right-3 rounded-full bg-bad px-4 py-1 font-black uppercase tracking-wide text-white shadow-panel">
                  Not this one
                </span>
              )}
              {state === "selected" && (
                <span className="odd-ribbon absolute -top-4 right-3 rounded-full bg-sun px-4 py-1 font-black uppercase tracking-wide text-ink shadow-panel">
                  Your pick
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
