"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import type { SearchResult } from "@/lib/quran";

type SearchViewProps = {
  query: string;
  results: SearchResult[];
};

export function SearchView({ query: initialQuery, results }: SearchViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const deferred = useDeferredValue(query);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = deferred.trim();
      router.replace(q ? `/search?q=${encodeURIComponent(q)}` : "/search", { scroll: false });
    }, 250);
    return () => clearTimeout(t);
  }, [deferred, router]);

  const searching = deferred.trim() !== initialQuery.trim() || (deferred.trim() && results.length === 0);

  return (
    <main className="mx-auto max-w-4xl px-5 py-12 md:px-8">
      <p className="text-sm uppercase tracking-[.2em] text-gold">Discovery</p>
      <h1 className="mt-2 text-4xl font-semibold">Search the Quran</h1>
      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-ink/10 bg-surface px-4 py-3 shadow-sm">
        <Search size={19} className="text-ink/35" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Arabic, Urdu, English… e.g. sabr"
          className="w-full bg-transparent outline-none placeholder:text-ink/30"
          autoFocus
        />
      </div>

      <div className="mt-6 space-y-3">
        {searching && <p className="py-6 text-center text-sm text-ink/45">Searching…</p>}
        {!searching && query && results.length === 0 && (
          <p className="py-10 text-center text-ink/45">No ayahs match “{query}”.</p>
        )}
        {!searching && results.map((r) => (
          <Link
            key={r.key}
            href={`/quran/${r.surah}#ayah-${r.surah}-${r.ayah}`}
            className="card-hover block rounded-2xl border border-ink/10 bg-surface p-5 hover:border-gold/30"
          >
            <div className="flex items-center justify-between text-xs text-ink/45">
              <span>
                {r.surahName} {r.ayah} · Surah {r.surah}
              </span>
              <span className="text-gold">Read →</span>
            </div>
            <p className="quran-arabic mt-3 text-right text-2xl leading-[2] text-ink">{r.arabic}</p>
            <p className="mt-3 text-right leading-7 text-ink/70" dir="rtl">{r.urdu}</p>
            <p className="mt-2 text-sm leading-6 text-ink/55">{r.english}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}