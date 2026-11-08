"use client";

import { motion } from "framer-motion";
import type { PictureChallenge } from "@/lib/types";
import { artFor } from "./art";

function Panel({ description }: { description: string }) {
  const art = artFor(description);
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="picture-panel aspect-square overflow-hidden rounded-[8%] shadow-panel"
      style={{ background: art?.bg ?? "#ffffff" }}
    >
      {art ? (
        art.node
      ) : (
        // Defensive fallback: show the document's description verbatim.
        <div className="flex h-full w-full items-center justify-center p-4 text-center text-2xl font-black text-ink">
          {description}
        </div>
      )}
    </motion.div>
  );
}

function Operator({ children, tone }: { children: string; tone: string }) {
  return (
    <span
      className={`picture-op flex shrink-0 items-center justify-center rounded-full font-black text-white shadow-panel ${tone}`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

/**
 * Game 1 — two large visual panels separated by a plus sign. The answer box
 * shows "?" until the facilitator selects Reveal Answer.
 */
export default function PicturePuzzle({
  challenge,
  revealed,
}: {
  challenge: PictureChallenge;
  revealed: boolean;
}) {
  return (
    <div className="stage-cq flex h-full min-h-[220px] w-full items-center justify-center">
      <div className="picture-row flex w-full items-center justify-center">
        <Panel description={challenge.panelA} />
        <Operator tone="bg-terra">+</Operator>
        <Panel description={challenge.panelB} />
        <Operator tone="bg-ink">=</Operator>
        <motion.div
          key={revealed ? "answer" : "mystery"}
          initial={{ scale: 0.8, opacity: 0, rotate: revealed ? -4 : 0 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className={`picture-panel flex aspect-square items-center justify-center rounded-[8%] p-3 text-center ${
            revealed
              ? "bg-ok-soft text-ok shadow-panel ring-8 ring-ok"
              : "border-8 border-dashed border-ink/25 bg-white/70 text-ink/35"
          }`}
          aria-live="polite"
        >
          {revealed ? (
            <span className="picture-answer font-black leading-tight">
              {challenge.answer}
            </span>
          ) : (
            <span className="picture-q font-black" aria-label="Mystery term">
              ?
            </span>
          )}
        </motion.div>
      </div>
    </div>
  );
}
