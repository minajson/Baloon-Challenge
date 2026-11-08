"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FeatureChallenge } from "@/lib/types";

const CLUE_META = [
  { label: "Clue 1", level: "Hard", points: 3, tone: "#d23a2c", soft: "#fcebe8" },
  { label: "Clue 2", level: "Medium", points: 2, tone: "#a8700a", soft: "#fdf3d8" },
  { label: "Clue 3", level: "Easy", points: 1, tone: "#118a4a", soft: "#e0f4e8" },
];

/**
 * Game 4 — a large photograph with three progressive clues. The facilitator
 * reveals clues one at a time (3 / 2 / 1 points). Nothing on screen — no
 * caption, label, alt text or filename — names the feature until Reveal Answer.
 */
export default function FeatureGuess({
  challenge,
  cluesShown,
  revealed,
  alt,
  credit,
}: {
  challenge: FeatureChallenge;
  cluesShown: number;
  revealed: boolean;
  /** Neutral description of the photo (never the feature name). */
  alt: string;
  /** Attribution line, shown only after the answer is revealed. */
  credit: string | null;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="stage-cq feature-grid h-full min-h-0 w-full">
      {/* Photograph */}
      <motion.figure
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="feature-photo relative m-0 overflow-hidden rounded-3xl bg-ink shadow-panel"
      >
        {failed ? (
          <div className="flex h-full w-full items-center justify-center p-6 text-center text-xl font-bold text-white/80">
            Photo unavailable — the facilitator can continue with the clues.
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={challenge.photo}
            alt={alt}
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        )}
        {revealed && credit && (
          <figcaption className="absolute bottom-0 left-0 right-0 bg-black/55 px-3 py-1 text-xs font-semibold text-white/90 lg:text-sm">
            {credit}
          </figcaption>
        )}
      </motion.figure>

      {/* Clues */}
      <div className="feature-clues flex min-h-0 flex-col gap-2 lg:gap-3">
        {CLUE_META.map((meta, i) => {
          const visible = i < cluesShown;
          return (
            <div
              key={meta.label}
              className="feature-clue relative flex-1 overflow-hidden rounded-2xl border-4 bg-white shadow-panel"
              style={{ borderColor: visible ? meta.tone : "rgb(16 35 63 / 0.12)" }}
            >
              <div
                className="flex items-center justify-between gap-2 px-3 py-1 font-black uppercase tracking-wide"
                style={{
                  background: visible ? meta.soft : "#f1f3f6",
                  color: visible ? meta.tone : "rgb(16 35 63 / 0.45)",
                  fontSize: "clamp(11px, 0.95vw, 22px)",
                }}
              >
                <span>
                  {meta.label} · {meta.level}
                </span>
                <span>{meta.points} pt{meta.points > 1 ? "s" : ""}</span>
              </div>
              <div className="feature-clue-body flex items-center px-4 py-2">
                <AnimatePresence mode="wait">
                  {visible ? (
                    <motion.p
                      key="clue"
                      initial={{ rotateX: -80, opacity: 0 }}
                      animate={{ rotateX: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 18 }}
                      className="font-extrabold leading-snug text-ink"
                    >
                      “{challenge.clues[i]}”
                    </motion.p>
                  ) : (
                    <p className="font-bold text-ink/35">🔒 Not revealed yet</p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
