"use client";

import {
  applyOfflineUpdate,
  promptInstall,
  retryOfflineSetup,
  useOfflineState,
  verifyOffline,
  type OfflinePhase,
} from "@/lib/offline";

const LABEL: Record<OfflinePhase, string> = {
  ready: "Offline Ready",
  preparing: "Preparing Offline Files",
  checking: "Checking Offline Files",
  incomplete: "Offline Files Incomplete",
  development: "Offline Unavailable (dev build)",
};
const DOT: Record<OfflinePhase, string> = {
  ready: "bg-ok",
  preparing: "bg-sun animate-pulse",
  checking: "bg-sun animate-pulse",
  incomplete: "bg-bad",
  development: "bg-ink/30",
};

/** Small coloured dot reflecting real offline readiness (used on the opening screen). */
export function OfflineDot() {
  const s = useOfflineState();
  return (
    <span
      role="img"
      aria-label={LABEL[s.phase]}
      title={LABEL[s.phase]}
      data-offline-phase={s.phase}
      className={`inline-block h-2.5 w-2.5 rounded-full ${DOT[s.phase]}`}
    />
  );
}

/** Admin-panel section showing whether the game can run with no internet. */
export default function OfflineStatus() {
  const s = useOfflineState();
  const busy = s.phase === "checking" || s.phase === "preparing";
  const pct = s.total > 0 ? Math.min(100, Math.round((s.cached / s.total) * 100)) : 0;
  const mb = s.totalBytes ? (s.totalBytes / 1024 / 1024).toFixed(0) : null;

  return (
    <div data-offline-phase={s.phase} data-testid="offline-status">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`h-3.5 w-3.5 rounded-full ${DOT[s.phase]}`} aria-hidden="true" />
        <span className="text-lg font-black text-ink">{LABEL[s.phase]}</span>
        {s.total > 0 && (
          <span className="rounded-full bg-white px-2.5 py-0.5 text-sm font-bold tabular-nums text-ink/70">
            {s.cached} / {s.total} files{mb ? ` · ${mb} MB` : ""}
          </span>
        )}
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-ink/55">
          {s.mode === "desktop" ? "Standalone app" : "Web app"} ·{" "}
          {s.online ? "connected" : "no connection"}
        </span>
      </div>

      {busy && s.total > 0 && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-sun transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <p className="mt-2 text-sm font-semibold text-ink/70">{s.message}</p>
      {s.version && (
        <p className="mt-0.5 text-xs font-semibold text-ink/45">Version {s.version}</p>
      )}
      {s.updateReady && (
        <p className="mt-2 rounded-xl bg-sun-soft px-3 py-2 text-sm font-bold text-terra-deep">
          A newer version has been downloaded. It starts automatically the next time the app
          is closed and reopened — or apply it now (game progress is kept).
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || s.phase === "development"}
          onClick={() => void verifyOffline({ deep: true, repair: true })}
          className="rounded-xl bg-ink px-4 py-2 font-black text-white transition hover:bg-ink-mid disabled:opacity-40"
        >
          ↻ Verify Now
        </button>
        {s.phase === "incomplete" && s.mode === "web" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void retryOfflineSetup()}
            className="rounded-xl bg-terra px-4 py-2 font-black text-white transition hover:bg-terra-deep disabled:opacity-40"
          >
            ⬇ Retry Download
          </button>
        )}
        {s.canInstall && (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="rounded-xl bg-ok px-4 py-2 font-black text-white transition hover:bg-ok/90"
          >
            ⊕ Install App
          </button>
        )}
        {s.updateReady && (
          <button
            type="button"
            onClick={applyOfflineUpdate}
            className="rounded-xl bg-sun px-4 py-2 font-black text-ink transition hover:bg-sun/85"
          >
            ⟳ Apply Update Now
          </button>
        )}
      </div>
    </div>
  );
}
