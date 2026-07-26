"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AvatarClip,
  AvatarGender,
  GameSettings,
  GameState,
  Question,
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
  activeQuestions,
  assignedQuestion,
  pickQuestionForBalloon,
} from "@/lib/questions";
import { allClipUrls, otherGender, pickClip, preloadTargets } from "@/lib/avatars";
import { sound } from "@/lib/sound";
import type { ResolveMethod } from "@/components/QuestionScreen";
import OpeningScreen from "@/components/OpeningScreen";
import BalloonWall from "@/components/BalloonWall";
import QuestionScreen from "@/components/QuestionScreen";
import AvatarOverlay from "@/components/AvatarOverlay";
import AdminPanel from "@/components/AdminPanel";
import ResultsScreen from "@/components/ResultsScreen";
import ScoreBar from "@/components/ScoreBar";
import BrandHeader from "@/components/BrandHeader";
import Confetti from "@/components/Confetti";

const TOTAL_BALLOONS = 50;

export default function Game() {
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState<Screen>("opening");
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [game, setGame] = useState<GameState>(() => initialGameState("male"));
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeBalloon, setActiveBalloon] = useState<number | null>(null);
  const [resolved, setResolved] = useState<{
    correct: boolean;
    method: ResolveMethod;
  } | null>(null);
  const [showNext, setShowNext] = useState(false);
  const [avatarClip, setAvatarClip] = useState<AvatarClip | null>(null);
  const [previewClip, setPreviewClip] = useState<AvatarClip | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [confettiFire, setConfettiFire] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const preloadedAll = useRef(false);

  // ---- Hydration: restore settings, question set and saved game ----
  // One-time sync FROM localStorage after mount. Reading in a mount effect
  // (rather than in state initializers) keeps the server-rendered HTML and
  // the first client render identical, so static export hydrates cleanly.
  useEffect(() => {
    const s = loadSettings();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(s);
    setQuestions(activeQuestions());
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

  // Pick up admin question edits made in another tab (e.g. /admin/questions)
  // without disturbing a question that is currently on screen.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && screen !== "question") {
        setQuestions(activeQuestions());
      }
    };
    window.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [screen]);

  const paused = game.phase === "paused";
  const activeQuestion = useMemo(
    () =>
      activeBalloon !== null
        ? assignedQuestion(questions, game, activeBalloon)
        : undefined,
    [activeBalloon, questions, game],
  );

  // A session ends when every balloon is used or the configured
  // questions-per-session limit is reached (0 = no limit).
  const sessionComplete = useCallback(
    (g: GameState) =>
      g.poppedBalloons.length >= TOTAL_BALLOONS ||
      (settings.questionsPerSession > 0 &&
        g.outcomes.length >= settings.questionsPerSession),
    [settings.questionsPerSession],
  );

  const hasSavedGame =
    game.poppedBalloons.length > 0 &&
    game.poppedBalloons.length < TOTAL_BALLOONS;

  // ---- Actions ----
  const startGame = useCallback(() => {
    clearState();
    setGame({ ...initialGameState(settings.startingAvatar), phase: "running", startedAt: Date.now() });
    setActiveBalloon(null);
    setResolved(null);
    setShowNext(false);
    setScreen("wall");
    sound.preload();
  }, [settings.startingAvatar]);

  const resumeGame = useCallback(() => {
    setGame((g) => ({ ...g, phase: "running" }));
    setScreen(sessionComplete(game) ? "results" : "wall");
    sound.preload();
  }, [game, sessionComplete]);

  const handlePop = useCallback(
    (n: number) => {
      if (paused) return;
      void sound.play("pop");
      const q = pickQuestionForBalloon(questions, game, settings.questionMode, n);
      setGame((g) => ({
        ...g,
        poppedBalloons: [...g.poppedBalloons, n],
        assignments: q ? { ...g.assignments, [String(n)]: q.id } : g.assignments,
      }));
      if (!q) {
        setToast(`Balloon ${n} has no question available — it was skipped.`);
        window.setTimeout(() => setToast(null), 3500);
        return;
      }
      // Give the burst animation a beat before the question card appears.
      window.setTimeout(() => {
        setActiveBalloon(n);
        setResolved(null);
        setShowNext(false);
        setScreen("question");
      }, 420);
    },
    [paused, questions, game, settings.questionMode],
  );

  const handleResolve = useCallback(
    (correct: boolean, method: ResolveMethod) => {
      if (!activeQuestion || activeBalloon === null) return;
      setResolved({ correct, method });
      setGame((g) => ({
        ...g,
        correctCount: g.correctCount + (correct ? 1 : 0),
        incorrectCount: g.incorrectCount + (correct ? 0 : 1),
        nextAvatar: otherGender(g.nextAvatar),
        outcomes: [
          ...g.outcomes,
          {
            balloonNumber: activeBalloon,
            questionId: activeQuestion.id,
            category: activeQuestion.category,
            correct,
            method,
            answeredAt: Date.now(),
          },
        ],
      }));
      window.setTimeout(
        () => void sound.play(correct ? "correct" : "wrong"),
        correct ? 120 : 750,
      );
      if (correct && settings.confettiEnabled) {
        window.setTimeout(() => setConfettiFire((n) => n + 1), 200);
      }
      if (settings.avatarVideosEnabled) {
        const clip = pickClip(
          game.nextAvatar,
          correct ? "correct" : "wrong",
          game.outcomes.length,
        );
        window.setTimeout(() => setAvatarClip(clip), correct ? 700 : 1500);
      } else {
        setShowNext(true);
      }
    },
    [
      activeQuestion,
      activeBalloon,
      game.nextAvatar,
      game.outcomes.length,
      settings.avatarVideosEnabled,
      settings.confettiEnabled,
    ],
  );

  const handleAvatarDone = useCallback(() => {
    // The mascot stays visible (held by the overlay) until Next Participant.
    setShowNext(true);
  }, []);

  const handleNext = useCallback(() => {
    setActiveBalloon(null);
    setResolved(null);
    setShowNext(false);
    setAvatarClip(null);
    setScreen(sessionComplete(game) ? "results" : "wall");
  }, [game, sessionComplete]);

  const handleSkipQuestion = useCallback(() => {
    // Damaged question: balloon stays used but no score is recorded.
    setActiveBalloon(null);
    setResolved(null);
    setShowNext(false);
    setAvatarClip(null);
    setShowAdmin(false);
    setScreen(sessionComplete(game) ? "results" : "wall");
  }, [game, sessionComplete]);

  const resetGame = useCallback(() => {
    clearState();
    setGame({ ...initialGameState(settings.startingAvatar), phase: "running", startedAt: Date.now() });
    setActiveBalloon(null);
    setResolved(null);
    setShowNext(false);
    setAvatarClip(null);
    setShowAdmin(false);
    setScreen("wall");
  }, [settings.startingAvatar]);

  const resetScore = useCallback(() => {
    setGame((g) => ({
      ...g,
      correctCount: 0,
      incorrectCount: 0,
      outcomes: [],
    }));
  }, []);

  const patchSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  if (!hydrated) {
    return (
      <main className="flex h-screen items-center justify-center">
        <p className="text-2xl font-black text-ren-navy">Loading…</p>
      </main>
    );
  }

  return (
    <main className="relative flex h-screen w-full flex-col overflow-hidden">
      <BrandHeader showTitle={screen !== "opening"} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
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
                totalBalloons={TOTAL_BALLOONS}
                popped={game.poppedBalloons}
                locked={paused || game.phase === "idle"}
                onPop={handlePop}
              />
            ) : activeQuestion && activeBalloon !== null ? (
              <QuestionScreen
                key={activeBalloon}
                question={activeQuestion}
                balloonNumber={activeBalloon}
                timerEnabled={settings.timerEnabled}
                timerDuration={settings.timerDuration}
                secondAttemptMode={settings.secondAttemptMode}
                paused={paused}
                resolved={resolved}
                showNext={showNext}
                avatarActive={avatarClip !== null}
                onResolve={handleResolve}
                onNext={handleNext}
              />
            ) : null}
          </>
        )}

        {screen === "results" && (
          <ResultsScreen
            state={game}
            questions={questions}
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
          onDone={handleAvatarDone}
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
        <div className="fixed bottom-6 left-1/2 z-[95] -translate-x-1/2 rounded-2xl bg-ren-navy px-6 py-3 text-lg font-bold text-white shadow-panel">
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
            handleResolve(correct, correct ? "admin-correct" : "admin-wrong");
          }}
          onSkipQuestion={handleSkipQuestion}
          onReturnToWall={() => {
            setShowAdmin(false);
            handleNext();
          }}
        />
      )}
    </main>
  );
}
