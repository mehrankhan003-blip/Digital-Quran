"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Section, SurahMeta } from "@/lib/quran";

type Tab = "surah" | "juz" | "hizb" | "manzil";

type QuranIndexProps = {
  surahs: SurahMeta[];
  juz: Section[];
  hizb: Section[];
  manzil: Section[];
};

const TABS: { id: Tab; label: string }[] = [
  { id: "surah", label: "Surah" },
  { id: "juz", label: "Juz" },
  { id: "hizb", label: "Hizb" },
  { id: "manzil", label: "Manzil" },
];

export function QuranIndex({ surahs, juz, hizb, manzil }: QuranIndexProps) {
  const [tab, setTab] = useState<Tab>("surah");
  const [query, setQuery] = useState("");

  const filteredSurahs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter((s) =>
      `${s.english} ${s.translation} ${s.arabicShort} ${s.arabic} ${s.number}`
        .toLowerCase()
        .includes(q)
    );
  }, [query, surahs]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-5 md:px-8 md:py-12">
      <p className="text-xs uppercase tracking-[.2em] text-gold sm:text-sm">The Quran</p>
      <h1 className="mt-1.5 text-3xl font-semibold sm:mt-2 sm:text-4xl">Read the Quran</h1>
      <p className="mt-2 text-sm text-ink/55 sm:mt-3 sm:text-base">
        114 Surahs · 6236 Ayahs · 30 Juz · 60 Hizb · 7 Manzil
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-ink/10 bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === t.id ? "bg-forest text-white" : "text-ink/60 hover:bg-ivory"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-ink/10 bg-surface px-3 py-2 shadow-sm sm:min-w-[220px]">
          <Search size={16} className="shrink-0 text-ink/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search surahs..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/30"
          />
        </div>
      </div>

      {tab === "surah" && (
        <div className="mt-5 grid gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-3">
          {filteredSurahs.map((s) => (
            <Link
              key={s.number}
              href={`/quran/${s.number}`}
              className="card-hover group flex items-center gap-3.5 rounded-2xl border border-ink/10 bg-surface p-3.5 sm:gap-4 sm:p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ivory text-sm font-semibold text-forest transition-colors group-hover:bg-forest group-hover:text-white">
                {s.number}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{s.english}</div>
                <div className="truncate text-xs text-ink/45">
                  {s.translation} · {s.revelation} · {s.ayahs} Ayahs · Juz {s.juzStart}
                </div>
              </div>
              <span className="quran-arabic shrink-0 text-2xl text-forest transition-transform duration-300 group-hover:scale-110">
                {s.arabic}
              </span>
            </Link>
          ))}
          {query && filteredSurahs.length === 0 && (
            <p className="col-span-full py-10 text-center text-ink/45">No surahs match “{query}”.</p>
          )}
        </div>
      )}

      {tab === "juz" && (
        <div className="mt-5 grid gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-3">
          {juz.map((j) => (
            <Link
              key={j.id}
              href={`/quran/juz/${j.id}`}
              className="flex items-center gap-3.5 rounded-2xl border border-ink/10 bg-surface p-3.5 transition hover:shadow-soft sm:gap-4 sm:p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest text-sm font-semibold text-white">
                {j.id}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium">Juz {j.id}</div>
                <div className="truncate text-xs text-ink/45">
                  {surahs[j.start.surah - 1]?.english} ({j.start.surah}:{j.start.ayah}) →{" "}
                  {surahs[j.end.surah - 1]?.english} ({j.end.surah}:{j.end.ayah})
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "hizb" && (
        <div className="mt-5 grid gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {hizb.map((h) => (
            <Link
              key={h.id}
              href={`/quran/${h.start.surah}#ayah-${h.start.surah}-${h.start.ayah}`}
              className="rounded-2xl border border-ink/10 bg-surface p-3.5 transition hover:shadow-soft sm:p-4"
            >
              <div className="text-sm font-semibold">Hizb {h.id}</div>
              <div className="mt-1 text-xs text-ink/45">
                {surahs[h.start.surah - 1]?.english} {h.start.ayah} → {surahs[h.end.surah - 1]?.english} {h.end.ayah}
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "manzil" && (
        <div className="mt-5 grid gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {manzil.map((m) => (
            <Link
              key={m.id}
              href={`/quran/${m.start.surah}#ayah-${m.start.surah}-${m.start.ayah}`}
              className="rounded-2xl border border-ink/10 bg-surface p-3.5 transition hover:shadow-soft sm:p-4"
            >
              <div className="text-sm font-semibold">Manzil {m.id}</div>
              <div className="mt-1 text-xs text-ink/45">
                {surahs[m.start.surah - 1]?.english} {m.start.ayah} → {surahs[m.end.surah - 1]?.english} {m.end.ayah}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
