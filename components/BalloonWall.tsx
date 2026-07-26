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
      <div
        role="group"
        aria-label="Balloon wall"
        className="mx-auto grid min-h-0 w-full max-w-[3000px] flex-1 grid-cols-10 grid-rows-5 place-items-center gap-x-3 gap-y-0 2xl:gap-x-6"
      >
        {Array.from({ length: totalBalloons }, (_, i) => i + 1).map((n, i) => (
          <div key={n} className="h-full max-h-full w-full p-0.5">
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
  );
}
