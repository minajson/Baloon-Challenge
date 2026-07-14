"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AvatarClip } from "@/lib/types";
import { MASTER_IMAGES } from "@/lib/avatars";
import { sound } from "@/lib/sound";

/**
 * Character reaction overlay. The mascot slides in from the right over unused
 * whitespace (the question card shrinks to make room), delivers the response
 * and exits.
 *
 * Audio priority: the standalone spoken-audio file is the source of truth.
 * The video always plays MUTED and the separate audio is played in sync, so
 * the game never relies on the audio embedded in the generated video. The
 * background music ducks while the mascot speaks. A safety timeout guarantees
 * the overlay always finishes and hands control back — the game can never
 * lock on a stalled or autoplay-blocked clip.
 *
 * Visual fallback order:
 *   1. transparent WebM  2. MP4  3. master image  (all with standalone audio)
 *   4. master image + on-screen dialogue only  5. continue without crashing.
 */
export default function AvatarOverlay({
  clip,
  onDone,
  allowSkip,
}: {
  clip: AvatarClip;
  onDone: () => void;
  allowSkip: boolean;
}) {
  // tier 0: webm, 1: mp4, 2: master image (audio still plays), 3: image + text
  const initialTier = clip.file ? 0 : clip.fallbackFile ? 1 : 2;
  const [tier, setTier] = useState(initialTier);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const safetyRef = useRef<number | null>(null);
  const textTimerRef = useRef<number | null>(null);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    audioRef.current?.pause();
    sound.unduck();
    if (safetyRef.current) window.clearTimeout(safetyRef.current);
    if (textTimerRef.current) window.clearTimeout(textTimerRef.current);
    window.setTimeout(onDone, 320);
  }, [onDone]);

  // Standalone audio is the source of truth — start it once, drive `finish`
  // off it when present. Duck the background music for the whole reaction.
  useEffect(() => {
    sound.duck();
    let audio: HTMLAudioElement | null = null;
    if (clip.audioFile) {
      audio = new Audio(clip.audioFile);
      audioRef.current = audio;
      audio.onended = finish;
      // If the audio can't play, fall back to a timed on-screen caption.
      audio.onerror = () => {
        setTier((t) => (t < 3 ? t : 3));
        textTimerRef.current = window.setTimeout(finish, 4000);
      };
      void audio.play().catch(() => {
        textTimerRef.current = window.setTimeout(finish, 4000);
      });
    } else {
      // No standalone audio: hold the caption for a readable moment.
      textTimerRef.current = window.setTimeout(finish, 4000);
    }
    return () => {
      audio?.pause();
    };
  }, [clip.audioFile, finish]);

  // Absolute backstop so a reaction never holds the game too long.
  useEffect(() => {
    const maxMs = ((clip.durationSec ?? 5) + 4) * 1000;
    safetyRef.current = window.setTimeout(finish, maxMs);
    return () => {
      if (safetyRef.current) window.clearTimeout(safetyRef.current);
    };
  }, [clip.durationSec, finish]);

  const videoSrc = tier === 0 ? clip.file : tier === 1 ? clip.fallbackFile : null;

  // Video is muted and plays for visuals only; advance tiers if it fails.
  useEffect(() => {
    if (!videoSrc) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {
      setTier((t) => (t === 0 && clip.fallbackFile ? 1 : 2));
    });
  }, [videoSrc, clip.fallbackFile]);

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          key="avatar"
          initial={{ x: 340, opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 220, damping: 22 },
          }}
          exit={{ x: 340, opacity: 0, transition: { duration: 0.3 } }}
          className="pointer-events-none fixed bottom-5 right-6 z-60 flex flex-col items-center"
          style={{ width: "clamp(260px, 22vw, 420px)" }}
        >
          <div className="relative w-full">
            {videoSrc ? (
              <video
                key={videoSrc}
                ref={videoRef}
                src={videoSrc}
                autoPlay
                muted
                playsInline
                controls={false}
                onError={() =>
                  setTier((t) => (t === 0 && clip.fallbackFile ? 1 : 2))
                }
                // Contain, bottom-anchored: never crop the head, hands or face.
                className="max-h-[68vh] w-full object-contain drop-shadow-2xl"
                style={{ objectPosition: "center bottom" }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={MASTER_IMAGES[clip.gender]}
                alt={`${clip.gender} safety ambassador`}
                className="max-h-[68vh] w-full object-contain drop-shadow-2xl"
                style={{ objectPosition: "center bottom" }}
              />
            )}
            {allowSkip && (
              <button
                type="button"
                onClick={finish}
                className="pointer-events-auto absolute right-0 top-0 rounded-full bg-ren-navy/85 px-3 py-1 text-xs font-bold text-white shadow hover:bg-ren-navy"
              >
                Skip ▸
              </button>
            )}
          </div>
          {/* Subtitle — always visible for accessibility */}
          <p
            className="mt-2 rounded-2xl bg-ren-navy/90 px-4 py-2 text-center text-base font-bold leading-snug text-white shadow-panel lg:text-lg"
            aria-live="polite"
          >
            “{clip.dialogue}”
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
