"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LettersChallenge } from "@/lib/types";
import { parsePattern } from "@/data/challenges";
import { sound } from "@/lib/sound";

const ROWS = ["ABCDEFGHI", "JKLMNOPQR", "STUVWXYZ"];

/**
 * Game 2 — the original word pattern with blanks, big clickable letter tiles
 * and an on-screen keyboard. Players can fill and change letters freely until
 * the facilitator reveals the answer, which stays hidden until then.
 */
export default function MissingLetters({
  challenge,
  revealed,
  hintShown,
  onToggleHint,
}: {
  challenge: LettersChallenge;
  revealed: boolean;
  hintShown: boolean;
  onToggleHint: () => void;
}) {
  const tokens = useMemo(() => parsePattern(challenge.pattern), [challenge.pattern]);
  const blanks = useMemo(
    () => tokens.flatMap((t, i) => (t === null ? [i] : [])),
    [tokens],
  );
  const [fills, setFills] = useState<Record<number, string>>({});
  const [cursor, setCursor] = useState<number | null>(blanks[0] ?? null);
  const [lastPlaced, setLastPlaced] = useState<{ index: number; stamp: number } | null>(
    null,
  );

  const place = useCallback(
    (letter: string) => {
      if (revealed || cursor === null) return;
      void sound.play("click");
      setFills((f) => ({ ...f, [cursor]: letter }));
      setLastPlaced({ index: cursor, stamp: Date.now() });
      // Advance to the next empty blank (wrapping), otherwise stay put.
      const order = [...blanks.filter((b) => b > cursor), ...blanks.filter((b) => b <= cursor)];
      const next = order.find((b) => b !== cursor && !(b in fills));
      if (next !== undefined) setCursor(next);
    },
    [revealed, cursor, blanks, fills],
  );

  const erase = useCallback(() => {
    if (revealed) return;
    void sound.play("click");
    if (cursor !== null && cursor in fills) {
      setFills((f) => {
        const copy = { ...f };
        delete copy[cursor];
        return copy;
      });
      return;
    }
    // Nothing under the cursor: remove the nearest earlier filled blank.
    const prev = [...blanks].reverse().find((b) => b in fills && (cursor === null || b < cursor));
    const target = prev ?? [...blanks].reverse().find((b) => b in fills);
    if (target !== undefined) {
      setFills((f) => {
        const copy = { ...f };
        delete copy[target];
        return copy;
      });
      setCursor(target);
    }
  }, [revealed, cursor, fills, blanks]);

  const clearAll = useCallback(() => {
    if (revealed) return;
    void sound.play("click");
    setFills({});
    setCursor(blanks[0] ?? null);
  }, [revealed, blanks]);

  const move = useCallback(
    (dir: 1 | -1) => {
      if (cursor === null) return;
      const at = blanks.indexOf(cursor);
      const next = blanks[(at + dir + blanks.length) % blanks.length];
      setCursor(next);
    },
    [cursor, blanks],
  );

  // Physical keyboard support (laptop).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[a-z]$/i.test(e.key)) {
        e.preventDefault();
        place(e.key.toUpperCase());
      } else if (e.key === "Backspace") {
        e.preventDefault();
        erase();
      } else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [place, erase, move]);

  const answer = revealed ? challenge.answer.toUpperCase() : "";

  return (
    <div className="stage-cq flex min-h-full w-full flex-col items-center justify-center gap-[1.2vh] pt-2">
      {/* Word pattern */}
      <div
        className="ml-pattern flex flex-wrap items-center justify-center"
        role="group"
        aria-label="Word pattern"
      >
        {tokens.map((t, i) => {
          if (t !== null) {
            return (
              <div key={i} className="ml-tile ml-fixed" aria-label={`Letter ${t}`}>
                {t}
              </div>
            );
          }
          const mine = fills[i];
          const isCursor = cursor === i && !revealed;
          if (revealed) {
            const right = mine === answer[i];
            return (
              <motion.div
                key={i}
                initial={{ rotateX: 90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ delay: 0.06 * blanks.indexOf(i), type: "spring", stiffness: 240, damping: 18 }}
                className={`ml-tile relative ${right ? "ml-right" : "ml-miss"}`}
              >
                {answer[i]}
                {!right && mine && (
                  <span className="ml-struck" aria-label={`You had ${mine}`}>
                    {mine}
                  </span>
                )}
              </motion.div>
            );
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                setCursor(i);
                void sound.play("click");
              }}
              aria-label={mine ? `Blank filled with ${mine}` : "Empty blank"}
              aria-pressed={isCursor}
              className={`ml-tile ml-blank ${isCursor ? "ml-cursor" : ""} ${mine ? "ml-filled" : ""}`}
            >
              <AnimatePresence mode="popLayout">
                {mine && (
                  <motion.span
                    key={`${mine}-${lastPlaced?.index === i ? lastPlaced.stamp : 0}`}
                    initial={{ scale: 0.3, y: -14, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 520, damping: 20 }}
                  >
                    {mine}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <div className="flex min-h-[3.2rem] flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onToggleHint}
          aria-pressed={hintShown}
          className="ml-hint-btn rounded-2xl bg-sun px-5 py-2 font-black text-ink shadow-panel transition hover:scale-105 active:scale-95"
        >
          💡 {hintShown ? "Hide Hint" : "Hint"}
        </button>
        <AnimatePresence>
          {hintShown && (
            <motion.p
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="ml-hint-text rounded-2xl bg-sun-soft px-5 py-2 text-center font-bold text-ink"
            >
              {challenge.hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* On-screen keyboard */}
      {!revealed && (
        <div className="ml-keyboard flex flex-col items-center" role="group" aria-label="Letter tiles">
          {ROWS.map((row, r) => (
            <div key={row} className="flex justify-center">
              {row.split("").map((L) => (
                <motion.button
                  key={L}
                  type="button"
                  whileTap={{ scale: 0.86 }}
                  whileHover={{ y: -3 }}
                  onClick={() => place(L)}
                  className="ml-key"
                  aria-label={`Letter ${L}`}
                >
                  {L}
                </motion.button>
              ))}
              {r === 2 && (
                <>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.86 }}
                    onClick={erase}
                    className="ml-key ml-key-wide"
                    aria-label="Delete letter"
                  >
                    ⌫
                  </motion.button>
                </>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="ml-clear mt-1 rounded-xl px-4 py-1 font-bold text-ink/60 underline decoration-dotted hover:text-ink"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
