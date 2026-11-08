"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORIES, CHALLENGES } from "@/data/challenges";
import { PHOTO_CREDITS } from "@/data/photos";
import type { Challenge, ChallengeType } from "@/lib/types";
import BrandHeader from "@/components/BrandHeader";

/**
 * Challenge Bank — /admin/questions
 *
 * A facilitator-only, read-only reference listing all 80 NAPE challenges with
 * their answers, hints, explanations, clues and photo credits. The challenge
 * content is the authoritative NAPE 2026 Geoscience Games document and is
 * not editable from the app. Never show this page to players.
 */

function detail(c: Challenge): { prompt: string; extra: string } {
  switch (c.type) {
    case "picture":
      return { prompt: `${c.panelA}  +  ${c.panelB}`, extra: "" };
    case "letters":
      return { prompt: c.pattern, extra: `Hint: ${c.hint}` };
    case "odd":
      return { prompt: c.options.join(" · "), extra: `Why: ${c.why}` };
    case "feature":
      return {
        prompt: c.clues.map((t, i) => `${i + 1}. ${t}`).join("  "),
        extra: `Photo brief: ${c.photoBrief}`,
      };
  }
}

export default function ChallengeBankPage() {
  const [tab, setTab] = useState<ChallengeType | "all">("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CHALLENGES.filter((c) => tab === "all" || c.type === tab).filter(
      (c) => {
        if (!q) return true;
        const d = detail(c);
        return `${c.answer} ${d.prompt} ${d.extra}`.toLowerCase().includes(q);
      },
    );
  }, [tab, search]);

  return (
    <main className="min-h-screen bg-cream/60 pb-16">
      <BrandHeader />
      <div className="mx-auto w-full max-w-[1600px] px-4 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-ink px-4 py-2 font-black text-white hover:bg-ink-mid"
          >
            ← Back to Game
          </Link>
          <h2 className="text-2xl font-black text-ink lg:text-3xl">
            Challenge Bank · {CHALLENGES.length} challenges
          </h2>
          <span className="rounded-full bg-bad-soft px-3 py-1 text-sm font-black text-bad">
            Facilitator only — shows answers
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`rounded-full px-4 py-1.5 font-black ${
              tab === "all" ? "bg-ink text-white" : "bg-white text-ink shadow-panel"
            }`}
          >
            All ({CHALLENGES.length})
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setTab(c.id)}
              className={`rounded-full px-4 py-1.5 font-black ${
                tab === c.id ? "text-white" : "bg-white text-ink shadow-panel"
              }`}
              style={tab === c.id ? { background: c.accent } : undefined}
            >
              {c.emoji} {c.name}
            </button>
          ))}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search answers, clues, hints…"
            aria-label="Search challenges"
            className="ml-auto w-full max-w-sm rounded-xl border-2 border-ink/15 bg-white px-4 py-2 font-semibold sm:w-auto"
          />
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-panel">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm lg:text-base">
            <thead className="bg-ink text-white">
              <tr>
                <th className="px-3 py-2">Balloon</th>
                <th className="px-3 py-2">Game · #</th>
                <th className="px-3 py-2">Level</th>
                <th className="px-3 py-2">Challenge</th>
                <th className="px-3 py-2">Answer</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const d = detail(c);
                return (
                  <tr key={c.id} className="border-t border-ink/10 align-top">
                    <td className="px-3 py-2 font-black tabular-nums">{c.balloon}</td>
                    <td className="px-3 py-2 font-bold">
                      {c.category} · {c.n}
                      <div className="text-xs font-semibold text-ink/50">{c.id}</div>
                    </td>
                    <td className="px-3 py-2">{c.level ?? "—"}</td>
                    <td className="px-3 py-2 font-semibold">{d.prompt}</td>
                    <td className="px-3 py-2 font-black text-ok">{c.answer}</td>
                    <td className="px-3 py-2 text-ink/75">{d.extra}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h3 id="credits" className="mt-10 text-2xl font-black text-ink">
          Photo credits (Game 4)
        </h3>
        <p className="mt-1 font-semibold text-ink/70">
          Photographs are from Wikimedia Commons and used under the licences
          below.
        </p>
        <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PHOTO_CREDITS.map((p) => (
            <li key={p.n} className="flex gap-3 rounded-2xl bg-white p-3 shadow-panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/media/photos/${p.file}`}
                alt={p.alt}
                className="h-20 w-28 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 text-sm">
                <p className="font-black text-ink">
                  #{p.n} · {p.subject}
                </p>
                <p className="truncate font-semibold text-ink/70">{p.author}</p>
                <a
                  href={p.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-terra-deep underline"
                >
                  {p.license}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
