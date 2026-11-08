"use client";

import { CATEGORIES, TOTAL_BALLOONS, challengesOfType } from "@/data/challenges";
import type { BalloonOutcome, ChallengeType } from "@/lib/types";
import { sound } from "@/lib/sound";
import Balloon, { type BalloonResult } from "./Balloon";

/**
 * The balloon board. 80 balloons are split into the four games; each game has
 * its own tab with 20 large balloons so nothing is shrunk to an unreadable size.
 */
export default function BalloonWall({
  popped,
  outcomes,
  locked,
  tab,
  onTab,
  onPop,
}: {
  popped: number[];
  outcomes: BalloonOutcome[];
  locked: boolean;
  tab: ChallengeType;
  onTab: (tab: ChallengeType) => void;
  onPop: (n: number) => void;
}) {
  const poppedSet = new Set(popped);
  const resultByBalloon = new Map<number, BalloonResult>(
    outcomes.map((o) => [o.balloonNumber, o.correct ? "correct" : "wrong"]),
  );
  const cat = CATEGORIES.find((c) => c.id === tab)!;
  const items = challengesOfType(tab);
  const remainingTotal = TOTAL_BALLOONS - popped.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 lg:px-6">
      {/* Game tabs */}
      <div
        role="tablist"
        aria-label="Choose a game"
        className="board-tabs mx-auto mb-1 flex w-full max-w-[min(96vw,2400px)] flex-wrap justify-center gap-2 lg:gap-3"
      >
        {CATEGORIES.map((c) => {
          const list = challengesOfType(c.id);
          const done = list.filter((x) => poppedSet.has(x.balloon)).length;
          const active = c.id === tab;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                void sound.play("click");
                onTab(c.id);
              }}
              className={`board-tab flex items-center gap-2 rounded-2xl border-4 px-3 py-1.5 text-left font-black transition lg:gap-3 lg:px-5 ${
                active
                  ? "text-white shadow-panel"
                  : "bg-white/85 text-ink hover:-translate-y-0.5 hover:shadow-panel"
              }`}
              style={
                active
                  ? { background: c.accent, borderColor: c.accent }
                  : { borderColor: c.accentSoft }
              }
            >
              <span className="board-tab-emoji" aria-hidden="true">
                {c.emoji}
              </span>
              <span className="flex flex-col leading-tight">
                <span className="board-tab-name">{c.name}</span>
                <span
                  className={`board-tab-count font-bold ${
                    active ? "text-white/85" : "text-ink/60"
                  }`}
                >
                  {done} / {list.length} played
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <p
        className="mx-auto mb-0.5 text-center font-bold text-ink/75"
        style={{ fontSize: "clamp(13px, 1vw, 22px)" }}
        aria-live="polite"
      >
        {cat.tagline} · {remainingTotal} of {TOTAL_BALLOONS} balloons left
      </p>

      <div className="balloon-wall-scroll">
        <div
          role="tabpanel"
          aria-label={`${cat.name} balloons`}
          className="balloon-grid"
        >
          {items.map((c, i) => (
            <div key={c.id} className="p-0.5">
              <Balloon
                number={c.balloon}
                label={c.n}
                palette={cat.colors}
                result={resultByBalloon.get(c.balloon)}
                index={i}
                popped={poppedSet.has(c.balloon)}
                disabled={locked}
                onPop={onPop}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
