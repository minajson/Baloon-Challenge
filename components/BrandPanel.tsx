"use client";

/**
 * Compact event identifier — replaces the old full-height sidebar.
 * A slim green accent bar with a two-line "RENAISSANCE PEOPLE DAY" mark,
 * anchored to the far-left edge. It does not reduce the usable game area.
 */
export default function BrandPanel() {
  return (
    <>
      {/* Desktop / projector: slim vertical mark near the left edge */}
      <div className="pointer-events-none absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 items-stretch gap-2 pl-2 lg:flex">
        <div className="w-1.5 rounded-full bg-safety-green" />
        <div className="flex flex-col justify-center leading-none">
          <span className="text-[13px] font-black tracking-tight text-ren-navy">
            RENAISSANCE
          </span>
          <span className="text-[13px] font-black tracking-tight text-safety-green">
            PEOPLE DAY
          </span>
        </div>
      </div>

      {/* Small screens: compact top strip */}
      <div className="flex items-center gap-2 bg-white/70 px-3 py-1 lg:hidden">
        <span className="h-4 w-1.5 rounded-full bg-safety-green" />
        <span className="text-xs font-black tracking-tight text-ren-navy">
          RENAISSANCE <span className="text-safety-green">PEOPLE DAY</span>
        </span>
      </div>
    </>
  );
}
