"use client";

import Balloon from "./Balloon";

export default function BalloonWall({
  totalBalloons,
  popped,
  locked,
  onPop,
}: {
  totalBalloons: number;
  popped: number[];
  locked: boolean;
  onPop: (n: number) => void;
}) {
  const poppedSet = new Set(popped);
  const remaining = totalBalloons - popped.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 lg:px-6">
      <div className="mb-1 flex items-center justify-center gap-3">
        <p
          className="rounded-full bg-white/80 px-5 py-1 text-center text-base font-bold text-ren-navy shadow-panel lg:text-lg"
          aria-live="polite"
        >
          {remaining} of {totalBalloons} balloons remaining
        </p>
      </div>
      <div className="balloon-wall-scroll">
        <div role="group" aria-label="Balloon wall" className="balloon-grid">
          {Array.from({ length: totalBalloons }, (_, i) => i + 1).map((n, i) => (
            <div key={n} className="p-0.5">
              <Balloon
                number={n}
                index={i}
                popped={poppedSet.has(n)}
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
