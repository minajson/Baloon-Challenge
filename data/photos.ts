import credits from "./photo-credits.json";

export interface PhotoCredit {
  n: number;
  file: string;
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  /** Neutral description (never names the feature). */
  alt: string;
  /** What the photo shows — for hosts only; may name the feature. */
  subject: string;
}

export const PHOTO_CREDITS = credits as PhotoCredit[];

/** Alt text and attribution for Game 4 item `n`. */
export function photoMeta(n: number): { alt: string; credit: string } | null {
  const c = PHOTO_CREDITS.find((p) => p.n === n);
  if (!c) return null;
  return {
    alt: c.alt,
    credit: `Photo: ${c.author} · ${c.license} · Wikimedia Commons`,
  };
}
