"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { GameState } from "@/lib/types";
import { accuracyPercent, categoryStats } from "@/lib/questions";
import { pickClip } from "@/lib/avatars";
import { exportResultsCsv, downloadFile } from "@/lib/csv";
import { sound } from "@/lib/sound";
import AvatarOverlay from "./AvatarOverlay";
import Confetti from "./Confetti";

export default function ResultsScreen({
  state,
  avatarsEnabled,
  confettiEnabled,
  onRestart,
}: {
  state: GameState;
  avatarsEnabled: boolean;
  confettiEnabled: boolean;
  onRestart: () => void;
}) {
  const stats = useMemo(() => categoryStats(state), [state]);
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
      "nape-2026-geoscience-games-results.csv",
      exportResultsCsv(state.outcomes),
    );
    const summary = {
      event: "NAPE 2026 Geoscience Games",
      completedAt: new Date().toISOString(),
      totals: {
        correct: state.correctCount,
        notQuite: state.incorrectCount,
        points: state.points,
        challengesCompleted: state.outcomes.length,
        accuracy: `${accuracyPercent(state)}%`,
      },
      categories: stats,
    };
    downloadFile(
      "nape-2026-geoscience-games-summary.json",
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
        <h1 className="mt-2 text-center text-4xl font-black tracking-tight text-ink lg:text-6xl">
          NAPE 2026 Geoscience Games{" "}
          <span className="text-terra">Complete!</span>
        </h1>
        <p className="mt-2 text-2xl font-black text-ok lg:text-3xl">
          Great work, geoscientists! 🎉
        </p>

        <div className="mt-6 grid w-full grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
          <StatCard label="Total Points" value={String(state.points)} tone="bg-terra-soft text-terra-deep" />
          <StatCard label="Correct Answers" value={String(state.correctCount)} tone="bg-ok-soft text-ok" />
          <StatCard label="Not Quite" value={String(state.incorrectCount)} tone="bg-bad-soft text-bad" />
          <StatCard label="Challenges Completed" value={String(state.outcomes.length)} tone="bg-ink-soft text-ink" />
          <StatCard label="Accuracy" value={`${accuracyPercent(state)}%`} tone="bg-ink-soft text-ink" />
        </div>

        <div className="mt-5 grid w-full gap-3 lg:grid-cols-2 lg:gap-4">
          <div className="rounded-3xl bg-white p-5 shadow-panel">
            <h2 className="text-lg font-black uppercase tracking-wide text-ok">
              Strongest Games
            </h2>
            <CategoryList items={strongest} tone="text-ok" />
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-panel">
            <h2 className="text-lg font-black uppercase tracking-wide text-terra-deep">
              Games to Revisit
            </h2>
            <CategoryList items={weakest} tone="text-terra-deep" />
          </div>
        </div>

        <div className="mb-4 mt-7 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-2xl bg-terra px-8 py-4 text-xl font-black text-white shadow-panel transition hover:scale-105 hover:bg-terra-deep"
          >
            ↻ Restart Game
          </button>
          <button
            type="button"
            onClick={exportResults}
            className="rounded-2xl bg-ink px-8 py-4 text-xl font-black text-white shadow-panel transition hover:scale-105 hover:bg-ink-mid"
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
  items: { category: string; correct: number; total: number; accuracy: number; points: number }[];
  tone: string;
}) {
  if (items.length === 0) {
    return <p className="mt-3 font-semibold text-ink/60">No data yet.</p>;
  }
  return (
    <ul className="mt-3 space-y-2">
      {items.map((s) => (
        <li key={s.category} className="flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-ink">{s.category}</span>
          <span className={`text-lg font-black tabular-nums ${tone}`}>
            {s.correct}/{s.total} · {s.points} pts
          </span>
        </li>
      ))}
    </ul>
  );
}
