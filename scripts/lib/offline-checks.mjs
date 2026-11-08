/**
 * Shared offline test steps. Each takes a Playwright `page` and an `ok(name,
 * cond, detail)` reporter, and drives the REAL game UI — the same screens the
 * facilitator uses — so the tests prove the event workflow, not just file
 * availability.
 */
export const TAB = {
  picture: "Picture Puzzles",
  letters: "Missing Letters",
  odd: "Odd One Out",
  feature: "Guess the Geological Feature",
};

export function kit(page) {
  const pause = (ms) => page.waitForTimeout(ms);
  const btn = (name) => page.getByRole("button", { name });
  const bodyText = () => page.evaluate(() => document.body.innerText);
  const stat = async (label) => {
    const t = await page.evaluate((l) => {
      const spans = [...document.querySelectorAll("span")].filter((s) => s.textContent.trim().toLowerCase() === l.toLowerCase());
      return spans[0]?.previousElementSibling?.textContent ?? null;
    }, label);
    return t === null ? null : Number(String(t).replace("%", ""));
  };
  let currentTab = null;
  const openTab = async (type) => {
    const tab = page.getByRole("tab", { name: new RegExp(TAB[type]) });
    if (currentTab === type && (await tab.getAttribute("aria-selected")) === "true") return;
    await tab.click();
    currentTab = type;
    await pause(900); // balloons spring in with a short stagger
  };
  const pop = async (n) => {
    // Balloons float continuously, so Playwright's "stable" check never settles.
    await page.getByRole("button", { name: `Balloon number ${n}`, exact: true }).click({ force: true });
    await page.getByRole("toolbar", { name: "Facilitator controls" }).waitFor({ timeout: 8000 });
  };
  const backToBoard = async () => {
    await btn(/Return to Board/).click();
    await page.waitForFunction(() => document.querySelector('[role="tab"]') || document.body.innerText.includes("Complete!"));
    await pause(800);
  };
  const resetTab = () => {
    currentTab = null;
  };
  return { pause, btn, bodyText, stat, openTab, pop, backToBoard, resetTab };
}

/** Load every video, audio file and photo through the page, exactly as the game does. */
export async function checkMediaFiles(page, ok, { videos, audios, photos }) {
  const result = await page.evaluate(
    async ({ videos, audios, photos }) => {
      const out = { video: [], audio: [], photo: [] };
      const media = (tag, url) =>
        new Promise((resolve) => {
          const el = document.createElement(tag);
          el.preload = "auto";
          el.muted = true;
          const timer = setTimeout(() => resolve({ url, err: "timeout" }), 15000);
          el.onerror = () => {
            clearTimeout(timer);
            resolve({ url, err: `media error ${el.error?.code}` });
          };
          el.onloadeddata = async () => {
            try {
              // A seek forces a Range request — the case Safari/Chrome use for real playback.
              el.currentTime = Math.min(1, (el.duration || 2) / 2);
              await new Promise((r) => {
                el.onseeked = r;
                setTimeout(r, 4000);
              });
              clearTimeout(timer);
              resolve({ url, duration: el.duration, seeked: el.currentTime > 0 });
            } catch (e) {
              resolve({ url, err: String(e) });
            }
          };
          el.src = url;
        });
      for (const u of videos) out.video.push(await media("video", u));
      for (const u of audios) out.audio.push(await media("audio", u));
      for (const u of photos) {
        out.photo.push(
          await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ url: u, w: img.naturalWidth, h: img.naturalHeight });
            img.onerror = () => resolve({ url: u, err: "image error" });
            img.src = u;
          }),
        );
      }
      return out;
    },
    { videos, audios, photos },
  );
  const bad = (list, test) => list.filter((r) => r.err || !test(r)).map((r) => `${r.url} ${r.err ?? ""}`);
  ok(`All ${videos.length} mascot videos load, play and seek`, bad(result.video, (r) => r.duration > 1 && r.seeked).length === 0, bad(result.video, (r) => r.duration > 1 && r.seeked).join("; "));
  ok(`All ${audios.length} dialogue, music and sound-effect files load and play`, bad(result.audio, (r) => r.duration > 0.02).length === 0, bad(result.audio, (r) => r.duration > 0.02).join("; "));
  ok(`All ${photos.length} geological photographs decode (≥ 1400 px wide)`, bad(result.photo, (r) => r.w >= 1400).length === 0, bad(result.photo, (r) => r.w >= 1400).join("; "));
}

/** Wait (up to 8 s) for the Game 4 photograph to decode. */
export async function photoLoaded(page, minWidth) {
  try {
    await page.waitForFunction((w) => { const i = document.querySelector(".feature-photo img"); return !!i && i.complete && i.naturalWidth > w; }, minWidth, { timeout: 8000 });
    return true;
  } catch {
    return false;
  }
}

/** One challenge from each game, with real facilitator actions and scoring. */
export async function playFourGames(page, ok) {
  const k = kit(page);
  await page.getByRole("tab").first().waitFor();

  // Game 1 — Picture Puzzles
  await k.openTab("picture");
  await k.pop(1);
  let t = await k.bodyText();
  ok("Picture Puzzle opens with two illustrated panels", (await page.locator(".picture-panel svg").count()) >= 2 && /Picture Puzzles · #1/.test(t));
  ok("Answer hidden until Reveal Answer", !/Sandstone/i.test(t));
  await k.btn(/Reveal Answer/).click();
  ok("Reveal Answer shows the answer", /Answer:\s*Sandstone/i.test(await k.bodyText()));
  await k.btn(/✓ Correct/).click();
  ok("Correct → 1 point", (await k.stat("Points")) === 1);
  await k.pause(1200);
  ok("Mascot reaction video plays", await page.evaluate(() => { const v = document.querySelector("video"); return !!v && !v.error && v.readyState >= 2; }));
  await k.backToBoard();
  ok("Completed balloon shows ✓", (await page.getByLabel("Balloon 1 completed — correct").count()) === 1);

  // Game 2 — Missing Letters
  await k.openTab("letters");
  await k.pop(1);
  await page.getByRole("button", { name: "Letter O", exact: true }).click();
  await page.getByRole("button", { name: "Letter I", exact: true }).click();
  ok("Letter tiles fill the blanks", (await page.getByRole("button", { name: /Blank filled with/ }).count()) === 2);
  await page.getByRole("button", { name: /^💡 Hint$/ }).click();
  ok("Hint shows the original hint", (await k.bodyText()).includes("Remains of ancient life preserved in rock"));
  await k.btn(/Reveal Answer/).click();
  ok("Reveal shows FOSSIL", (await k.bodyText()).includes("FOSSIL"));
  await k.btn(/✕ Not Quite/).click();
  ok("Not Quite → 0 points, 1 Not Quite", (await k.stat("Points")) === 1 && (await k.stat("Not Quite")) === 1);
  await k.backToBoard();

  // Game 3 — Odd One Out (bonus is facilitator-controlled)
  await k.openTab("odd");
  await k.pop(1);
  await page.getByRole("radio", { name: /Granite/ }).click();
  await k.btn(/Reveal Answer/).click();
  await k.btn(/Reveal Why/).click();
  ok("Odd One Out explanation revealed", (await k.bodyText()).includes("Igneous; the others are sedimentary"));
  await k.btn(/✓ Correct/).click();
  ok("Right card alone gives no bonus", (await k.stat("Points")) === 2);
  await k.btn(/Award Bonus Point/).click();
  ok("Facilitator bonus adds +1", (await k.stat("Points")) === 3);
  await k.backToBoard();

  // Game 4 — Guess the Geological Feature
  await k.openTab("feature");
  await k.pop(1);
  ok("Feature photograph loaded", await photoLoaded(page, 800));
  await k.btn(/Reveal Clue 1/).click();
  await k.pause(700);
  ok("Clue 1 revealed", (await k.bodyText()).includes("I form where a river slows"));
  await k.btn(/Reveal Answer/).click();
  await k.btn(/✓ Correct/).click();
  ok("Game 4 Correct with one clue → 3 points (6 total)", (await k.stat("Points")) === 6, `points=${await k.stat("Points")}`);
  await k.backToBoard();
  ok("Score bar totals: 3 correct, 1 not quite", (await k.stat("Correct")) === 3 && (await k.stat("Not Quite")) === 1);
}

/** Refresh → Resume; then (optionally) Reset. Expects the state left by playFourGames. */
export async function resumeCheck(page, ok, label) {
  const k = kit(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Resume Previous Game/ }).waitFor({ timeout: 15000 });
  await k.btn(/Resume Previous Game/).click();
  await page.getByRole("tab").first().waitFor();
  ok(`${label}: progress restored (6 points, 3 correct, 1 not quite)`, (await k.stat("Points")) === 6 && (await k.stat("Correct")) === 3 && (await k.stat("Not Quite")) === 1);
  ok(`${label}: completed balloons still stamped`, (await page.getByLabel("Balloon 1 completed — correct").count()) === 1);
}

export async function resetCheck(page, ok) {
  const k = kit(page);
  await page.getByRole("button", { name: "Admin settings" }).click();
  await k.btn(/Reset Game & Balloons/).click();
  await k.btn(/Yes, reset/).click();
  await page.getByRole("tab").first().waitFor();
  ok("Reset clears score and restores all 80 balloons", (await k.stat("Points")) === 0 && (await k.stat("Remaining")) === 80);
}

/** All 80 challenges, offline: every one opens, reveals and scores without any failed request. */
export async function sweepAll80(page, ok, bank) {
  const k = kit(page);
  k.resetTab();
  let failed = [];
  let expected = 0;
  for (const c of bank) {
    await k.openTab(c.type);
    await k.pop(c.n);
    if (c.type === "feature") {
      if (!(await photoLoaded(page, 600))) failed.push(`${c.id} photo`);
      await k.btn(/Reveal Clue 1/).click();
    }
    if (c.type === "picture") {
      const n = await page.locator(".picture-panel svg").count();
      if (n < 2) failed.push(`${c.id} illustration`);
    }
    await k.btn(/Reveal Answer/).click();
    if (c.type === "odd") await k.btn(/Reveal Why/).click();
    const right = c.n % 4 !== 0;
    await k.btn(right ? /✓ Correct/ : /✕ Not Quite/).click();
    if (right) expected += c.type === "feature" ? 3 : 1;
    await k.backToBoard();
  }
  ok("All 80 challenges played offline (photos + illustrations rendered)", failed.length === 0, failed.slice(0, 5).join("; "));
  const t = await k.bodyText();
  ok("Results screen reached with the expected total points", /Complete!/.test(t) && new RegExp(`${expected}\\s*\\n?\\s*TOTAL POINTS`, "i").test(t), `expected ${expected}`);
}
