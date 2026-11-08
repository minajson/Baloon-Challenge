"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Challenge } from "@/lib/types";
import { categoryInfo } from "@/data/challenges";
import { basePoints, BONUS_POINTS, supportsBonus } from "@/lib/questions";
import { photoMeta } from "@/data/photos";
import Timer from "../Timer";
import FacilitatorBar, { FacButton } from "./FacilitatorBar";
import PicturePuzzle from "./PicturePuzzle";
import MissingLetters from "./MissingLetters";
import OddOneOut from "./OddOneOut";
import FeatureGuess from "./FeatureGuess";

export interface Resolution {
  correct: boolean;
  points: number;
  bonus: boolean;
}

const PROMPTS: Record<Challenge["type"], string> = {
  picture: "What geoscience term do these pictures make?",
  letters: "Fill the blanks to complete the geoscience word.",
  odd: "Which one is the odd one out?",
  feature: "What geological feature is this?",
};

export default function ChallengeScreen({
  challenge,
  timerEnabled,
  timerDuration,
  paused,
  resolved,
  avatarActive,
  hasNext,
  onResolve,
  onBonus,
  onNext,
  onReturn,
}: {
  challenge: Challenge;
  timerEnabled: boolean;
  timerDuration: number;
  paused: boolean;
  /** Set by the parent once the facilitator has marked the attempt. */
  resolved: Resolution | null;
  /** True while the mascot reaction overlay is on screen (right side). */
  avatarActive: boolean;
  /** Another unopened balloon exists in this game. */
  hasNext: boolean;
  onResolve: (correct: boolean, info: { points: number; bonus: boolean }) => void;
  onBonus: (awarded: boolean) => void;
  onNext: () => void;
  onReturn: () => void;
}) {
  const cat = categoryInfo(challenge.type);
  // 0 = answer hidden, 1 = answer revealed, 2 = explanation revealed (odd one out).
  const [stage, setStage] = useState(0);
  const [cluesShown, setCluesShown] = useState(0);
  const [hintShown, setHintShown] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [bonus, setBonus] = useState(false);

  const usesTimer = timerEnabled && challenge.type !== "feature";
  const [secondsLeft, setSecondsLeft] = useState(timerDuration);
  const timeUpRef = useRef(false);
  const [timeUp, setTimeUp] = useState(false);

  const revealed = stage >= 1;
  const locked = revealed || resolved !== null;

  // Countdown: runs until the facilitator reveals the answer. Running out of
  // time never marks anything — the facilitator decides.
  useEffect(() => {
    if (!usesTimer || locked || paused || timeUp) return;
    if (secondsLeft <= 0) {
      if (!timeUpRef.current) {
        timeUpRef.current = true;
        // Deferred so the state update is not synchronous inside the effect.
        window.setTimeout(() => setTimeUp(true), 0);
      }
      return;
    }
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [secondsLeft, usesTimer, locked, paused, timeUp]);

  const mark = useCallback(
    (correct: boolean) => {
      const base = correct ? basePoints(challenge, cluesShown) : 0;
      onResolve(correct, {
        points: base + (bonus ? BONUS_POINTS : 0),
        bonus,
      });
    },
    [challenge, cluesShown, bonus, onResolve],
  );

  const toggleBonus = useCallback(() => {
    const next = !bonus;
    setBonus(next);
    if (resolved) onBonus(next);
  }, [bonus, resolved, onBonus]);

  const meta = challenge.type === "feature" ? photoMeta(challenge.n) : null;
  const worth = basePoints(challenge, cluesShown);

  const levelTone =
    challenge.level === "Easy"
      ? "bg-ok-soft text-ok"
      : challenge.level === "Medium"
        ? "bg-sun-soft text-terra-deep"
        : "bg-bad-soft text-bad";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex min-h-0 flex-1 flex-col px-4 pb-4 lg:px-8"
    >
      <div
        className={`question-card flex min-h-0 w-full flex-1 flex-col rounded-3xl bg-white shadow-panel transition-all duration-300 ${
          avatarActive ? "lg:w-[74%]" : "mx-auto max-w-[min(96vw,2800px)]"
        }`}
      >
        {/* Header */}
        <div className="flex min-h-16 flex-wrap items-center gap-2 lg:min-h-20 lg:gap-3">
          <span
            className="rounded-full px-4 py-1.5 text-base font-black text-white lg:text-lg"
            style={{ background: cat.accent }}
          >
            {cat.emoji} {cat.name} · #{challenge.n}
          </span>
          {challenge.level && (
            <span className={`rounded-full px-4 py-1.5 text-base font-bold lg:text-lg ${levelTone}`}>
              {challenge.level}
            </span>
          )}
          {challenge.type === "feature" && (
            <span className="rounded-full bg-sun-soft px-4 py-1.5 text-base font-black text-terra-deep lg:text-lg">
              ⭐ Worth {worth} pt{worth > 1 ? "s" : ""} now
            </span>
          )}
          <div className="ml-auto flex items-center gap-3">
            {timeUp && !locked && (
              <span className="rounded-full bg-bad px-4 py-1.5 text-base font-black text-white lg:text-lg">
                ⏰ Time&apos;s up!
              </span>
            )}
            {usesTimer && !locked && !timeUp && (
              <Timer
                secondsLeft={secondsLeft}
                totalSeconds={timerDuration}
                running={!paused && !locked}
              />
            )}
          </div>
        </div>

        <h2 className="challenge-prompt mt-2 text-balance font-black text-ink lg:mt-3">
          {PROMPTS[challenge.type]}
        </h2>

        {/* Stage */}
        <div className="challenge-stage mt-2 min-h-0 flex-1">
          {challenge.type === "picture" && (
            <PicturePuzzle challenge={challenge} revealed={revealed} />
          )}
          {challenge.type === "letters" && (
            <MissingLetters
              key={challenge.id}
              challenge={challenge}
              revealed={revealed}
              hintShown={hintShown}
              onToggleHint={() => setHintShown((h) => !h)}
            />
          )}
          {challenge.type === "odd" && (
            <OddOneOut
              challenge={challenge}
              selected={selected}
              onSelect={setSelected}
              stage={stage}
            />
          )}
          {challenge.type === "feature" && (
            <FeatureGuess
              challenge={challenge}
              cluesShown={cluesShown}
              revealed={revealed}
              alt={meta?.alt ?? "A photograph of a geological feature"}
              credit={meta?.credit ?? null}
            />
          )}
        </div>

        {/* Reveal / result banner */}
        <div
          className={`mt-2 ${challenge.type === "letters" ? "" : "min-h-[3.5rem]"}`}
          aria-live="polite"
        >
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl px-4 py-2 lg:px-5 ${
                resolved
                  ? resolved.correct
                    ? "bg-ok-soft"
                    : "bg-sun-soft"
                  : "bg-ink-soft"
              }`}
            >
              <p className="banner-answer font-black text-ink">
                {challenge.type === "odd" ? "Odd one out: " : "Answer: "}
                <span className="text-ok">{challenge.answer}</span>
                {resolved && (
                  <span
                    className={`ml-3 rounded-full px-3 py-0.5 align-middle text-[0.6em] ${
                      resolved.correct ? "bg-ok text-white" : "bg-sun text-ink"
                    }`}
                  >
                    {resolved.correct ? "Correct" : "Not quite"}
                    {resolved.points > 0 ? ` · +${resolved.points} pt${resolved.points > 1 ? "s" : ""}` : ""}
                  </span>
                )}
              </p>
              {challenge.type === "odd" && stage >= 2 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="banner-why mt-0.5 font-semibold text-ink"
                >
                  <span className="font-black text-terra-deep">Why: </span>
                  {challenge.why}
                </motion.p>
              )}
              {bonus && (
                <p className="mt-0.5 text-sm font-black text-terra-deep lg:text-base">
                  ★ Bonus point awarded for the reason
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Facilitator controls */}
        <FacilitatorBar>
          {challenge.type === "letters" && (
            <FacButton tone="sun" pressed={hintShown} onClick={() => setHintShown((h) => !h)}>
              💡 {hintShown ? "Hide Hint" : "Show Hint"}
            </FacButton>
          )}
          {challenge.type === "feature" && (
            <FacButton
              tone="terra"
              disabled={cluesShown >= 3 || revealed}
              onClick={() => setCluesShown((n) => Math.min(3, n + 1))}
            >
              🔎{" "}
              {cluesShown >= 3
                ? "All Clues Shown"
                : `Reveal Clue ${cluesShown + 1} (${3 - cluesShown} pt${3 - cluesShown > 1 ? "s" : ""})`}
            </FacButton>
          )}
          {stage === 0 && (
            <FacButton tone="ink" onClick={() => setStage(1)}>
              👁 Reveal Answer
            </FacButton>
          )}
          {challenge.type === "odd" && stage === 1 && (
            <FacButton tone="ink" onClick={() => setStage(2)}>
              📖 Reveal Why
            </FacButton>
          )}
          {revealed && !resolved && (
            <>
              <FacButton tone="green" onClick={() => mark(true)}>
                ✓ Correct
              </FacButton>
              <FacButton tone="sun" onClick={() => mark(false)}>
                ✕ Not Quite
              </FacButton>
            </>
          )}
          {supportsBonus(challenge) && revealed && (
            <FacButton tone="terra" pressed={bonus} onClick={toggleBonus}>
              ★ {bonus ? "Bonus Awarded" : "Award Bonus Point"}
            </FacButton>
          )}
          <span className="ml-auto flex flex-wrap items-center gap-2 lg:gap-3">
            {resolved && hasNext && (
              <FacButton tone="green" onClick={onNext}>
                Next Challenge ▸
              </FacButton>
            )}
            <FacButton tone={resolved ? "ink" : "ghost"} onClick={onReturn}>
              🎈 Return to Board
            </FacButton>
          </span>
        </FacilitatorBar>
      </div>
    </motion.div>
  );
}
