"use client";

/**
 * Compact event header:
 *
 *   [ RENAISSANCE LOGO ]   [ POP THE BALLOON CHALLENGE ]   [ SPE LOGO ]
 *
 * A 1fr / auto / 1fr grid keeps the title truly centred even though the SPE
 * logo is wider than the Renaissance one. Logos keep their native aspect
 * ratio (object-fit: contain, height-driven) — never cropped or stretched.
 */

export const LOGOS = {
  renaissance: "/media/images/renaissance-logo.png",
  spe: "/media/images/spe_logo.png",
} as const;

const LOGO_STYLE: React.CSSProperties = {
  height: "clamp(42px, 5vw, 78px)",
  width: "auto",
  maxWidth: "28vw",
  objectFit: "contain",
  objectPosition: "center",
};

export default function BrandHeader({
  showTitle = true,
}: {
  /** The opening screen shows its own hero title, so the header hides its copy. */
  showTitle?: boolean;
}) {
  return (
    <header
      className="grid w-full shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 lg:px-8"
      style={{ height: "clamp(72px, 9vh, 110px)" }}
    >
      <div className="flex items-center justify-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGOS.renaissance}
          alt="Renaissance logo"
          style={LOGO_STYLE}
          draggable={false}
        />
      </div>
      {showTitle ? (
        <h1
          className="text-center font-black leading-none tracking-tight text-ren-navy"
          style={{ fontSize: "clamp(24px, 2.5vw, 52px)" }}
        >
          POP THE <span className="text-ren-orange">BALLOON</span> CHALLENGE
        </h1>
      ) : (
        <span aria-hidden="true" />
      )}
      <div className="flex items-center justify-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGOS.spe}
          alt="SPE International logo"
          style={LOGO_STYLE}
          draggable={false}
        />
      </div>
    </header>
  );
}
