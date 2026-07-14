"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Question } from "@/lib/types";
import { sound } from "@/lib/sound";
import Timer from "./Timer";

const LETTERS = ["A", "B", "C", "D"];

export type ResolveMethod = "answered" | "timeout" | "admin-correct" | "admin-wrong";

export default function QuestionScreen({
  question,
  timerEnabled,
  timerDuration,
  secondAttemptMode,
  paused,
  resolved,
  showNext,
  avatarActive,
  onResolve,
  onNext,
}: {
  question: Question;
  timerEnabled: boolean;
  timerDuration: number;
  secondAttemptMode: boolean;
  paused: boolean;
  /** Set by the parent once the outcome has been recorded. */
  resolved: { correct: boolean; method: ResolveMethod } | null;
  showNext: boolean;
  /** True while the mascot reaction overlay is on screen (right side). */
  avatarActive: boolean;
  onResolve: (correct: boolean, method: ResolveMethod) => void;
  onNext: () => void;
}) {
  const total = question.timeLimit ?? timerDuration;
  const [secondsLeft, setSecondsLeft] = useState(total);
  const [selected, setSelected] = useState<number | null>(null);
  const [struckOptions, setStruckOptions] = useState<number[]>([]);
  const [revealCorrect, setRevealCorrect] = useState(false);
  const [prevResolved, setPrevResolved] = useState(resolved);
  const resolvedRef = useRef(false);

  const locked = resolved !== null;

  // On a wrong answer the selected option turns red immediately and the
  // correct one is highlighted green after a short pause (timeout below).
  if (resolved !== prevResolved) {
    setPrevResolved(resolved);
    setRevealCorrect(resolved?.correct ?? false);
  }
  useEffect(() => {
    if (!resolved || resolved.correct) return;
    const t = window.setTimeout(() => setRevealCorrect(true), 700);
    return () => window.clearTimeout(t);
  }, [resolved]);

  // Countdown.
  useEffect(() => {
    if (!timerEnabled || locked || paused) return;
    if (secondsLeft <= 0) {
      if (!resolvedRef.current) {
        resolvedRef.current = true;
        onResolve(false, "timeout");
      }
      return;
    }
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [secondsLeft, timerEnabled, locked, paused, onResolve]);

  const handleSelect = useCallback(
    (index: number) => {
      if (locked || resolvedRef.current || paused) return;
      if (struckOptions.includes(index)) return;
      void sound.play("click");
      const correct = index === question.correctAnswerIndex;
      if (!correct && secondAttemptMode && struckOptions.length === 0) {
        // Second-attempt mode: strike the wrong option, allow one more pick.
        setStruckOptions([index]);
        void sound.play("wrong");
        return;
      }
      setSelected(index);
      resolvedRef.current = true;
      onResolve(correct, "answered");
    },
    [locked, paused, question.correctAnswerIndex, secondAttemptMode, struckOptions, onResolve],
  );

  // Keyboard support: A-D / 1-4 to answer, Enter for next.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showNext && (e.key === "Enter" || e.key === " ")) {
        onNext();
        return;
      }
      const letterIdx = ["a", "b", "c", "d"].indexOf(e.key.toLowerCase());
      const numIdx = ["1", "2", "3", "4"].indexOf(e.key);
      const idx = letterIdx !== -1 ? letterIdx : numIdx;
      if (idx !== -1 && idx < question.options.length) handleSelect(idx);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSelect, onNext, question.options.length, showNext]);

  const diffTone =
    question.difficulty === "Easy"
      ? "bg-safety-green-soft text-safety-green"
      : question.difficulty === "Medium"
        ? "bg-warm-yellow-soft text-ren-orange-deep"
        : "bg-alert-red-soft text-alert-red";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex min-h-0 flex-1 flex-col px-4 pb-4 lg:px-8 lg:pl-32"
    >
      <div
        className={`flex min-h-0 w-full flex-1 flex-col rounded-3xl bg-white p-4 shadow-panel transition-all duration-300 lg:p-7 ${
          avatarActive ? "lg:w-[72%]" : "mx-auto max-w-[1500px]"
        }`}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          <span className="rounded-full bg-ren-orange px-4 py-1.5 text-base font-black text-white lg:text-lg">
            Balloon {question.balloonNumber}
          </span>
          <span className="rounded-full bg-ren-navy-soft px-4 py-1.5 text-base font-bold text-ren-navy lg:text-lg">
            {question.category}
          </span>
          <span
            className={`rounded-full px-4 py-1.5 text-base font-bold lg:text-lg ${diffTone}`}
          >
            {question.difficulty}
          </span>
          <div className="ml-auto">
            {timerEnabled && !locked && (
              <Timer
                secondsLeft={secondsLeft}
                totalSeconds={total}
                running={!paused && !locked}
              />
            )}
          </div>
        </div>

        {/* Question */}
        <h2 className="mt-3 text-balance text-2xl font-black leading-snug text-ren-navy md:text-3xl lg:mt-5 lg:text-4xl xl:text-[2.6rem]">
          {question.question}
        </h2>

        {question.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.image}
            alt=""
            className="mt-3 max-h-40 self-center rounded-xl object-contain"
          />
        )}

        {/* Answers */}
        <div className="mt-4 grid flex-1 grid-cols-1 content-center gap-3 md:grid-cols-2 lg:mt-6 lg:gap-4">
          {question.options.map((opt, i) => {
            const isCorrect = i === question.correctAnswerIndex;
            const isSelected = selected === i;
            const struck = struckOptions.includes(i);
            let styles =
              "border-ren-navy-soft bg-white text-ren-navy hover:border-ren-orange hover:shadow-panel";
            let badge = "bg-ren-navy-soft text-ren-navy";
            let icon: "check" | "cross" | null = null;
            if (locked) {
              if (isCorrect && revealCorrect) {
                styles = "border-safety-green bg-safety-green-soft text-safety-green";
                badge = "bg-safety-green text-white";
                icon = "check";
              } else if (isSelected) {
                styles = "border-alert-red bg-alert-red-soft text-alert-red";
                badge = "bg-alert-red text-white";
                icon = "cross";
              } else {
                styles = "border-ren-navy-soft bg-white text-ren-navy/40";
              }
            } else if (struck) {
              styles = "border-alert-red bg-alert-red-soft text-alert-red/70 line-through";
              badge = "bg-alert-red text-white";
              icon = "cross";
            }
            return (
              <button
                key={i}
                type="button"
                disabled={locked || struck || paused}
                onClick={() => handleSelect(i)}
                className={`flex items-center gap-4 rounded-2xl border-4 p-3 text-left transition lg:p-4 ${styles}`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-black lg:h-14 lg:w-14 lg:text-2xl ${badge}`}
                >
                  {icon === "check" ? "✓" : icon === "cross" ? "✕" : LETTERS[i]}
                </span>
                <span className="text-lg font-bold leading-snug md:text-xl lg:text-2xl">
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explanation + Next */}
        <div className="mt-3 flex min-h-[76px] items-center gap-4 lg:mt-4">
          {resolved && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex-1 rounded-2xl px-4 py-3 lg:px-5 ${
                resolved.correct
                  ? "bg-safety-green-soft"
                  : "bg-warm-yellow-soft"
              }`}
            >
              <p
                className={`text-sm font-black uppercase tracking-wide lg:text-base ${
                  resolved.correct ? "text-safety-green" : "text-ren-orange-deep"
                }`}
              >
                {resolved.correct
                  ? "Correct! Well done!"
                  : resolved.method === "timeout"
                    ? "Time is up — nice try! Here is the correct answer."
                    : "Nice try! Here is the correct answer."}
              </p>
              <p className="mt-0.5 text-base font-semibold text-ren-navy lg:text-xl">
                {question.explanation}
              </p>
            </motion.div>
          )}
          {showNext && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onNext}
              className="ml-auto shrink-0 rounded-2xl bg-ren-orange px-6 py-4 text-xl font-black text-white shadow-panel transition hover:scale-105 hover:bg-ren-orange-deep lg:px-8 lg:text-2xl"
            >
              Next Participant →
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
