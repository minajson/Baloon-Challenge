"use client";

import Emblem from "./Emblem";

export const GAME_TITLE = "NAPE 2026 GEOSCIENCE GAMES";

/**
 * Compact event header:  [ emblem ]   [ NAPE 2026 GEOSCIENCE GAMES ]   [ ]
 *
 * Layout lives in the plain-CSS `.game-header` / `.brand-title` rules in
 * globals.css (grid with minmax columns keeps the title truly centred and
 * shrinkable at any viewport size).
 */
export default function BrandHeader({
  showTitle = true,
}: {
  /** The opening screen shows its own hero title, so the header hides its copy. */
  showTitle?: boolean;
}) {
  return (
    <header className="game-header">
      <div>{showTitle && <Emblem className="brand-emblem" />}</div>
      {showTitle ? (
        <h1 className="brand-title text-ink">
          <span className="text-terra">NAPE 2026</span> GEOSCIENCE GAMES
        </h1>
      ) : (
        <span aria-hidden="true" />
      )}
      <span aria-hidden="true" />
    </header>
  );
}
