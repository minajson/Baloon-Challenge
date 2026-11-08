"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { AvatarGender, GamePhase, GameSettings, GameState } from "@/lib/types";
import { exportResultsCsv, downloadFile } from "@/lib/csv";
import { accuracyPercent } from "@/lib/questions";
import OfflineStatus from "./OfflineStatus";

/**
 * Authentication is intentionally disabled: the facilitator panel and the
 * challenge bank open directly, with no PIN or password. To reinstate a
 * gate later, flip this flag and add a PIN check before rendering the
 * panel body.
 */
const ADMIN_AUTH_ENABLED = false;

interface AdminPanelProps {
  settings: GameSettings;
  state: GameState;
  phase: GamePhase;
  questionOpen: boolean;
  questionResolved: boolean;
  onClose: () => void;
  onSettingsChange: (patch: Partial<GameSettings>) => void;
  onStartGame: () => void;
  onPause: () => void;
  onResume: () => void;
  onResetGame: () => void;
  onResetScore: () => void;
  onPreviewAvatar: (gender: AvatarGender, type: "correct" | "wrong") => void;
  onMarkAnswer: (correct: boolean) => void;
  onSkipQuestion: () => void;
  onReturnToWall: () => void;
  onFinishGame: () => void;
}

export default function AdminPanel(props: AdminPanelProps) {
  const {
    settings,
    state,
    phase,
    questionOpen,
    questionResolved,
    onClose,
    onSettingsChange,
  } = props;
  const [confirmReset, setConfirmReset] = useState<null | "game" | "score">(null);
  // ADMIN_AUTH_ENABLED is the future re-entry point for a PIN gate.
  const unlocked = !ADMIN_AUTH_ENABLED;

  const exportResults = () => {
    downloadFile("nape-2026-geoscience-games-results.csv", exportResultsCsv(state.outcomes));
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Admin panel"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-panel"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-ink">⚙ Admin Panel</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin panel"
            className="rounded-xl bg-ink-soft px-3 py-1.5 text-lg font-black text-ink hover:bg-terra hover:text-white"
          >
            ✕
          </button>
        </div>

        {!unlocked ? null : (
          <div className="mt-4 space-y-5">
            {/* Game control */}
            <Section title="Game Control">
              <div className="flex flex-wrap gap-2">
                {phase === "idle" && (
                  <AdminButton tone="green" onClick={props.onStartGame}>
                    ▶ Start Game
                  </AdminButton>
                )}
                {phase === "running" && (
                  <AdminButton tone="yellow" onClick={props.onPause}>
                    ⏸ Pause Game
                  </AdminButton>
                )}
                {phase === "paused" && (
                  <AdminButton tone="green" onClick={props.onResume}>
                    ▶ Resume Game
                  </AdminButton>
                )}
                <AdminButton tone="navy" onClick={props.onFinishGame}>
                  🏁 End Game &amp; View Results
                </AdminButton>
                <AdminButton tone="navy" onClick={props.onReturnToWall}>
                  🎈 Return to Balloon Board
                </AdminButton>
                <AdminButton tone="navy" onClick={toggleFullscreen}>
                  ⛶ Full Screen On/Off
                </AdminButton>
              </div>
            </Section>

            {/* Current challenge */}
            {questionOpen && (
              <Section title="Current Challenge">
                <p className="mb-2 font-semibold text-ink/70">
                  Reveal, mark and award points with the facilitator bar under
                  the challenge. These are overrides.
                </p>
                <div className="flex flex-wrap gap-2">
                  <AdminButton
                    tone="green"
                    disabled={questionResolved}
                    onClick={() => props.onMarkAnswer(true)}
                  >
                    ✓ Mark Correct
                  </AdminButton>
                  <AdminButton
                    tone="yellow"
                    disabled={questionResolved}
                    onClick={() => props.onMarkAnswer(false)}
                  >
                    ✕ Mark Not Quite
                  </AdminButton>
                  <AdminButton tone="yellow" onClick={props.onSkipQuestion}>
                    ⤼ Skip Challenge
                  </AdminButton>
                </div>
              </Section>
            )}

            {/* Timer */}
            <Section title="Timer">
              <div className="flex flex-wrap items-center gap-4">
                <Toggle
                  label="Challenge timer"
                  checked={settings.timerEnabled}
                  onChange={(v) => onSettingsChange({ timerEnabled: v })}
                />
                <label className="flex items-center gap-2 font-bold text-ink">
                  Duration
                  <select
                    value={settings.timerDuration}
                    onChange={(e) =>
                      onSettingsChange({ timerDuration: Number(e.target.value) })
                    }
                    className="rounded-lg border-2 border-ink-soft px-2 py-1 font-bold"
                  >
                    {[15, 20, 30, 45, 60, 90].map((s) => (
                      <option key={s} value={s}>
                        {s}s
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </Section>

            {/* Audio & effects */}
            <Section title="Sound & Effects">
              <div className="flex flex-wrap gap-4">
                <Toggle
                  label="Sound effects"
                  checked={settings.soundEnabled}
                  onChange={(v) => onSettingsChange({ soundEnabled: v })}
                />
                <Toggle
                  label="Avatar videos"
                  checked={settings.avatarVideosEnabled}
                  onChange={(v) => onSettingsChange({ avatarVideosEnabled: v })}
                />
                <Toggle
                  label="Background music"
                  checked={settings.musicEnabled}
                  onChange={(v) => onSettingsChange({ musicEnabled: v })}
                />
                <Toggle
                  label="Confetti"
                  checked={settings.confettiEnabled}
                  onChange={(v) => onSettingsChange({ confettiEnabled: v })}
                />
              </div>
            </Section>

            {/* Offline readiness */}
            <Section title="Offline Mode">
              <OfflineStatus />
            </Section>

            {/* Avatars */}
            <Section title="Game Hosts">
              <div className="flex flex-wrap items-center gap-2">
                <label className="mr-2 flex items-center gap-2 font-bold text-ink">
                  Starting avatar
                  <select
                    value={settings.startingAvatar}
                    onChange={(e) =>
                      onSettingsChange({
                        startingAvatar: e.target.value as AvatarGender,
                      })
                    }
                    className="rounded-lg border-2 border-ink-soft px-2 py-1 font-bold"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>
                <AdminButton tone="navy" onClick={() => props.onPreviewAvatar("male", "correct")}>
                  Preview Male ✓
                </AdminButton>
                <AdminButton tone="navy" onClick={() => props.onPreviewAvatar("male", "wrong")}>
                  Preview Male ✕
                </AdminButton>
                <AdminButton tone="navy" onClick={() => props.onPreviewAvatar("female", "correct")}>
                  Preview Female ✓
                </AdminButton>
                <AdminButton tone="navy" onClick={() => props.onPreviewAvatar("female", "wrong")}>
                  Preview Female ✕
                </AdminButton>
              </div>
            </Section>

            {/* Challenge bank */}
            <Section title="Challenge Bank">
              <div className="flex flex-wrap items-center gap-2">
                {/* prefetch={false}: fetch the route payload at click time so
                    a redeploy between page load and click can't leave a stale
                    prefetched payload that breaks the navigation. */}
                <Link
                  href="/admin/questions"
                  prefetch={false}
                  className="rounded-xl bg-terra px-4 py-2 font-black text-white hover:bg-terra-deep"
                >
                  📋 View All 80 Challenges
                </Link>
              </div>
              <p className="mt-2 text-sm font-semibold text-ink/70">
                Facilitator-only reference with every answer, hint, clue and
                photo credit. Do not show this page to players.
              </p>
            </Section>

            {/* Data */}
            <Section title="Score & Data">
              <p className="mb-2 font-semibold text-ink/70">
                {state.correctCount} correct · {state.incorrectCount} incorrect ·{" "}
                {accuracyPercent(state)}% accuracy ·{" "}
                {state.poppedBalloons.length} balloons used
              </p>
              <div className="flex flex-wrap gap-2">
                <AdminButton tone="navy" onClick={exportResults}>
                  ⬇ Export Event Results
                </AdminButton>
                <AdminButton tone="red" onClick={() => setConfirmReset("score")}>
                  Reset Event Score
                </AdminButton>
                <AdminButton tone="red" onClick={() => setConfirmReset("game")}>
                  Reset Game & Balloons
                </AdminButton>
              </div>
              {confirmReset && (
                <div className="mt-3 rounded-2xl bg-bad-soft p-4">
                  <p className="font-black text-bad">
                    {confirmReset === "game"
                      ? "Reset the whole game? All 80 balloons come back and the score clears."
                      : "Reset the event score? Balloon progress is kept."}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <AdminButton
                      tone="red"
                      onClick={() => {
                        if (confirmReset === "game") props.onResetGame();
                        else props.onResetScore();
                        setConfirmReset(null);
                      }}
                    >
                      Yes, reset
                    </AdminButton>
                    <AdminButton tone="navy" onClick={() => setConfirmReset(null)}>
                      Cancel
                    </AdminButton>
                  </div>
                </div>
              )}
            </Section>

          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-cream p-4">
      <h3 className="mb-2 text-sm font-black uppercase tracking-widest text-terra-deep">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 font-bold text-ink">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-ok" : "bg-ink/25"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
      {label}
    </label>
  );
}

function AdminButton({
  tone,
  onClick,
  disabled,
  children,
}: {
  tone: "green" | "red" | "navy" | "yellow";
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    green: "bg-ok text-white hover:bg-ok/85",
    red: "bg-bad text-white hover:bg-bad/85",
    navy: "bg-ink text-white hover:bg-ink-mid",
    yellow: "bg-sun text-ink hover:bg-sun/80",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2 font-black transition disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
