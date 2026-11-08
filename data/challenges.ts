import raw from "./nape2026.json";
import type { Challenge, ChallengeType } from "@/lib/types";

/**
 * NAPE 2026 Geoscience Games — the one and only question collection.
 *
 * Source of truth: data/nape2026.json, transcribed verbatim from
 * "NAPE 2026 Geoscience Games" (Olem Oruene, 4 November 2026).
 * Do not edit wording, answers, hints or clues without the author's approval.
 */
export const CHALLENGES = raw.challenges as unknown as Challenge[];

export interface CategoryInfo {
  id: ChallengeType;
  name: string;
  /** Game number in the source document. */
  game: number;
  emoji: string;
  /** One-line player instruction shown on the board tab / challenge. */
  tagline: string;
  /** Glossy balloon palette for this game. */
  colors: { base: string; dark: string; light: string }[];
  /** Solid accent used for chips and tab highlights. */
  accent: string;
  accentSoft: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "picture",
    name: "Picture Puzzles",
    game: 1,
    emoji: "🧩",
    tagline: "Add the pictures — name the geoscience term.",
    colors: [
      { base: "#ef5b2b", dark: "#b93d14", light: "#ff9a70" },
      { base: "#f58a1f", dark: "#bd610a", light: "#ffbf73" },
      { base: "#e23d5a", dark: "#a8223c", light: "#ff8aa0" },
    ],
    accent: "#d9531a",
    accentSoft: "#fdeee4",
  },
  {
    id: "letters",
    name: "Missing Letters",
    game: 2,
    emoji: "🔤",
    tagline: "Fill the blanks to complete the word.",
    colors: [
      { base: "#12a39a", dark: "#0a726b", light: "#6fd9d1" },
      { base: "#1f8fd6", dark: "#126099", light: "#7cc3f0" },
      { base: "#2bb673", dark: "#177a4a", light: "#80e0ae" },
    ],
    accent: "#0c7f78",
    accentSoft: "#e0f5f3",
  },
  {
    id: "odd",
    name: "Odd One Out",
    game: 3,
    emoji: "🎯",
    tagline: "Pick the one that doesn't belong — then say why.",
    colors: [
      { base: "#7a52e0", dark: "#4d2fb0", light: "#b49af4" },
      { base: "#c24bd1", dark: "#8a2a97", light: "#e79cf2" },
      { base: "#4a67e8", dark: "#2c409f", light: "#98aaf6" },
    ],
    accent: "#5b3bc4",
    accentSoft: "#ece7fb",
  },
  {
    id: "feature",
    name: "Guess the Geological Feature",
    game: 4,
    emoji: "🌋",
    tagline: "Study the photo. Fewer clues = more points.",
    colors: [
      { base: "#f2b01e", dark: "#b97f06", light: "#ffd978" },
      { base: "#8aa51f", dark: "#5c7210", light: "#c4dc6a" },
      { base: "#d8892b", dark: "#9c5c10", light: "#f3bd77" },
    ],
    accent: "#a8700a",
    accentSoft: "#fdf3d8",
  },
];

export function categoryInfo(id: ChallengeType): CategoryInfo {
  return CATEGORIES.find((c) => c.id === id)!;
}

export function categoryByName(name: string): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.name === name);
}

export const TOTAL_BALLOONS = CHALLENGES.length;
export const BALLOONS_PER_CATEGORY = 20;

export function challengesOfType(type: ChallengeType): Challenge[] {
  return CHALLENGES.filter((c) => c.type === type);
}

/** Points for Game 4 by number of clues revealed (3 / 2 / 1). */
export function featurePoints(cluesRevealed: number): number {
  if (cluesRevealed <= 1) return 3;
  if (cluesRevealed === 2) return 2;
  return 1;
}

/** Split a missing-letters pattern into fixed letters and blanks. */
export function parsePattern(pattern: string): (string | null)[] {
  return pattern
    .trim()
    .split(/\s+/)
    .map((t) => (t === "_" ? null : t.toUpperCase()));
}

/**
 * Neutral emoji for the Odd One Out cards. They decorate every option the
 * same way and are deliberately not chosen to hint at which card is odd.
 */
export const OPTION_EMOJI: Record<string, string> = {
  Sandstone: "🏜️",
  Shale: "📚",
  Limestone: "🐚",
  Granite: "🏔️",
  Basalt: "⚫",
  Obsidian: "🔮",
  Marble: "🏛️",
  "Niger Delta": "🌴",
  "Nile Delta": "🐊",
  "Mississippi Delta": "🎷",
  "Grand Canyon": "🏞️",
  Quartz: "🧊",
  Feldspar: "🧱",
  Mica: "🔆",
  Coal: "🏭",
  Methane: "🐄",
  Ethane: "⛽",
  Propane: "🔥",
  "Carbon dioxide": "☁️",
  Stalactite: "🦇",
  Stalagmite: "⛰️",
  Flowstone: "💧",
  Moraine: "❄️",
  Mohs: "🔨",
  Richter: "📉",
  Mercalli: "🏚️",
  "Moment magnitude": "📊",
  Diamond: "💎",
  Graphite: "✏️",
  Anticline: "🌉",
  Syncline: "🥣",
  Monocline: "📐",
  Delta: "🔺",
  "Normal fault": "⬇️",
  "Reverse fault": "⬆️",
  "Strike-slip fault": "↔️",
  Unconformity: "⏳",
  Porosity: "🧽",
  Permeability: "🚰",
  "Water saturation": "💦",
  Magnitude: "📏",
  Meander: "🐍",
  "Oxbow lake": "🦆",
  "Point bar": "📍",
  Barchan: "🐪",
  Halite: "🧂",
  Gypsum: "🏗️",
  Anhydrite: "🧪",
  Pyrite: "🟡",
  Weathering: "🌦️",
  Erosion: "🌬️",
  Deposition: "⏬",
  Subduction: "🌏",
  Jurassic: "🦖",
  Cretaceous: "☄️",
  Triassic: "🐢",
  Eocene: "🌿",
  "Source rock": "🌱",
  "Reservoir rock": "🏺",
  Seal: "🔒",
  Aquifer: "🪠",
  "Anambra Basin": "🥘",
  "Benue Trough": "🌊",
  "Chad Basin": "🦓",
  "Jos Plateau": "🗻",
  "Gamma ray": "☢️",
  Resistivity: "⚡",
  Sonic: "🔊",
  "Seismic reflection": "📡",
  Foraminifera: "🦠",
  Pollen: "🌼",
  Ostracods: "🦐",
  Zircon: "💠",
  Slate: "⬛",
  Gneiss: "🌀",
  Schist: "🌟",
  Conglomerate: "🍪",
};
