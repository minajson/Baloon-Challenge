"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { GameState, Question } from "@/lib/types";
import { accuracyPercent, categoryStats } from "@/lib/questions";
import { pickClip } from "@/lib/avatars";
import { exportResultsCsv, downloadFile } from "@/lib/csv";
import { sound } from "@/lib/sound";
import AvatarOverlay from "./AvatarOverlay";
import Confetti from "./Confetti";

export default function ResultsScreen({
  state,
  questions,
  avatarsEnabled,
  confettiEnabled,
  onRestart,
}: {
  state: GameState;
  questions: Question[];
  avatarsEnabled: boolean;
  confettiEnabled: boolean;
  onRestart: () => void;
}) {
  const stats = useMemo(() => categoryStats(questions, state), [questions, state]);
  const strongest = stats.slice(0, 3);
  const weakest = [...stats].reverse().slice(0, 3);
  const [confettiFire, setConfettiFire] = useState(() =>
    confettiEnabled ? 1 : 0,
  );
  // Final celebration: male clip then female clip, one after the other.
  const [finalStage, setFinalStage] = useState<"male" | "female" | "done">(
    avatarsEnabled ? "male" : "done",
  );

  useEffect(() => {
    void sound.play("fanfare");
    if (confettiEnabled) {
      const t = window.setInterval(
        () => setConfettiFire((n) => n + 1),
        2600,
      );
      window.setTimeout(() => window.clearInterval(t), 9000);
      return () => window.clearInterval(t);
    }
  }, [confettiEnabled]);

  const exportResults = () => {
    downloadFile(
      "pop-the-balloon-results.csv",
      exportResultsCsv(state.outcomes),
    );
    const summary = {
      event: "Pop the Balloon Challenge",
      completedAt: new Date().toISOString(),
      totals: {
        correct: state.correctCount,
        incorrect: state.incorrectCount,
        questionsCompleted: state.outcomes.length,
        accuracy: `${accuracyPercent(state)}%`,
      },
      categories: stats,
    };
    downloadFile(
      "pop-the-balloon-summary.json",
      JSON.stringify(summary, null, 2),
      "application/json",
    );
  };

  return (
    <div className="relative flex h-full flex-col items-center overflow-y-auto px-6 py-6">
      <Confetti fireSignal={confettiFire} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-[1500px] flex-col items-center"
      >
        <h1 className="mt-2 text-center text-4xl font-black tracking-tight text-ren-navy lg:text-6xl">
          Pop the Balloon Challenge{" "}
          <span className="text-ren-orange">Complete!</span>
        </h1>
        <p className="mt-2 text-2xl font-black text-safety-green lg:text-3xl">
          Great work, everyone! 🎉
        </p>

        <div className="mt-6 grid w-full grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard label="Correct Answers" value={String(state.correctCount)} tone="bg-safety-green-soft text-safety-green" />
          <StatCard label="Incorrect Answers" value={String(state.incorrectCount)} tone="bg-alert-red-soft text-alert-red" />
          <StatCard label="Questions Completed" value={String(state.outcomes.length)} tone="bg-ren-navy-soft text-ren-navy" />
          <StatCard label="Accuracy" value={`${accuracyPercent(state)}%`} tone="bg-ren-orange-soft text-ren-orange-deep" />
        </div>

        <div className="mt-5 grid w-full gap-3 lg:grid-cols-2 lg:gap-4">
          <div className="rounded-3xl bg-white p-5 shadow-panel">
            <h2 className="text-lg font-black uppercase tracking-wide text-safety-green">
              Strongest Safety Categories
            </h2>
            <CategoryList items={strongest} tone="text-safety-green" />
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-panel">
            <h2 className="text-lg font-black uppercase tracking-wide text-ren-orange-deep">
              Categories Needing More Awareness
            </h2>
            <CategoryList items={weakest} tone="text-ren-orange-deep" />
          </div>
        </div>

        <div className="mb-4 mt-7 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-2xl bg-ren-orange px-8 py-4 text-xl font-black text-white shadow-panel transition hover:scale-105 hover:bg-ren-orange-deep"
          >
            ↻ Restart Game
          </button>
          <button
            type="button"
            onClick={exportResults}
            className="rounded-2xl bg-ren-navy px-8 py-4 text-xl font-black text-white shadow-panel transition hover:scale-105 hover:bg-ren-navy-mid"
          >
            ⬇ Export Results
          </button>
        </div>
      </motion.div>

      {finalStage !== "done" && (
        <AvatarOverlay
          key={finalStage}
          clip={pickClip(finalStage, "final", 0)}
          allowSkip
          onDone={() =>
            setFinalStage((s) => (s === "male" ? "female" : "done"))
          }
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`rounded-3xl p-4 text-center shadow-panel lg:p-5 ${tone}`}>
      <p className="text-4xl font-black tabular-nums lg:text-5xl">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide opacity-80 lg:text-sm">
        {label}
      </p>
    </div>
  );
}

function CategoryList({
  items,
  tone,
}: {
  items: { category: string; correct: number; total: number; accuracy: number }[];
  tone: string;
}) {
  if (items.length === 0) {
    return <p className="mt-3 font-semibold text-ren-navy/60">No data yet.</p>;
  }
  return (
    <ul className="mt-3 space-y-2">
      {items.map((s) => (
        <li key={s.category} className="flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-ren-navy">{s.category}</span>
          <span className={`text-lg font-black tabular-nums ${tone}`}>
            {s.correct}/{s.total} · {s.accuracy}%
          </span>
        </li>
      ))}
    </ul>
  );
}
