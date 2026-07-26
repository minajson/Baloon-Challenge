"use client";

/**
 * Compact event header:
 *
 *   [ RENAISSANCE LOGO ]   [ POP THE BALLOON CHALLENGE ]   [ SPE LOGO ]
 *
 * Layout lives in the plain-CSS `.game-header` / `.brand-title` rules in
 * globals.css (grid with minmax columns keeps the title truly centred and
 * shrinkable; logos are height/width capped with object-fit: contain so
 * they are never cropped or stretched at any viewport size).
 */

export const LOGOS = {
  renaissance: "/media/images/renaissance-logo.png",
  spe: "/media/images/spe_logo.png",
} as const;

export default function BrandHeader({
  showTitle = true,
}: {
  /** The opening screen shows its own hero title, so the header hides its copy. */
  showTitle?: boolean;
}) {
  return (
    <header className="game-header">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGOS.renaissance} alt="Renaissance logo" draggable={false} />
      </div>
      {showTitle ? (
        <h1 className="brand-title text-ren-navy">
          POP THE <span className="text-ren-orange">BALLOON</span> CHALLENGE
        </h1>
      ) : (
        <span aria-hidden="true" />
      )}
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGOS.spe} alt="SPE International logo" draggable={false} />
      </div>
    </header>
  );
}
