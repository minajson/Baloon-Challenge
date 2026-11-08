/*
 * Offline service worker — NAPE 2026 Geoscience Games.
 *
 * Goal: after one online visit the whole game runs with no internet at all.
 *
 *  - The build writes /offline-manifest.json listing EVERY file of the static
 *    export (HTML, JS/CSS bundles, data, icons, photos, illustrations, audio,
 *    video). `__OFFLINE_VERSION__` is stamped by scripts/build-offline-manifest.mjs
 *    with a hash of that list, so each deployment gets its own cache.
 *  - Install: download the complete set into the versioned cache. If ANY file
 *    fails, installation fails — so a service worker only ever becomes active
 *    with a complete cache, and an older complete cache is never replaced by
 *    a partial one.
 *  - Fetch: cache-first for everything in the manifest (ignoring query
 *    strings). Page navigations fall back to the cached app shell. Range
 *    requests (video/audio seeking) are answered with proper 206 responses,
 *    which Safari requires.
 *  - Update: a new version installs in the background and WAITS; it takes over
 *    the next time the app is closed and reopened (or when the facilitator
 *    chooses "Apply update" in Admin), so a running game never mixes old
 *    pages with new bundles.
 *  - Older caches are deleted on activation.
 */
const VERSION = "__OFFLINE_VERSION__";
const PREFIX = "nape-games-";
const CACHE = `${PREFIX}${VERSION}`;
const MANIFEST_URL = "/offline-manifest.json";
const CONCURRENCY = 6;
const RETRIES = 2;

self.addEventListener("install", (event) => {
  event.waitUntil(
    precacheEverything().catch(async (err) => {
      // Never leave a half-filled cache behind; the previous version stays active.
      await caches.delete(CACHE);
      throw err;
    }),
  );
});

async function fetchOk(url) {
  let lastError;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { cache: "reload" });
      if (res.ok) return res;
      lastError = new Error(`${res.status} ${url}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

async function precacheEverything() {
  const manifestRes = await fetchOk(MANIFEST_URL);
  const manifest = await manifestRes.clone().json();
  if (manifest.version !== VERSION) {
    // The worker and the manifest come from different deployments — retry later.
    throw new Error(`manifest ${manifest.version} does not match worker ${VERSION}`);
  }
  const cache = await caches.open(CACHE);
  await cache.put(MANIFEST_URL, manifestRes);

  const queue = [...manifest.files];
  const worker = async () => {
    while (queue.length > 0) {
      const file = queue.shift();
      const res = await fetchOk(file.url);
      await cache.put(file.url, res);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (k) =>
              k !== CACHE &&
              (k.startsWith(PREFIX) ||
                k.startsWith("balloon-challenge-") ||
                k.startsWith("nape-geoscience-games-")),
          )
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data && event.data.type === "GET_VERSION" && event.ports[0]) {
    event.ports[0].postMessage({ version: VERSION });
  }
});

/** Cache key for a page navigation: /index.html and trailing slashes map to the route. */
function routeKey(url) {
  let path = url.pathname;
  if (path.endsWith("/index.html")) path = path.slice(0, -"index.html".length);
  if (path.endsWith(".html")) path = path.slice(0, -5);
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return new Request(`${url.origin}${path || "/"}`);
}

async function rangeResponse(request, response) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") || "");
  if (!match) return response;
  const buffer = await response.arrayBuffer();
  const size = buffer.byteLength;
  let start;
  let end;
  if (match[1] === "") {
    // Suffix range: the last N bytes.
    start = Math.max(0, size - Number(match[2]));
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
  }
  if (start >= size || start > end) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${size}` },
    });
  }
  return new Response(buffer.slice(start, end + 1), {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

async function handle(request) {
  const url = new URL(request.url);
  const cache = await caches.open(CACHE);
  const isNavigation = request.mode === "navigate";

  // ignoreVary: hosts add "Vary: Accept-Encoding", which would otherwise make
  // a stored response miss for a request carrying real browser headers.
  const MATCH = { ignoreSearch: true, ignoreVary: true };
  let cached = await cache.match(isNavigation ? routeKey(url) : request, MATCH);
  if (!cached && isNavigation) {
    cached = await cache.match(routeKey(new URL("/", url.origin)), MATCH);
  }

  if (cached) {
    return request.headers.has("range") ? rangeResponse(request, cached) : cached;
  }

  // Not part of the offline set (should not happen during gameplay).
  try {
    return await fetch(request);
  } catch {
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/sw.js") return; // the browser manages worker updates itself
  event.respondWith(handle(request));
});
