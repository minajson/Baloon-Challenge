"use client";

import { useEffect, useSyncExternalStore } from "react";

function subscribeConnectivity(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/**
 * Registers the service worker (production builds only — it would fight the
 * dev server's hot reload) and shows a small, unobtrusive connectivity badge.
 * Connectivity changes never interrupt the game: the badge just updates.
 */
export default function PwaStatus() {
  // Server snapshot "online" keeps SSR output stable; the client corrects it.
  const online = useSyncExternalStore(
    subscribeConnectivity,
    () => navigator.onLine,
    () => true,
  );

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline caching is best-effort; the game still works without it.
      });
    }
  }, []);

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed bottom-2 left-2 z-[70] flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow ${
        online
          ? "bg-white/80 text-ok"
          : "bg-ink/85 text-sun"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          online ? "bg-ok" : "bg-sun"
        }`}
      />
      {online ? "Online" : "Offline Mode"}
    </div>
  );
}
