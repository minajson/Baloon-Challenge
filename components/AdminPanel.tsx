"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import type { AvatarGender, GamePhase, GameSettings, GameState } from "@/lib/types";
import { importQuestionsCsv, exportResultsCsv, downloadFile } from "@/lib/csv";
import { saveCustomQuestions, clearCustomQuestions } from "@/lib/storage";
import { accuracyPercent } from "@/lib/questions";

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
  onQuestionsImported: (count: number) => void;
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
  const [unlocked, setUnlocked] = useState(settings.adminPin === "");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [confirmReset, setConfirmReset] = useState<null | "game" | "score">(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const tryUnlock = () => {
    if (pinInput === settings.adminPin) {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  const handleCsvFile = async (file: File) => {
    const text = await file.text();
    const { questions, errors } = importQuestionsCsv(text);
    if (questions.length > 0) {
      saveCustomQuestions(questions);
      props.onQuestionsImported(questions.length);
      setImportMessage(
        `Imported ${questions.length} questions.${errors.length ? ` ${errors.length} row issue(s) — see console.` : ""}`,
      );
    } else {
      setImportMessage(`Import failed: ${errors[0] ?? "no valid rows."}`);
    }
    if (errors.length) console.warn("CSV import issues:", errors);
  };

  const exportResults = () => {
    downloadFile("pop-the-balloon-results.csv", exportResultsCsv(state.outcomes));
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ren-navy/60 p-4 backdrop-blur-sm"
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
          <h2 className="text-2xl font-black text-ren-navy">⚙ Admin Panel</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin panel"
            className="rounded-xl bg-ren-navy-soft px-3 py-1.5 text-lg font-black text-ren-navy hover:bg-ren-orange hover:text-white"
          >
            ✕
          </button>
        </div>

        {!unlocked ? (
          <div className="mt-6 flex flex-col items-center gap-4 py-8">
            <p className="text-lg font-bold text-ren-navy">Enter admin PIN</p>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
              className={`w-44 rounded-xl border-4 px-4 py-3 text-center text-2xl font-black tracking-[0.4em] ${
                pinError ? "border-alert-red" : "border-ren-navy-soft"
              }`}
              aria-label="Admin PIN"
            />
            {pinError && (
              <p className="font-bold text-alert-red">Wrong PIN — try again.</p>
            )}
            <button
              type="button"
              onClick={tryUnlock}
              className="rounded-xl bg-ren-orange px-6 py-3 text-lg font-black text-white hover:bg-ren-orange-deep"
            >
              Unlock
            </button>
          </div>
        ) : (
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
                <AdminButton tone="navy" onClick={props.onReturnToWall}>
                  🎈 Return to Balloon Wall
                </AdminButton>
                <AdminButton tone="navy" onClick={toggleFullscreen}>
                  ⛶ Full Screen On/Off
                </AdminButton>
              </div>
            </Section>

            {/* Current question overrides */}
            {questionOpen && (
              <Section title="Current Question">
                <div className="flex flex-wrap gap-2">
                  <AdminButton
                    tone="green"
                    disabled={questionResolved}
                    onClick={() => props.onMarkAnswer(true)}
                  >
                    ✓ Mark Correct
                  </AdminButton>
                  <AdminButton
                    tone="red"
                    disabled={questionResolved}
                    onClick={() => props.onMarkAnswer(false)}
                  >
                    ✕ Mark Incorrect
                  </AdminButton>
                  <AdminButton tone="yellow" onClick={props.onSkipQuestion}>
                    ⤼ Skip Damaged Question
                  </AdminButton>
                </div>
              </Section>
            )}

            {/* Timer */}
            <Section title="Timer">
              <div className="flex flex-wrap items-center gap-4">
                <Toggle
                  label="Question timer"
                  checked={settings.timerEnabled}
                  onChange={(v) => onSettingsChange({ timerEnabled: v })}
                />
                <label className="flex items-center gap-2 font-bold text-ren-navy">
                  Duration
                  <select
                    value={settings.timerDuration}
                    onChange={(e) =>
                      onSettingsChange({ timerDuration: Number(e.target.value) })
                    }
                    className="rounded-lg border-2 border-ren-navy-soft px-2 py-1 font-bold"
                  >
                    {[15, 20, 30, 45, 60, 90].map((s) => (
                      <option key={s} value={s}>
                        {s}s
                      </option>
                    ))}
                  </select>
                </label>
                <Toggle
                  label="Second-attempt mode"
                  checked={settings.secondAttemptMode}
                  onChange={(v) => onSettingsChange({ secondAttemptMode: v })}
                />
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

            {/* Avatars */}
            <Section title="Safety Ambassadors">
              <div className="flex flex-wrap items-center gap-2">
                <label className="mr-2 flex items-center gap-2 font-bold text-ren-navy">
                  Starting avatar
                  <select
                    value={settings.startingAvatar}
                    onChange={(e) =>
                      onSettingsChange({
                        startingAvatar: e.target.value as AvatarGender,
                      })
                    }
                    className="rounded-lg border-2 border-ren-navy-soft px-2 py-1 font-bold"
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

            {/* Questions */}
            <Section title="Questions">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleCsvFile(f);
                    e.target.value = "";
                  }}
                />
                <AdminButton tone="navy" onClick={() => fileRef.current?.click()}>
                  ⬆ Import Questions (CSV)
                </AdminButton>
                <AdminButton
                  tone="navy"
                  onClick={() => {
                    clearCustomQuestions();
                    props.onQuestionsImported(0);
                    setImportMessage("Restored the built-in 50 questions.");
                  }}
                >
                  ↺ Restore Default Questions
                </AdminButton>
                <a
                  href="/questions-template.csv"
                  download
                  className="rounded-xl bg-ren-navy-soft px-4 py-2 font-black text-ren-navy hover:bg-ren-navy hover:text-white"
                >
                  ⬇ CSV Template
                </a>
              </div>
              {importMessage && (
                <p className="mt-2 font-bold text-safety-green">{importMessage}</p>
              )}
            </Section>

            {/* Data */}
            <Section title="Score & Data">
              <p className="mb-2 font-semibold text-ren-navy/70">
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
                <div className="mt-3 rounded-2xl bg-alert-red-soft p-4">
                  <p className="font-black text-alert-red">
                    {confirmReset === "game"
                      ? "Reset the whole game? All 50 balloons come back and the score clears."
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

            {/* Security */}
            <Section title="Admin PIN">
              <label className="flex items-center gap-2 font-bold text-ren-navy">
                PIN (empty = no PIN)
                <input
                  type="text"
                  defaultValue={settings.adminPin}
                  onBlur={(e) => onSettingsChange({ adminPin: e.target.value.trim() })}
                  className="w-32 rounded-lg border-2 border-ren-navy-soft px-2 py-1 font-black tracking-widest"
                />
              </label>
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
      <h3 className="mb-2 text-sm font-black uppercase tracking-widest text-ren-orange-deep">
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
    <label className="flex cursor-pointer items-center gap-2 font-bold text-ren-navy">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-safety-green" : "bg-ren-navy/25"
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
    green: "bg-safety-green text-white hover:bg-safety-green/85",
    red: "bg-alert-red text-white hover:bg-alert-red/85",
    navy: "bg-ren-navy text-white hover:bg-ren-navy-mid",
    yellow: "bg-warm-yellow text-ren-navy hover:bg-warm-yellow/80",
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
