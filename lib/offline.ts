import { useSyncExternalStore } from "react";

/**
 * Offline readiness for NAPE 2026 Geoscience Games.
 *
 * "Offline Ready" is only reported when EVERY file listed in
 * /offline-manifest.json is actually present in the active service worker's
 * cache (web app) or can be read from the bundled app (desktop app). It is
 * never inferred from navigator.onLine.
 */

export type OfflinePhase =
  | "development"
  | "checking"
  | "preparing"
  | "ready"
  | "incomplete";

export interface OfflineState {
  phase: OfflinePhase;
  /** "web" = installable PWA with a service worker, "desktop" = bundled Mac app. */
  mode: "web" | "desktop";
  total: number;
  cached: number;
  version: string | null;
  totalBytes: number;
  /** Raw connectivity — informational only, never used to decide readiness. */
  online: boolean;
  updateReady: boolean;
  canInstall: boolean;
  message: string;
  checkedAt: number | null;
}

interface ManifestFile {
  url: string;
  size: number;
  hash: string;
}
interface Manifest {
  version: string;
  totalBytes: number;
  files: ManifestFile[];
}

declare global {
  interface Window {
    /** Exposed by the desktop app's preload script. */
    napeDesktop?: { isDesktop: boolean; platform: string; version: string };
  }
}

const PREFIX = "nape-games-";
const MANIFEST_URL = "/offline-manifest.json";
const MATCH = { ignoreSearch: true, ignoreVary: true } as const;

const INITIAL: OfflineState = {
  phase: "checking",
  mode: "web",
  total: 0,
  cached: 0,
  version: null,
  totalBytes: 0,
  online: true,
  updateReady: false,
  canInstall: false,
  message: "Checking offline files…",
  checkedAt: null,
};

let state: OfflineState = INITIAL;
const listeners = new Set<() => void>();
function setState(patch: Partial<OfflineState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useOfflineState(): OfflineState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => INITIAL,
  );
}

let started = false;
let running: Promise<void> | null = null;
let registration: ServiceWorkerRegistration | null = null;
let installPrompt: (Event & { prompt: () => Promise<void> }) | null = null;

const isDesktop = () =>
  typeof window !== "undefined" && window.napeDesktop?.isDesktop === true;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Start offline support. Safe to call repeatedly; runs once per page load. */
export function startOffline(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  const desktop = isDesktop();
  setState({ mode: desktop ? "desktop" : "web", online: navigator.onLine });

  window.addEventListener("online", () => {
    setState({ online: true });
    if (state.phase === "incomplete") void verifyOffline({ repair: true });
  });
  window.addEventListener("offline", () => setState({ online: false }));
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installPrompt = e as typeof installPrompt;
    setState({ canInstall: true });
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    setState({ canInstall: false });
  });

  if (desktop) {
    void verifyOffline({ deep: false });
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    setState({
      phase: "development",
      message: "Offline mode is only available in the production build.",
    });
    return;
  }
  if (!("serviceWorker" in navigator) || !("caches" in window)) {
    setState({
      phase: "incomplete",
      message: "This browser cannot store offline files. Use Chrome, Edge or Safari.",
    });
    return;
  }
  // Ask the browser not to evict the offline files under storage pressure.
  void navigator.storage?.persist?.().catch(() => {});
  void registerWorker().then(() => verifyOffline({ repair: true }));
}

async function registerWorker(): Promise<void> {
  try {
    registration = await navigator.serviceWorker.register("/sw.js");
    watchForUpdates(registration);
  } catch {
    // Reported by verifyOffline (no active worker).
  }
}

function watchForUpdates(reg: ServiceWorkerRegistration) {
  const flag = () => {
    if (reg.waiting && navigator.serviceWorker.controller) {
      setState({ updateReady: true });
    }
  };
  flag();
  reg.addEventListener("updatefound", () => {
    const worker = reg.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed") flag();
    });
  });
}

async function loadManifestFrom(cache: Cache): Promise<Manifest | null> {
  const res = await cache.match(MANIFEST_URL, MATCH);
  return res ? ((await res.json()) as Manifest) : null;
}

/** Ask the ACTIVE worker which version it serves. */
function activeWorkerVersion(reg: ServiceWorkerRegistration): Promise<string | null> {
  return new Promise((resolve) => {
    const worker = reg.active;
    if (!worker) return resolve(null);
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(null), 4000);
    channel.port1.onmessage = (e) => {
      clearTimeout(timer);
      resolve((e.data && e.data.version) || null);
    };
    worker.postMessage({ type: "GET_VERSION" }, [channel.port2]);
  });
}

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (queue.length > 0) await fn(queue.shift() as T);
    }),
  );
}

export interface VerifyOptions {
  /** Download any missing files (needs a connection). */
  repair?: boolean;
  /** Read every cached file back and compare its size with the manifest. */
  deep?: boolean;
}

/** Check (and optionally repair) the offline copy. Updates the shared state. */
export function verifyOffline(options: VerifyOptions = {}): Promise<void> {
  if (running) return running;
  running = (async () => {
    try {
      if (isDesktop()) await verifyDesktop();
      else await verifyWeb(options);
    } catch (err) {
      setState({
        phase: "incomplete",
        message: `Offline check failed: ${err instanceof Error ? err.message : String(err)}`,
        checkedAt: Date.now(),
      });
    } finally {
      running = null;
    }
  })();
  return running;
}

async function verifyDesktop() {
  setState({ phase: "checking", message: "Checking bundled files…" });
  const res = await fetch(MANIFEST_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("manifest missing from the app bundle");
  const manifest = (await res.json()) as Manifest;
  let ok = 0;
  const missing: string[] = [];
  setState({ total: manifest.files.length, cached: 0, version: manifest.version, totalBytes: manifest.totalBytes });
  await mapLimit(manifest.files, 8, async (f) => {
    try {
      const r = await fetch(f.url, { method: "HEAD", cache: "no-store" });
      if (r.ok) ok += 1;
      else missing.push(f.url);
    } catch {
      missing.push(f.url);
    }
    if (ok % 10 === 0) setState({ cached: ok });
  });
  setState({
    cached: ok,
    phase: missing.length === 0 ? "ready" : "incomplete",
    message:
      missing.length === 0
        ? "Standalone app — every game file is bundled inside it."
        : `${missing.length} bundled file(s) are missing: ${missing.slice(0, 3).join(", ")}`,
    checkedAt: Date.now(),
  });
}

async function verifyWeb({ repair = false, deep = false }: VerifyOptions) {
  setState({ phase: "checking", message: "Checking offline files…" });

  // 1. A service worker must be registered and active.
  let reg = registration ?? (await navigator.serviceWorker.getRegistration()) ?? null;
  if (!reg) {
    await registerWorker();
    reg = registration;
  }
  if (!reg) {
    setState({
      phase: "incomplete",
      message: "The offline engine could not start. Connect to the internet and press Retry.",
      checkedAt: Date.now(),
    });
    return;
  }

  if (!reg.active) {
    // First visit: the worker is still downloading the files. Show progress.
    setState({ phase: "preparing", message: "Downloading game files for offline use…" });
    let network: Manifest | null = null;
    try {
      const r = await fetch(MANIFEST_URL, { cache: "no-store" });
      if (r.ok) network = (await r.json()) as Manifest;
    } catch {
      /* offline during first visit */
    }
    if (network) {
      setState({ total: network.files.length, version: network.version, totalBytes: network.totalBytes });
    }
    const deadline = Date.now() + 240_000;
    while (!reg.active && Date.now() < deadline) {
      if (!reg.installing && !reg.waiting) break; // install failed (redundant)
      if (network) {
        const c = await caches.open(PREFIX + network.version);
        setState({ cached: (await c.keys()).length });
      }
      await sleep(700);
    }
    if (!reg.active) {
      setState({
        phase: "incomplete",
        message: network
          ? "The download did not finish. Stay connected and press Retry."
          : "No connection — connect to the internet once to prepare offline files.",
        checkedAt: Date.now(),
      });
      return;
    }
  }

  // 2. Which version does the active worker serve? Use that version's cache.
  const version = await activeWorkerVersion(reg);
  if (!version) throw new Error("the offline engine did not answer");
  const cache = await caches.open(PREFIX + version);
  const manifest = await loadManifestFrom(cache);
  if (!manifest) {
    setState({
      phase: "incomplete",
      version,
      message: "The offline file list is missing. Press Retry while connected.",
      checkedAt: Date.now(),
    });
    return;
  }
  setState({ total: manifest.files.length, version, totalBytes: manifest.totalBytes });
  if (reg.waiting && navigator.serviceWorker.controller) setState({ updateReady: true });

  // 3. Every file must be in the cache (and, for a deep check, complete).
  const deepKey = `nape.offline.deep.${version}`;
  const needDeep = deep || localStorage.getItem(deepKey) !== "ok";
  const findMissing = async (): Promise<ManifestFile[]> => {
    const missing: ManifestFile[] = [];
    let present = 0;
    await mapLimit(manifest.files, 6, async (f) => {
      const res = await cache.match(f.url, MATCH);
      let good = !!res;
      if (res && needDeep) {
        // /media files are served byte-for-byte as built. Framework files can
        // differ by a few bytes between the build and the host, so for those
        // only require that the stored copy is not empty.
        const size = (await res.blob()).size;
        good = f.url.startsWith("/media/") ? size === f.size : size > 0;
      }
      if (good) present += 1;
      else missing.push(f);
      if (present % 8 === 0) setState({ cached: present });
    });
    setState({ cached: present });
    return missing;
  };

  let missing = await findMissing();

  // 4. Repair: download whatever is missing, then check again.
  if (missing.length > 0 && repair && navigator.onLine) {
    setState({ phase: "preparing", message: `Downloading ${missing.length} missing file(s)…` });
    let fixed = 0;
    await mapLimit(missing, 4, async (f) => {
      try {
        const res = await fetch(f.url, { cache: "reload" });
        if (res.ok) {
          await cache.put(f.url, res);
          fixed += 1;
          setState({ cached: manifest.files.length - missing.length + fixed });
        }
      } catch {
        /* reported below */
      }
    });
    missing = await findMissing();
  }

  if (missing.length === 0) {
    if (needDeep) localStorage.setItem(deepKey, "ok");
    setState({
      phase: "ready",
      cached: manifest.files.length,
      message: "Every game file is stored on this computer.",
      checkedAt: Date.now(),
    });
  } else {
    localStorage.removeItem(deepKey);
    setState({
      phase: "incomplete",
      message: `${missing.length} of ${manifest.files.length} files are missing: ${missing
        .slice(0, 3)
        .map((f) => f.url)
        .join(", ")}${missing.length > 3 ? "…" : ""}. Connect to the internet and press Verify Now to download them.`,
      checkedAt: Date.now(),
    });
  }
}

/** Throw the offline engine away and start again (used by the Retry button). */
export async function retryOfflineSetup(): Promise<void> {
  if (isDesktop()) return verifyOffline({ deep: true });
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
  registration = null;
  setState({ phase: "preparing", message: "Restarting the offline download…", cached: 0 });
  await registerWorker();
  return verifyOffline({ repair: true, deep: true });
}

/** Activate a downloaded update now (the page reloads; game progress is kept). */
export function applyOfflineUpdate(): void {
  const waiting = registration?.waiting;
  if (!waiting) return;
  navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), {
    once: true,
  });
  waiting.postMessage({ type: "SKIP_WAITING" });
}

export async function promptInstall(): Promise<void> {
  if (!installPrompt) return;
  await installPrompt.prompt();
  installPrompt = null;
  setState({ canInstall: false });
}
