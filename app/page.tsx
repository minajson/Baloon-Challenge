"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AvatarClip,
  AvatarGender,
  ChallengeType,
  GameSettings,
  GameState,
  Screen,
} from "@/lib/types";
import {
  DEFAULT_SETTINGS,
  clearState,
  initialGameState,
  loadSettings,
  loadState,
  saveSettings,
  saveState,
} from "@/lib/storage";
import {
  activeChallenges,
  assignedChallenge,
  challengeForBalloon,
  nextUnopenedInCategory,
} from "@/lib/questions";
import { TOTAL_BALLOONS } from "@/data/challenges";
import { allClipUrls, otherGender, pickClip, preloadTargets } from "@/lib/avatars";
import { sound } from "@/lib/sound";
import ChallengeScreen, { type Resolution } from "@/components/challenge/ChallengeScreen";
import OpeningScreen from "@/components/OpeningScreen";
import BalloonWall from "@/components/BalloonWall";
import AvatarOverlay from "@/components/AvatarOverlay";
import AdminPanel from "@/components/AdminPanel";
import ResultsScreen from "@/components/ResultsScreen";
import ScoreBar from "@/components/ScoreBar";
import BrandHeader from "@/components/BrandHeader";
import Confetti from "@/components/Confetti";

const CHALLENGES = activeChallenges();

export default function Game() {
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState<Screen>("opening");
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [game, setGame] = useState<GameState>(() => initialGameState("male"));
  const [boardTab, setBoardTab] = useState<ChallengeType>("picture");
  const [activeBalloon, setActiveBalloon] = useState<number | null>(null);
  const [resolved, setResolved] = useState<Resolution | null>(null);
  const [avatarClip, setAvatarClip] = useState<AvatarClip | null>(null);
  const [previewClip, setPreviewClip] = useState<AvatarClip | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [confettiFire, setConfettiFire] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const preloadedAll = useRef(false);
  /** Delayed reaction effects (confetti, mascot clip) — cancelled when the facilitator moves on. */
  const reactionTimers = useRef<number[]>([]);
  const clearReactionTimers = useCallback(() => {
    reactionTimers.current.forEach((t) => window.clearTimeout(t));
    reactionTimers.current = [];
  }, []);

  // ---- Hydration: restore settings and the saved game ----
  // One-time sync FROM localStorage after mount. Reading in a mount effect
  // (rather than in state initializers) keeps the server-rendered HTML and
  // the first client render identical, so static export hydrates cleanly.
  useEffect(() => {
    const s = loadSettings();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(s);
    const saved = loadState();
    if (saved) setGame(saved);
    else setGame(initialGameState(s.startingAvatar));
    setHydrated(true);
  }, []);

  // ---- Persistence ----
  useEffect(() => {
    if (hydrated) saveState(game);
  }, [game, hydrated]);
  useEffect(() => {
    if (hydrated) saveSettings(settings);
  }, [settings, hydrated]);

  // ---- Sound / music sync ----
  useEffect(() => {
    sound.enabled = settings.soundEnabled;
  }, [settings.soundEnabled]);
  useEffect(() => {
    // Music is independent of SFX; it loops persistently once gameplay starts.
    sound.configureMusic(settings.musicEnabled, settings.musicVolume);
    if (settings.musicEnabled && screen !== "opening") {
      sound.startMusic();
    } else {
      sound.stopMusic();
    }
  }, [settings.musicEnabled, settings.musicVolume, screen]);

  // ---- Media preload: likely clips first, the rest once the game is idle ----
  const warmClips = useCallback((urls: string[]) => {
    urls.forEach((url) => {
      const v = document.createElement("video");
      v.preload = "auto";
      v.src = url;
      v.muted = true;
      v.load();
    });
  }, []);

  useEffect(() => {
    if (screen === "wall" && !preloadedAll.current) {
      preloadedAll.current = true;
      warmClips(preloadTargets());
      window.setTimeout(() => {
        const initial = new Set(preloadTargets());
        warmClips(allClipUrls().filter((u) => !initial.has(u)));
      }, 4000);
    }
  }, [screen, warmClips]);

  const paused = game.phase === "paused";
  const activeChallenge = useMemo(
    () =>
      activeBalloon !== null
        ? assignedChallenge(CHALLENGES, game, activeBalloon)
        : undefined,
    [activeBalloon, game],
  );
  const nextChallenge = useMemo(
    () =>
      activeBalloon !== null
        ? nextUnopenedInCategory(CHALLENGES, game, activeBalloon)
        : undefined,
    [activeBalloon, game],
  );

  // A session ends when every balloon is used or the facilitator ends it.
  const sessionComplete = useCallback(
    (g: GameState) => g.finished || g.poppedBalloons.length >= TOTAL_BALLOONS,
    [],
  );

  const hasSavedGame =
    game.poppedBalloons.length > 0 && !sessionComplete(game);

  // ---- Actions ----
  const startGame = useCallback(() => {
    clearState();
    setGame({ ...initialGameState(settings.startingAvatar), phase: "running", startedAt: Date.now() });
    setActiveBalloon(null);
    setResolved(null);
    setScreen("wall");
    sound.preload();
  }, [settings.startingAvatar]);

  const resumeGame = useCallback(() => {
    setGame((g) => ({ ...g, phase: "running" }));
    setScreen(sessionComplete(game) ? "results" : "wall");
    sound.preload();
  }, [game, sessionComplete]);

  /** Open a balloon's challenge (the pop sound and burst are played by the caller). */
  const openChallenge = useCallback(
    (n: number, delayMs: number) => {
      clearReactionTimers();
      const c = challengeForBalloon(CHALLENGES, game, n);
      setGame((g) => ({
        ...g,
        poppedBalloons: g.poppedBalloons.includes(n)
          ? g.poppedBalloons
          : [...g.poppedBalloons, n],
        assignments: c ? { ...g.assignments, [String(n)]: c.id } : g.assignments,
      }));
      if (!c) {
        setToast(`Balloon ${n} has no challenge available — it was skipped.`);
        window.setTimeout(() => setToast(null), 3500);
        return;
      }
      // Give the burst animation a beat before the challenge appears.
      window.setTimeout(() => {
        setBoardTab(c.type);
        setActiveBalloon(n);
        setResolved(null);
        setAvatarClip(null);
        setScreen("question");
      }, delayMs);
    },
    [game, clearReactionTimers],
  );

  const handlePop = useCallback(
    (n: number) => {
      if (paused) return;
      void sound.play("pop");
      openChallenge(n, 420);
    },
    [paused, openChallenge],
  );

  const handleResolve = useCallback(
    (correct: boolean, info: { points: number; bonus: boolean }) => {
      if (!activeChallenge || activeBalloon === null) return;
      setResolved({ correct, points: info.points, bonus: info.bonus });
      setGame((g) => ({
        ...g,
        correctCount: g.correctCount + (correct ? 1 : 0),
        incorrectCount: g.incorrectCount + (correct ? 0 : 1),
        points: g.points + info.points,
        nextAvatar: otherGender(g.nextAvatar),
        outcomes: [
          ...g.outcomes,
          {
            balloonNumber: activeBalloon,
            questionId: activeChallenge.id,
            category: activeChallenge.category,
            correct,
            points: info.points,
            bonus: info.bonus,
            method: correct ? "admin-correct" : "admin-wrong",
            answeredAt: Date.now(),
          },
        ],
      }));
      clearReactionTimers();
      reactionTimers.current.push(
        window.setTimeout(
          () => void sound.play(correct ? "correct" : "wrong"),
          correct ? 120 : 300,
        ),
      );
      if (correct && settings.confettiEnabled) {
        reactionTimers.current.push(
          window.setTimeout(() => setConfettiFire((n) => n + 1), 200),
        );
      }
      if (settings.avatarVideosEnabled) {
        const clip = pickClip(
          game.nextAvatar,
          correct ? "correct" : "wrong",
          game.outcomes.length,
        );
        reactionTimers.current.push(
          window.setTimeout(() => setAvatarClip(clip), correct ? 700 : 900),
        );
      }
    },
    [
      activeChallenge,
      activeBalloon,
      clearReactionTimers,
      game.nextAvatar,
      game.outcomes.length,
      settings.avatarVideosEnabled,
      settings.confettiEnabled,
    ],
  );

  /** Facilitator toggles the Odd One Out bonus point after the attempt was marked. */
  const handleBonus = useCallback(
    (awarded: boolean) => {
      if (activeBalloon === null) return;
      setGame((g) => {
        const outcome = g.outcomes.find((o) => o.balloonNumber === activeBalloon);
        if (!outcome || outcome.bonus === awarded) return g;
        const delta = awarded ? 1 : -1;
        return {
          ...g,
          points: g.points + delta,
          outcomes: g.outcomes.map((o) =>
            o.balloonNumber === activeBalloon
              ? { ...o, bonus: awarded, points: o.points + delta }
              : o,
          ),
        };
      });
      setResolved((r) =>
        r ? { ...r, bonus: awarded, points: r.points + (awarded ? 1 : -1) } : r,
      );
    },
    [activeBalloon],
  );

  const leaveChallenge = useCallback(() => {
    clearReactionTimers();
    setActiveBalloon(null);
    setResolved(null);
    setAvatarClip(null);
    setShowAdmin(false);
  }, [clearReactionTimers]);

  const handleReturn = useCallback(() => {
    leaveChallenge();
    setScreen(sessionComplete(game) ? "results" : "wall");
  }, [game, leaveChallenge, sessionComplete]);

  /** Next Challenge: straight to the next unopened balloon in the same game. */
  const handleNextChallenge = useCallback(() => {
    if (!nextChallenge) return handleReturn();
    setAvatarClip(null);
    void sound.play("pop");
    openChallenge(nextChallenge.balloon, 150);
  }, [nextChallenge, handleReturn, openChallenge]);

  const finishGame = useCallback(() => {
    leaveChallenge();
    setGame((g) => ({ ...g, finished: true }));
    setScreen("results");
  }, [leaveChallenge]);

  const resetGame = useCallback(() => {
    clearState();
    setGame({ ...initialGameState(settings.startingAvatar), phase: "running", startedAt: Date.now() });
    setActiveBalloon(null);
    setResolved(null);
    setAvatarClip(null);
    setShowAdmin(false);
    setBoardTab("picture");
    setScreen("wall");
  }, [settings.startingAvatar]);

  const resetScore = useCallback(() => {
    setGame((g) => ({
      ...g,
      correctCount: 0,
      incorrectCount: 0,
      points: 0,
      outcomes: [],
    }));
  }, []);

  const patchSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  if (!hydrated) {
    return (
      <main className="game-app items-center justify-center">
        <p className="text-2xl font-black text-ink">Loading…</p>
      </main>
    );
  }

  return (
    <main className="game-app">
      <BrandHeader showTitle={screen !== "opening"} />
      <div className="game-main">
        {screen === "opening" && (
          <OpeningScreen
            hasSavedGame={hasSavedGame}
            onStart={startGame}
            onResume={resumeGame}
            onAdmin={() => setShowAdmin(true)}
          />
        )}

        {(screen === "wall" || screen === "question") && (
          <>
            <ScoreBar
              state={game}
              totalBalloons={TOTAL_BALLOONS}
              settings={settings}
              onSettingsChange={patchSettings}
              paused={paused}
              onAdminClick={() => setShowAdmin(true)}
            />
            {screen === "wall" ? (
              <BalloonWall
                popped={game.poppedBalloons}
                outcomes={game.outcomes}
                locked={paused || game.phase === "idle"}
                tab={boardTab}
                onTab={setBoardTab}
                onPop={handlePop}
              />
            ) : activeChallenge && activeBalloon !== null ? (
              <ChallengeScreen
                key={activeBalloon}
                challenge={activeChallenge}
                timerEnabled={settings.timerEnabled}
                timerDuration={settings.timerDuration}
                paused={paused}
                resolved={resolved}
                avatarActive={avatarClip !== null}
                hasNext={nextChallenge !== undefined}
                onResolve={handleResolve}
                onBonus={handleBonus}
                onNext={handleNextChallenge}
                onReturn={handleReturn}
              />
            ) : null}
          </>
        )}

        {screen === "results" && (
          <ResultsScreen
            state={game}
            avatarsEnabled={settings.avatarVideosEnabled}
            confettiEnabled={settings.confettiEnabled}
            onRestart={resetGame}
          />
        )}
      </div>

      {/* Confetti bursts for correct answers */}
      <Confetti fireSignal={confettiFire} />

      {/* Character reaction overlay */}
      {avatarClip && (
        <AvatarOverlay
          clip={avatarClip}
          onDone={() => undefined}
          allowSkip
          holdOnDone
        />
      )}
      {previewClip && (
        <AvatarOverlay
          clip={previewClip}
          onDone={() => setPreviewClip(null)}
          allowSkip
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[95] -translate-x-1/2 rounded-2xl bg-ink px-6 py-3 text-lg font-bold text-white shadow-panel">
          {toast}
        </div>
      )}

      {/* Admin */}
      {showAdmin && (
        <AdminPanel
          settings={settings}
          state={game}
          phase={game.phase}
          questionOpen={screen === "question"}
          questionResolved={resolved !== null}
          onClose={() => setShowAdmin(false)}
          onSettingsChange={patchSettings}
          onStartGame={() => {
            setShowAdmin(false);
            startGame();
          }}
          onPause={() => setGame((g) => ({ ...g, phase: "paused" }))}
          onResume={() => setGame((g) => ({ ...g, phase: "running" }))}
          onResetGame={resetGame}
          onResetScore={resetScore}
          onPreviewAvatar={(gender: AvatarGender, type) => {
            setShowAdmin(false);
            setPreviewClip(pickClip(gender, type, Date.now() % 2));
          }}
          onMarkAnswer={(correct) => {
            setShowAdmin(false);
            handleResolve(correct, { points: correct ? 1 : 0, bonus: false });
          }}
          onSkipQuestion={handleReturn}
          onReturnToWall={handleReturn}
          onFinishGame={finishGame}
        />
      )}
    </main>
  );
}
