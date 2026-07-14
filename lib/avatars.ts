import type { AvatarClip, AvatarGender, ResponseType } from "./types";
import manifest from "@/data/avatar-manifest.json";

export const DIALOGUE: Record<ResponseType, string> = {
  correct: "Good job! Well done!",
  wrong: "Oh-oh! Please try again next time!",
  final: "Well done, everyone! Remember to always stay safe!",
};

export const MASTER_IMAGES: Record<AvatarGender, string> = {
  male: "/media/images/RENAISSANCE_MALE_MASCOT_MASTER.png",
  female: "/media/images/RENAISSANCE_FEMALE_MASCOT_MASTER.png",
};

const CLIPS: AvatarClip[] = manifest as AvatarClip[];

/**
 * All clips for a gender + response type. Variants (e.g. correct_01 and
 * correct_02) are returned in manifest order.
 */
export function clipsFor(
  gender: AvatarGender,
  responseType: ResponseType,
): AvatarClip[] {
  return CLIPS.filter(
    (c) => c.gender === gender && c.responseType === responseType,
  );
}

/**
 * Pick a clip, rotating between variants so consecutive answers do not always
 * replay the same movement. Falls back to the other gender when a clip is
 * missing entirely (per the fallback rules), and finally to a stub clip that
 * shows the master image with on-screen dialogue.
 */
export function pickClip(
  gender: AvatarGender,
  responseType: ResponseType,
  variantSeed: number,
): AvatarClip {
  const own = clipsFor(gender, responseType);
  if (own.length > 0) return own[variantSeed % own.length];
  const other = clipsFor(gender === "male" ? "female" : "male", responseType);
  if (other.length > 0) return other[variantSeed % other.length];
  return {
    gender,
    responseType,
    file: null,
    fallbackFile: null,
    audioFile: null,
    dialogue: DIALOGUE[responseType],
    durationSec: null,
    hasTransparency: false,
  };
}

export function otherGender(g: AvatarGender): AvatarGender {
  return g === "male" ? "female" : "male";
}

/** Media URLs to warm up as soon as the game starts (one per case). */
export function preloadTargets(): string[] {
  const urls: string[] = [];
  (["male", "female"] as const).forEach((g) => {
    (["correct", "wrong"] as const).forEach((r) => {
      const clip = clipsFor(g, r)[0];
      if (clip?.file) urls.push(clip.file);
      else if (clip?.fallbackFile) urls.push(clip.fallbackFile);
    });
  });
  return urls;
}

/** Every video URL in the manifest (for the deferred full preload). */
export function allClipUrls(): string[] {
  const urls: string[] = [];
  CLIPS.forEach((c) => {
    if (c.file) urls.push(c.file);
    if (c.fallbackFile) urls.push(c.fallbackFile);
  });
  return urls;
}
