/*
 * Offline service worker for the Pop the Balloon Challenge.
 *
 * Strategy:
 *  - Install: precache the app shell and every game asset (logos, mascots,
 *    mascot videos, ElevenLabs audio, sound effects, music) so the whole
 *    game plays with no internet after one online visit.
 *  - Navigations: network-first with cache fallback, so updates arrive when
 *    online but the game still loads when offline.
 *  - Immutable/static assets (/_next/static hashed bundles, /media files):
 *    cache-first with fill, which also captures question images.
 *  - Everything else — importantly Next's UN-hashed client-navigation
 *    payloads (e.g. /admin/questions.txt) — network-first with cache
 *    fallback. Serving those cache-first breaks <Link> navigation after a
 *    redeploy (a stale payload from the previous build makes clicks like
 *    "Manage Questions" silently fail).
 */
const VERSION = "balloon-challenge-v2";
const CACHE = `${VERSION}`;

/** Only these are safe to serve cache-first: content-addressed or static. */
const CACHE_FIRST = /^\/(_next\/static\/|media\/)/;

const PRECACHE = [
  "/",
  "/admin/questions/",
  "/manifest.webmanifest",
  "/questions-template.csv",
  // Branding
  "/media/images/renaissance-logo.png",
  "/media/images/spe_logo.png",
  // Mascot master images
  "/media/images/RENAISSANCE_MALE_MASCOT_MASTER.png",
  "/media/images/RENAISSANCE_FEMALE_MASCOT_MASTER.png",
  // Mascot videos
  "/media/avatars/male/male_correct_01.mp4",
  "/media/avatars/male/male_correct_02.mp4",
  "/media/avatars/male/male_wrong_01.mp4",
  "/media/avatars/male/male_wrong_02.mp4",
  "/media/avatars/male/male_final_celebration.mp4",
  "/media/avatars/female/female_correct_01.mp4",
  "/media/avatars/female/female_correct_02.mp4",
  "/media/avatars/female/female_wrong_01.mp4",
  "/media/avatars/female/female_wrong_02.mp4",
  "/media/avatars/female/female_final_celebration.mp4",
  // Mascot voice (ElevenLabs)
  "/media/audio/male_correct.wav",
  "/media/audio/male_wrong.wav",
  "/media/audio/male_final.wav",
  "/media/audio/female_correct.wav",
  "/media/audio/female_wrong.wav",
  "/media/audio/female_final.wav",
  // Music + sound effects
  "/media/audio/background-music.wav",
  "/media/sfx/pop.wav",
  "/media/sfx/correct.wav",
  "/media/sfx/wrong.wav",
  "/media/sfx/tick.wav",
  "/media/sfx/fanfare.wav",
  "/media/sfx/click.wav",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Tolerate individual failures (e.g. optional .mp3 music) — one missing
      // file must not abort the whole offline preparation.
      Promise.allSettled(PRECACHE.map((url) => cache.add(url))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: try the network, fall back to the cached page / shell.
  // The fallback also tries the trailing-slash form so a hard navigation
  // to /admin/questions finds the precached /admin/questions/ offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(async () => {
          const cached =
            (await caches.match(request)) ??
            (await caches.match(url.pathname)) ??
            (await caches.match(
              url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`,
            )) ??
            (await caches.match("/"));
          return (
            cached ??
            new Response(
              "<h1>Offline</h1><p>This page has not been cached yet.</p>",
              { headers: { "Content-Type": "text/html" }, status: 503 },
            )
          );
        }),
    );
    return;
  }

  // Hashed bundles and media: cache-first, filling the cache on first fetch.
  if (CACHE_FIRST.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Everything else (RSC navigation payloads, manifest, CSV template…):
  // network-first so a redeploy is picked up immediately; cached copy only
  // when genuinely offline.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request, { ignoreSearch: true });
        return cached ?? Response.error();
      }),
  );
});
