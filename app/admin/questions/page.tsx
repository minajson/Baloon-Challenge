"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { GameSettings, Question, QuestionMode } from "@/lib/types";
import {
  defaultQuestions,
  duplicateBalloonAssignments,
  loadQuestionBank,
  nextQuestionId,
  nowIso,
  renumber,
  restoreDefaultQuestions,
  saveQuestionBank,
  sortByOrder,
  validateDraft,
  type QuestionDraft,
} from "@/lib/questionStore";
import {
  downloadFile,
  exportQuestionBankCsv,
  importQuestionBankCsv,
  type CsvImportSummary,
} from "@/lib/csv";
import { DEFAULT_SETTINGS, loadSettings, loadState, saveSettings } from "@/lib/storage";
import BrandHeader from "@/components/BrandHeader";

/**
 * Question Manager — /admin/questions
 *
 * Opens directly with no PIN/password (see ADMIN_AUTH_ENABLED in
 * AdminPanel.tsx for the future re-entry point for authentication).
 * All changes persist to the question bank in localStorage and apply to
 * new game sessions; a session already in progress keeps its assignments.
 */

const PAGE_SIZE = 20;
const LETTERS = ["A", "B", "C", "D"];
const MAX_IMAGE_BYTES = 300 * 1024;

export default function QuestionManagerPage() {
  const [hydrated, setHydrated] = useState(false);
  const [bank, setBank] = useState<Question[]>([]);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [gameInProgress, setGameInProgress] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState<"order" | "updated">("order");
  const [page, setPage] = useState(1);

  const [formTarget, setFormTarget] = useState<Question | "new" | null>(null);
  const [deleting, setDeleting] = useState<Question | null>(null);
  const [previewing, setPreviewing] = useState<Question | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [importSummary, setImportSummary] = useState<CsvImportSummary | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);

  // One-time sync FROM localStorage after mount (same hydration pattern as
  // the game in app/page.tsx — keeps server HTML and first client render
  // identical for the static export).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBank(loadQuestionBank());
    setSettings(loadSettings());
    setGameInProgress((loadState()?.poppedBalloons.length ?? 0) > 0);
    setHydrated(true);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  };

  const persist = (next: Question[]) => {
    const sorted = sortByOrder(next);
    setBank(sorted);
    saveQuestionBank(sorted);
  };

  const patchSettings = (patch: Partial<GameSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  const activeCount = bank.filter((q) => q.active).length;
  const categories = useMemo(
    () => [...new Set(bank.map((q) => q.category))].sort(),
    [bank],
  );
  const duplicateBalloons = useMemo(
    () => duplicateBalloonAssignments(bank),
    [bank],
  );

  const filtered = useMemo(() => {
    let list = [...bank];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((x) => x.question.toLowerCase().includes(q));
    if (category !== "all") list = list.filter((x) => x.category === category);
    if (difficulty !== "all") list = list.filter((x) => x.difficulty === difficulty);
    if (status !== "all")
      list = list.filter((x) => (status === "active" ? x.active : !x.active));
    if (sortBy === "updated") {
      list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } else {
      list = sortByOrder(list);
    }
    return list;
  }, [bank, search, category, difficulty, status, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Drag & drop only makes sense on the unfiltered, order-sorted list.
  const dragEnabled =
    sortBy === "order" && !search.trim() && category === "all" &&
    difficulty === "all" && status === "all";

  // ---- Actions ----
  const handleSave = (draft: QuestionDraft, editingId?: string) => {
    if (editingId) {
      const next = bank.map((q) =>
        q.id === editingId
          ? {
              ...q,
              ...draft,
              id: draft.id?.trim() || q.id,
              options: draft.options.filter((o) => o.trim() !== ""),
              updatedAt: nowIso(),
            }
          : q,
      );
      persist(next);
      showToast("Question updated successfully.");
    } else {
      const ts = nowIso();
      const created: Question = {
        ...draft,
        id: draft.id?.trim() || nextQuestionId(bank),
        options: draft.options.filter((o) => o.trim() !== ""),
        timeLimit: draft.timeLimit,
        createdAt: ts,
        updatedAt: ts,
      };
      persist([...bank, created]);
      showToast("Question added successfully.");
    }
    setFormTarget(null);
  };

  const handleDelete = (q: Question) => {
    persist(renumber(sortByOrder(bank.filter((x) => x.id !== q.id))));
    setDeleting(null);
    showToast("Question deleted.");
  };

  const handleDuplicate = (q: Question) => {
    const ts = nowIso();
    const copy: Question = {
      ...q,
      id: nextQuestionId(bank),
      question: `${q.question} (copy)`,
      balloonNumber: null,
      order: q.order + 1,
      createdAt: ts,
      updatedAt: ts,
    };
    const ordered = sortByOrder(bank);
    const at = ordered.findIndex((x) => x.id === q.id);
    ordered.splice(at + 1, 0, copy);
    persist(renumber(ordered));
    showToast("Question duplicated.");
  };

  const toggleActive = (q: Question) => {
    persist(
      bank.map((x) =>
        x.id === q.id ? { ...x, active: !x.active, updatedAt: nowIso() } : x,
      ),
    );
  };

  const move = (q: Question, dir: -1 | 1) => {
    const ordered = sortByOrder(bank);
    const at = ordered.findIndex((x) => x.id === q.id);
    const to = at + dir;
    if (to < 0 || to >= ordered.length) return;
    [ordered[at], ordered[to]] = [ordered[to], ordered[at]];
    persist(renumber(ordered));
  };

  const setOrderNumber = (q: Question, orderRaw: string) => {
    const n = Number(orderRaw);
    if (!Number.isInteger(n) || n < 1) return;
    const ordered = sortByOrder(bank).filter((x) => x.id !== q.id);
    ordered.splice(Math.min(n - 1, ordered.length), 0, q);
    persist(renumber(ordered));
  };

  const handleDrop = (targetIndex: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === targetIndex) return;
    const ordered = sortByOrder(bank);
    const globalFrom = (currentPage - 1) * PAGE_SIZE + from;
    const globalTo = (currentPage - 1) * PAGE_SIZE + targetIndex;
    const [moved] = ordered.splice(globalFrom, 1);
    ordered.splice(globalTo, 0, moved);
    persist(renumber(ordered));
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const summary = importQuestionBankCsv(text, bank, updateExisting);
    if (summary.imported > 0 || summary.updated > 0) {
      persist(renumber(sortByOrder(summary.questions)));
    }
    setImportSummary(summary);
  };

  const handleRestore = () => {
    persist(restoreDefaultQuestions());
    setConfirmRestore(false);
    showToast(`Restored the ${defaultQuestions().length} default questions.`);
  };

  if (!hydrated) {
    return (
      <main className="flex h-screen items-center justify-center">
        <p className="text-2xl font-black text-ren-navy">Loading…</p>
      </main>
    );
  }

  return (
    // The root layout locks the body (the game is a fixed stage), so this
    // page scrolls inside its own container.
    <main className="flex h-screen w-full flex-col overflow-y-auto">
      <BrandHeader />
      <div className="mx-auto w-full max-w-[1700px] flex-1 px-4 pb-10 lg:px-8">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-ren-navy lg:text-3xl">
              Question Manager
            </h2>
            <span className="rounded-full bg-safety-green-soft px-3 py-1 text-sm font-black text-safety-green">
              {activeCount} active
            </span>
            <span className="rounded-full bg-ren-navy-soft px-3 py-1 text-sm font-bold text-ren-navy">
              {bank.length} total
            </span>
          </div>
          <Link
            href="/"
            className="rounded-xl bg-ren-navy px-4 py-2 font-black text-white hover:bg-ren-navy-mid"
          >
            ← Back to Game
          </Link>
        </div>

        {gameInProgress && (
          <p className="mt-3 rounded-2xl bg-warm-yellow-soft px-4 py-2 font-semibold text-ren-orange-deep">
            A game session is in progress. Changes here apply to future
            questions and new sessions — balloons already popped keep their
            original question.
          </p>
        )}
        {duplicateBalloons.length > 0 && (
          <p className="mt-3 rounded-2xl bg-alert-red-soft px-4 py-2 font-semibold text-alert-red">
            ⚠ Balloon{duplicateBalloons.length > 1 ? "s" : ""}{" "}
            {duplicateBalloons.join(", ")} assigned to more than one active
            question. In fixed mode only one of them can be served — clear the
            duplicates below.
          </p>
        )}

        {/* Toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search question text…"
            className="w-64 rounded-xl border-2 border-ren-navy-soft bg-white px-3 py-2 font-semibold"
            aria-label="Search questions"
          />
          <FilterSelect
            value={category}
            onChange={(v) => { setCategory(v); setPage(1); }}
            options={[["all", "All categories"], ...categories.map((c) => [c, c] as [string, string])]}
          />
          <FilterSelect
            value={difficulty}
            onChange={(v) => { setDifficulty(v); setPage(1); }}
            options={[["all", "All difficulties"], ["Easy", "Easy"], ["Medium", "Medium"], ["Hard", "Hard"]]}
          />
          <FilterSelect
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[["all", "Active + inactive"], ["active", "Active only"], ["inactive", "Inactive only"]]}
          />
          <FilterSelect
            value={sortBy}
            onChange={(v) => setSortBy(v as "order" | "updated")}
            options={[["order", "Sort: display order"], ["updated", "Sort: recently updated"]]}
          />
          <div className="ml-auto flex flex-wrap gap-2">
            <ToolbarButton tone="orange" onClick={() => setFormTarget("new")}>
              ＋ Add Question
            </ToolbarButton>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImportFile(f);
                e.target.value = "";
              }}
            />
            <ToolbarButton tone="navy" onClick={() => fileRef.current?.click()}>
              ⬆ Import CSV
            </ToolbarButton>
            <ToolbarButton
              tone="navy"
              onClick={() =>
                downloadFile("balloon-questions.csv", exportQuestionBankCsv(bank))
              }
            >
              ⬇ Export CSV
            </ToolbarButton>
            <a
              href="/questions-template.csv"
              download
              className="rounded-xl bg-ren-navy-soft px-4 py-2 font-black text-ren-navy hover:bg-ren-navy hover:text-white"
            >
              CSV Template
            </a>
            <ToolbarButton tone="red" onClick={() => setConfirmRestore(true)}>
              ↺ Restore Defaults
            </ToolbarButton>
          </div>
        </div>

        <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold text-ren-navy/80">
          <input
            type="checkbox"
            checked={updateExisting}
            onChange={(e) => setUpdateExisting(e.target.checked)}
            className="h-4 w-4 accent-ren-orange"
          />
          CSV import may update existing questions (matched by id)
        </label>

        {/* Game settings */}
        <section className="mt-4 rounded-2xl bg-white p-4 shadow-panel">
          <h3 className="text-sm font-black uppercase tracking-widest text-ren-orange-deep">
            Game Settings
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 font-bold text-ren-navy">
              Question mode
              <select
                value={settings.questionMode}
                onChange={(e) =>
                  patchSettings({ questionMode: e.target.value as QuestionMode })
                }
                className="rounded-lg border-2 border-ren-navy-soft px-2 py-1 font-bold"
              >
                <option value="fixed">Fixed balloon-to-question mapping</option>
                <option value="sequential">Sequential (by display order)</option>
                <option value="random">Random</option>
              </select>
            </label>
            <label className="flex items-center gap-2 font-bold text-ren-navy">
              Questions per session
              <input
                type="number"
                min={0}
                max={50}
                value={settings.questionsPerSession}
                onChange={(e) =>
                  patchSettings({
                    questionsPerSession: Math.max(0, Math.min(50, Number(e.target.value) || 0)),
                  })
                }
                className="w-20 rounded-lg border-2 border-ren-navy-soft px-2 py-1 font-bold"
              />
              <span className="text-sm font-semibold text-ren-navy/60">(0 = all balloons)</span>
            </label>
          </div>
        </section>

        {/* List */}
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-panel">
          <table className="w-full min-w-[1080px] text-left">
            <thead>
              <tr className="border-b-2 border-ren-navy-soft text-xs font-black uppercase tracking-wider text-ren-navy/70">
                <th className="px-3 py-3">Order</th>
                <th className="px-2 py-3">Balloon</th>
                <th className="px-2 py-3">Question</th>
                <th className="px-2 py-3">Category</th>
                <th className="px-2 py-3">Difficulty</th>
                <th className="px-2 py-3">Correct Answer</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3">Updated</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((q, i) => (
                <tr
                  key={q.id}
                  draggable={dragEnabled}
                  onDragStart={() => (dragIndex.current = i)}
                  onDragOver={(e) => dragEnabled && e.preventDefault()}
                  onDrop={() => dragEnabled && handleDrop(i)}
                  className={`border-b border-ren-navy-soft/60 align-middle ${
                    q.active ? "" : "opacity-50"
                  } ${dragEnabled ? "cursor-grab" : ""}`}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {dragEnabled && (
                        <span aria-hidden="true" className="text-ren-navy/40">⠿</span>
                      )}
                      <input
                        type="number"
                        min={1}
                        defaultValue={q.order}
                        key={`${q.id}-${q.order}`}
                        onBlur={(e) => {
                          if (Number(e.target.value) !== q.order)
                            setOrderNumber(q, e.target.value);
                        }}
                        className="w-14 rounded-lg border border-ren-navy-soft px-1 py-0.5 text-center font-bold"
                        aria-label={`Display order for ${q.id}`}
                      />
                      <div className="flex flex-col">
                        <IconButton label="Move up" onClick={() => move(q, -1)}>▲</IconButton>
                        <IconButton label="Move down" onClick={() => move(q, 1)}>▼</IconButton>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2 font-black text-ren-navy">
                    <span
                      className={
                        q.balloonNumber !== null &&
                        duplicateBalloons.includes(q.balloonNumber)
                          ? "rounded-lg bg-alert-red-soft px-2 py-0.5 text-alert-red"
                          : ""
                      }
                    >
                      {q.balloonNumber ?? "—"}
                    </span>
                  </td>
                  <td className="max-w-[380px] px-2 py-2 font-semibold text-ren-navy">
                    <span className="line-clamp-2">{q.question}</span>
                    <span className="text-xs font-normal text-ren-navy/50">{q.id}</span>
                  </td>
                  <td className="px-2 py-2 font-semibold text-ren-navy/80">{q.category}</td>
                  <td className="px-2 py-2">
                    <DifficultyBadge difficulty={q.difficulty} />
                  </td>
                  <td className="max-w-[220px] px-2 py-2 font-semibold text-safety-green">
                    <span className="line-clamp-1">
                      {LETTERS[q.correctAnswerIndex]}. {q.options[q.correctAnswerIndex]}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={q.active}
                      aria-label={`${q.active ? "Disable" : "Enable"} ${q.id}`}
                      onClick={() => toggleActive(q)}
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        q.active
                          ? "bg-safety-green text-white"
                          : "bg-ren-navy/20 text-ren-navy"
                      }`}
                    >
                      {q.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-2 py-2 text-sm font-semibold text-ren-navy/60">
                    {new Date(q.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <RowButton onClick={() => setPreviewing(q)}>Preview</RowButton>
                      <RowButton onClick={() => setFormTarget(q)}>Edit</RowButton>
                      <RowButton onClick={() => handleDuplicate(q)}>Duplicate</RowButton>
                      <RowButton tone="red" onClick={() => setDeleting(q)}>Delete</RowButton>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center font-semibold text-ren-navy/60">
                    No questions match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="mt-3 flex items-center justify-center gap-3">
            <ToolbarButton
              tone="navy"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </ToolbarButton>
            <span className="font-bold text-ren-navy">
              Page {currentPage} of {pageCount}
            </span>
            <ToolbarButton
              tone="navy"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              Next →
            </ToolbarButton>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {formTarget !== null && (
        <QuestionFormModal
          initial={formTarget === "new" ? null : formTarget}
          bank={bank}
          onSave={handleSave}
          onCancel={() => setFormTarget(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleting && (
        <Modal onClose={() => setDeleting(null)} label="Delete question">
          <h3 className="text-2xl font-black text-ren-navy">Delete this question?</h3>
          <p className="mt-2 font-semibold text-ren-navy/80">
            “{deleting.question}”
          </p>
          <p className="mt-2 font-bold text-alert-red">This action cannot be undone.</p>
          <div className="mt-5 flex justify-end gap-2">
            <ToolbarButton tone="navy" onClick={() => setDeleting(null)}>
              Cancel
            </ToolbarButton>
            <ToolbarButton tone="red" onClick={() => handleDelete(deleting)}>
              Delete Question
            </ToolbarButton>
          </div>
        </Modal>
      )}

      {/* Restore defaults confirmation */}
      {confirmRestore && (
        <Modal onClose={() => setConfirmRestore(false)} label="Restore default questions">
          <h3 className="text-2xl font-black text-ren-navy">Restore default questions?</h3>
          <p className="mt-2 font-semibold text-ren-navy/80">
            This replaces the entire bank with the {defaultQuestions().length}{" "}
            built-in questions. All edits, imports and added questions are lost.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <ToolbarButton tone="navy" onClick={() => setConfirmRestore(false)}>
              Cancel
            </ToolbarButton>
            <ToolbarButton tone="red" onClick={handleRestore}>
              Restore Defaults
            </ToolbarButton>
          </div>
        </Modal>
      )}

      {/* Preview */}
      {previewing && (
        <Modal onClose={() => setPreviewing(null)} label="Question preview" wide>
          <QuestionPreview question={previewing} />
          <div className="mt-4 flex justify-end">
            <ToolbarButton tone="navy" onClick={() => setPreviewing(null)}>
              Close
            </ToolbarButton>
          </div>
        </Modal>
      )}

      {/* Import summary */}
      {importSummary && (
        <Modal onClose={() => setImportSummary(null)} label="CSV import summary">
          <h3 className="text-2xl font-black text-ren-navy">CSV Import</h3>
          <ul className="mt-3 space-y-1 font-bold text-ren-navy">
            <li className="text-safety-green">Imported: {importSummary.imported}</li>
            <li className="text-ren-orange-deep">Updated: {importSummary.updated}</li>
            <li className="text-ren-navy/70">Skipped: {importSummary.skipped}</li>
            <li className={importSummary.errors.length ? "text-alert-red" : "text-ren-navy/70"}>
              Errors: {importSummary.errors.length}
            </li>
          </ul>
          {importSummary.errors.length > 0 && (
            <div className="mt-3 max-h-48 overflow-y-auto rounded-xl bg-alert-red-soft p-3 text-sm font-semibold text-alert-red">
              {importSummary.errors.map((e, i) => (
                <p key={i}>{e}</p>
              ))}
            </div>
          )}
          {importSummary.skipped > 0 && !updateExisting && (
            <p className="mt-3 text-sm font-semibold text-ren-navy/70">
              Skipped rows matched existing ids. Tick “CSV import may update
              existing questions” and re-import to update them.
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <ToolbarButton tone="navy" onClick={() => setImportSummary(null)}>
              Done
            </ToolbarButton>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[95] -translate-x-1/2 rounded-2xl bg-safety-green px-6 py-3 text-lg font-bold text-white shadow-panel">
          {toast}
        </div>
      )}
    </main>
  );
}

// ---------------------------------------------------------------- helpers

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border-2 border-ren-navy-soft bg-white px-2 py-2 font-bold text-ren-navy"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

function ToolbarButton({
  tone,
  onClick,
  children,
}: {
  tone: "orange" | "navy" | "red";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    orange: "bg-ren-orange text-white hover:bg-ren-orange-deep",
    navy: "bg-ren-navy text-white hover:bg-ren-navy-mid",
    red: "bg-alert-red text-white hover:bg-alert-red/85",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 font-black transition ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function RowButton({
  onClick,
  tone,
  children,
}: {
  onClick: () => void;
  tone?: "red";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-sm font-black transition ${
        tone === "red"
          ? "bg-alert-red-soft text-alert-red hover:bg-alert-red hover:text-white"
          : "bg-ren-navy-soft text-ren-navy hover:bg-ren-navy hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="px-1 text-[10px] leading-tight text-ren-navy/50 hover:text-ren-orange"
    >
      {children}
    </button>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: Question["difficulty"] }) {
  const tone =
    difficulty === "Easy"
      ? "bg-safety-green-soft text-safety-green"
      : difficulty === "Medium"
        ? "bg-warm-yellow-soft text-ren-orange-deep"
        : "bg-alert-red-soft text-alert-red";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${tone}`}>
      {difficulty}
    </span>
  );
}

function Modal({
  children,
  onClose,
  label,
  wide,
}: {
  children: React.ReactNode;
  onClose: () => void;
  label: string;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ren-navy/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-panel ${
          wide ? "max-w-4xl" : "max-w-xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function QuestionPreview({ question }: { question: Question }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ren-orange px-4 py-1.5 font-black text-white">
          Balloon {question.balloonNumber ?? "—"}
        </span>
        <span className="rounded-full bg-ren-navy-soft px-4 py-1.5 font-bold text-ren-navy">
          {question.category}
        </span>
        <DifficultyBadge difficulty={question.difficulty} />
        {!question.active && (
          <span className="rounded-full bg-ren-navy/20 px-4 py-1.5 font-bold text-ren-navy">
            Inactive
          </span>
        )}
      </div>
      <h4 className="mt-4 text-2xl font-black leading-snug text-ren-navy">
        {question.question}
      </h4>
      {question.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.image}
          alt={question.imageAlt ?? ""}
          className="mt-3 max-h-48 rounded-xl object-contain"
        />
      )}
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {question.options.map((opt, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-2xl border-4 p-3 ${
              i === question.correctAnswerIndex
                ? "border-safety-green bg-safety-green-soft text-safety-green"
                : "border-ren-navy-soft text-ren-navy"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black ${
                i === question.correctAnswerIndex
                  ? "bg-safety-green text-white"
                  : "bg-ren-navy-soft text-ren-navy"
              }`}
            >
              {LETTERS[i]}
            </span>
            <span className="font-bold">{opt}</span>
          </div>
        ))}
      </div>
      {question.explanation && (
        <p className="mt-4 rounded-2xl bg-safety-green-soft px-4 py-3 font-semibold text-ren-navy">
          {question.explanation}
        </p>
      )}
    </div>
  );
}

function QuestionFormModal({
  initial,
  bank,
  onSave,
  onCancel,
}: {
  initial: Question | null;
  bank: Question[];
  onSave: (draft: QuestionDraft, editingId?: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<QuestionDraft>(() =>
    initial
      ? {
          id: initial.id,
          question: initial.question,
          options: [...initial.options, "", "", "", ""].slice(0, 4),
          correctAnswerIndex: initial.correctAnswerIndex,
          explanation: initial.explanation,
          category: initial.category,
          difficulty: initial.difficulty,
          image: initial.image,
          imageAlt: initial.imageAlt,
          active: initial.active,
          order: initial.order,
          balloonNumber: initial.balloonNumber,
          timeLimit: initial.timeLimit,
        }
      : {
          question: "",
          options: ["", "", "", ""],
          correctAnswerIndex: 0,
          explanation: "",
          category: "General",
          difficulty: "Medium",
          image: null,
          active: true,
          order: bank.length + 1,
          balloonNumber: null,
          timeLimit: null,
        },
  );
  const [errors, setErrors] = useState<string[]>([]);
  const imageFileRef = useRef<HTMLInputElement>(null);

  const patch = (p: Partial<QuestionDraft>) => setDraft((d) => ({ ...d, ...p }));

  const submit = () => {
    const errs = validateDraft(draft, bank, initial?.id);
    setErrors(errs);
    if (errs.length === 0) onSave(draft, initial?.id);
  };

  const handleImageFile = (file: File) => {
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors([
        `Image is ${(file.size / 1024).toFixed(0)} KB — keep uploads under ${MAX_IMAGE_BYTES / 1024} KB, or place the file in /media/images and reference it by path instead.`,
      ]);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => patch({ image: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <Modal onClose={onCancel} label={initial ? "Edit question" : "Add question"} wide>
      <h3 className="text-2xl font-black text-ren-navy">
        {initial ? "Edit Question" : "Add Question"}
      </h3>

      {errors.length > 0 && (
        <div className="mt-3 rounded-xl bg-alert-red-soft p-3 font-semibold text-alert-red">
          {errors.map((e, i) => (
            <p key={i}>• {e}</p>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-4">
        <Field label="Question text *">
          <textarea
            value={draft.question}
            onChange={(e) => patch({ question: e.target.value })}
            rows={2}
            className="w-full rounded-xl border-2 border-ren-navy-soft px-3 py-2 font-semibold"
          />
        </Field>

        <div className="grid gap-3 md:grid-cols-2">
          {draft.options.map((opt, i) => (
            <Field key={i} label={`Option ${LETTERS[i]}${i < 2 ? " *" : ""}`}>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={draft.correctAnswerIndex === i}
                  onChange={() => patch({ correctAnswerIndex: i })}
                  aria-label={`Mark option ${LETTERS[i]} correct`}
                  className="h-5 w-5 accent-safety-green"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const options = [...draft.options];
                    options[i] = e.target.value;
                    patch({ options });
                  }}
                  className="w-full rounded-xl border-2 border-ren-navy-soft px-3 py-2 font-semibold"
                />
              </div>
            </Field>
          ))}
        </div>
        <p className="text-sm font-semibold text-ren-navy/60">
          Select the radio button next to the correct answer.
        </p>

        <Field label="Explanation (optional)">
          <textarea
            value={draft.explanation}
            onChange={(e) => patch({ explanation: e.target.value })}
            rows={2}
            className="w-full rounded-xl border-2 border-ren-navy-soft px-3 py-2 font-semibold"
          />
        </Field>

        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Category">
            <input
              type="text"
              value={draft.category}
              onChange={(e) => patch({ category: e.target.value })}
              className="w-full rounded-xl border-2 border-ren-navy-soft px-3 py-2 font-semibold"
            />
          </Field>
          <Field label="Difficulty">
            <select
              value={draft.difficulty}
              onChange={(e) =>
                patch({ difficulty: e.target.value as Question["difficulty"] })
              }
              className="w-full rounded-xl border-2 border-ren-navy-soft px-3 py-2 font-bold"
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </Field>
          <Field label="Display order">
            <input
              type="number"
              min={1}
              value={draft.order}
              onChange={(e) => patch({ order: Math.max(1, Number(e.target.value) || 1) })}
              className="w-full rounded-xl border-2 border-ren-navy-soft px-3 py-2 font-bold"
            />
          </Field>
          <Field label="Balloon number (optional)">
            <input
              type="number"
              min={1}
              max={50}
              value={draft.balloonNumber ?? ""}
              placeholder="—"
              onChange={(e) =>
                patch({
                  balloonNumber:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="w-full rounded-xl border-2 border-ren-navy-soft px-3 py-2 font-bold"
            />
          </Field>
        </div>

        <Field label="Image (optional)">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={draft.image ?? ""}
              onChange={(e) => patch({ image: e.target.value || null })}
              placeholder="/media/images/example.png or upload →"
              className="w-72 rounded-xl border-2 border-ren-navy-soft px-3 py-2 font-semibold"
            />
            <input
              ref={imageFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageFile(f);
                e.target.value = "";
              }}
            />
            <ToolbarButton tone="navy" onClick={() => imageFileRef.current?.click()}>
              Upload
            </ToolbarButton>
            {draft.image && (
              <ToolbarButton tone="red" onClick={() => patch({ image: null, imageAlt: undefined })}>
                Remove
              </ToolbarButton>
            )}
          </div>
          {draft.image && (
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draft.image}
                alt={draft.imageAlt ?? "Question image preview"}
                className="max-h-24 rounded-xl object-contain"
              />
              <input
                type="text"
                value={draft.imageAlt ?? ""}
                onChange={(e) => patch({ imageAlt: e.target.value || undefined })}
                placeholder="Alt text (describe the image)"
                className="w-64 rounded-xl border-2 border-ren-navy-soft px-3 py-2 font-semibold"
              />
            </div>
          )}
        </Field>

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex cursor-pointer items-center gap-2 font-bold text-ren-navy">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => patch({ active: e.target.checked })}
              className="h-5 w-5 accent-safety-green"
            />
            Active (included in the playable pool)
          </label>
          <label className="flex items-center gap-2 font-bold text-ren-navy">
            Time limit override (s)
            <input
              type="number"
              min={5}
              max={300}
              value={draft.timeLimit ?? ""}
              placeholder="global"
              onChange={(e) =>
                patch({
                  timeLimit: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="w-24 rounded-xl border-2 border-ren-navy-soft px-3 py-2 font-bold"
            />
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <ToolbarButton tone="navy" onClick={onCancel}>
          Cancel
        </ToolbarButton>
        <ToolbarButton tone="orange" onClick={submit}>
          {initial ? "Save Changes" : "Add Question"}
        </ToolbarButton>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-black uppercase tracking-wide text-ren-navy/70">
        {label}
      </span>
      {children}
    </label>
  );
}
