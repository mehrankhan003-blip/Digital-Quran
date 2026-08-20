"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Target, TrendingUp } from "lucide-react";
import type { PageStart } from "@/lib/quran";
import { getPref, setPref } from "@/lib/prefs";

type KhatmahPrefs = {
  mode: "pages" | "date";
  pagesPerDay: number;
  targetDate: string;
};

const TOTAL_PAGES = 604;

function readPrefs(): KhatmahPrefs {
  return {
    mode: getPref("khatmahMode", "pages") as KhatmahPrefs["mode"],
    pagesPerDay: getPref("khatmahPages", 4),
    targetDate: getPref("khatmahTarget", ""),
  };
}

function startOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function daysBetween(from: number, to: number): number {
  return Math.round((to - from) / 86400000);
}

export function KhatmahView({ pageStarts }: { pageStarts: PageStart[] }) {
  const [ready, setReady] = useState(false);
  if (!ready && typeof window !== "undefined") setReady(true);

  const [prefs, setPrefsState] = useState<KhatmahPrefs>(() => readPrefs());

  if (!ready) return null;

  const now = startOfToday();
  const dayIndex = Math.floor((now - startOfToday()) / 86400000) + 1;

  let dailyPages = prefs.pagesPerDay;
  let remaining = 0;
  if (prefs.mode === "date" && prefs.targetDate) {
    const target = new Date(prefs.targetDate + "T00:00:00").getTime();
    remaining = daysBetween(now, target);
    dailyPages = Math.max(1, Math.ceil(TOTAL_PAGES / Math.max(1, remaining + 1)));
  }

  const startPage = Math.min(TOTAL_PAGES, (dayIndex - 1) * dailyPages + 1);
  const endPage = Math.min(TOTAL_PAGES, startPage + dailyPages - 1);
  const todayStart = pageStarts[startPage - 1];
  const todayEnd = pageStarts[endPage - 1];
  const done = Math.min(TOTAL_PAGES, (dayIndex - 1) * dailyPages);
  const progress = Math.round((done / TOTAL_PAGES) * 100);

  const update = (patch: Partial<KhatmahPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefsState(next);
    setPref("khatmahMode", next.mode);
    setPref("khatmahPages", next.pagesPerDay);
    setPref("khatmahTarget", next.targetDate);
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 md:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[.2em] text-gold">Khatmah Planner</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Complete the Quran, a little each day</h1>
        <p className="mt-3 max-w-2xl leading-7 text-ink/60">
          Set a daily page goal or a target date, and your plan is calculated for you.
          Today&apos;s reading opens exactly where you should begin.
        </p>
      </div>

      <div className="rounded-3xl border border-ink/10 bg-surface p-6 shadow-soft md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-ink/10 bg-ivory/50 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Target size={16} className="text-gold" /> Plan by
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => update({ mode: "pages" })}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                  prefs.mode === "pages"
                    ? "bg-forest text-white"
                    : "bg-surface text-ink/60 hover:bg-ivory"
                }`}
              >
                Pages per day
              </button>
              <button
                onClick={() => update({ mode: "date" })}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                  prefs.mode === "date"
                    ? "bg-forest text-white"
                    : "bg-surface text-ink/60 hover:bg-ivory"
                }`}
              >
                Target date
              </button>
            </div>

            {prefs.mode === "pages" ? (
              <div className="mt-4">
                <label className="text-xs font-medium text-ink/50" htmlFor="khatmah-pages">
                  Pages to read each day
                </label>
                <input
                  id="khatmah-pages"
                  type="number"
                  min={1}
                  max={30}
                  value={prefs.pagesPerDay}
                  onChange={(e) => update({ pagesPerDay: Math.max(1, Number(e.target.value) || 1) })}
                  className="mt-2 w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 text-lg font-semibold focus:border-forest focus:outline-none"
                />
                <p className="mt-2 text-xs text-ink/45">
                  {Math.ceil(TOTAL_PAGES / prefs.pagesPerDay)} days to complete the Khatmah.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <label className="text-xs font-medium text-ink/50" htmlFor="khatmah-target">
                  Target completion date
                </label>
                <input
                  id="khatmah-target"
                  type="date"
                  value={prefs.targetDate}
                  onChange={(e) => update({ targetDate: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 focus:border-forest focus:outline-none"
                />
                <p className="mt-2 text-xs text-ink/45">
                  {prefs.targetDate
                    ? `${dailyPages} pages per day (${remaining} days left)`
                    : "Pick a date to compute your daily pages."}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-ink/10 bg-ivory/50 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <TrendingUp size={16} className="text-gold" /> Progress
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold">{progress}%</span>
              <span className="text-sm text-ink/45">
                {done} of {TOTAL_PAGES} pages
              </span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-mist">
              <div className="h-full rounded-full bg-forest transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-4 space-y-1 text-xs text-ink/45">
              <div>
                Day {dayIndex}: pages {startPage} – {endPage}
              </div>
              <div>
                Starting at {todayStart.s}:{todayStart.n} → {todayEnd.s}:{todayEnd.n}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/30 bg-ivory/60 p-5">
          <div className="flex items-center gap-3">
            <CalendarDays size={20} className="text-gold" />
            <div>
              <div className="font-semibold">Today&apos;s reading</div>
              <div className="text-sm text-ink/55">
                Begin at page {startPage} — {todayStart.s}:{todayStart.n}
              </div>
            </div>
          </div>
          <Link
            href={`/quran/${todayStart.s}#ayah-${todayStart.s}-${todayStart.n}`}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Open today&apos;s pages
          </Link>
        </div>
      </div>
    </div>
  );
}