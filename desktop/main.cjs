/*
 * NAPE 2026 Geoscience Games — standalone macOS app.
 *
 * Everything the game needs is inside this app: the static export lives in
 * ./app/out and is served through a private nape:// scheme (with HTTP-style
 * Range support so video/audio seek), so no web server, internet connection,
 * Vercel or GitHub is involved. The nape://app origin is stable, so saved
 * game progress (localStorage) survives quitting and relaunching.
 *
 * The app never talks to the network: any http(s) request is cancelled, and
 * links to external sites (e.g. photo credits) open in the default browser.
 */
const { app, BrowserWindow, protocol, shell, session } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const OUT = path.join(__dirname, "app", "out");
const SCHEME = "nape";
const START_URL = `${SCHEME}://app/`;

// Autoplay for mascot videos / sound without a prior click.
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
// Test hook: make every DNS lookup fail, i.e. a machine with no internet at all.
if (process.env.NAPE_NO_NETWORK === "1") {
  app.commandLine.appendSwitch("host-resolver-rules", "MAP * ~NOTFOUND");
  app.commandLine.appendSwitch("proxy-server", "direct://");
}

/** URLs the app tried to load from outside itself (always blocked). Used by tests. */
globalThis.__externalRequests = [];

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true },
  },
]);

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".mp4": "video/mp4", ".webm": "video/webm", ".wav": "audio/wav", ".mp3": "audio/mpeg",
  ".webmanifest": "application/manifest+json", ".woff2": "font/woff2", ".ico": "image/x-icon",
};

function resolveFile(urlPath) {
  const rel = decodeURIComponent(urlPath).replace(/^\/+/, "");
  const base = path.resolve(OUT, rel);
  if (base !== OUT && !base.startsWith(OUT + path.sep)) return null; // no path traversal
  const candidates = [base, `${base}.html`, path.join(base, "index.html")];
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isFile()) return c;
    } catch {
      /* try next */
    }
  }
  return null;
}

function serve(request) {
  const url = new URL(request.url);
  const file = resolveFile(url.pathname);
  if (!file) return new Response("Not found", { status: 404 });

  const size = fs.statSync(file).size;
  const headers = {
    "Content-Type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-cache",
  };
  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers: { ...headers, "Content-Length": String(size) } });
  }
  const data = fs.readFileSync(file);
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") || "");
  if (range) {
    let start;
    let end;
    if (range[1] === "") {
      start = Math.max(0, size - Number(range[2]));
      end = size - 1;
    } else {
      start = Number(range[1]);
      end = range[2] === "" ? size - 1 : Math.min(Number(range[2]), size - 1);
    }
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    return new Response(data.subarray(start, end + 1), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(data, { status: 200, headers: { ...headers, "Content-Length": String(size) } });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#fbf9f4",
    title: "NAPE 2026 Geoscience Games",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      autoplayPolicy: "no-user-gesture-required",
    },
  });
  win.once("ready-to-show", () => win.show());
  if (process.env.NAPE_FULLSCREEN === "1") win.setFullScreen(true);

  // Links to external sites (photo credits) open in the default browser, never in the game.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(`${SCHEME}://`)) {
      event.preventDefault();
      if (/^https?:/i.test(url)) void shell.openExternal(url);
    }
  });
  void win.loadURL(START_URL);
  return win;
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    protocol.handle(SCHEME, serve);

    // Belt and braces: the game makes no outside requests; cancel any that appear.
    session.defaultSession.webRequest.onBeforeRequest({ urls: ["http://*/*", "https://*/*", "ws://*/*", "wss://*/*"] }, (details, callback) => {
      globalThis.__externalRequests.push(details.url);
      callback({ cancel: true });
    });

    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => app.quit());
}
