"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Ayah, SurahMeta } from "@/lib/quran";
import type { Word } from "@/lib/words";
import { Reader, type ReaderItem } from "./Reader";

type SurahReaderProps = {
  surah: SurahMeta;
  ayahs: (Ayah & { n: number })[];
  prevSurah?: SurahMeta;
  nextSurah?: SurahMeta;
  words?: Record<string, Word[]>;
  roman?: Record<string, string>;
  hasRoman?: boolean;
};

export function SurahReader({ surah, ayahs, prevSurah, nextSurah, words, roman, hasRoman = false }: SurahReaderProps) {
  const items: ReaderItem[] = ayahs.map((a) => ({
    s: surah.number,
    n: a.n,
    a: a.a,
    u: a.u,
    e: a.e,
    sajdah: a.sajdah,
    r: roman?.[a.n],
  }));

  return (
    <Reader
      items={items}
      words={words}
      hasRoman={hasRoman}
      heading={
        <header className="rounded-[2rem] border border-ink/10 bg-surface p-7 text-center shadow-soft md:p-10">
          <p className="text-sm uppercase tracking-[.25em] text-gold">
            Surah {surah.number} · {surah.translation} · {surah.revelation}
          </p>
          <h1 className="quran-arabic mt-3 text-5xl text-forest">{surah.arabic}</h1>
          <p className="mt-2 text-lg font-medium">{surah.english}</p>
          {surah.number !== 1 && surah.number !== 9 && (
            <p className="quran-arabic mt-6 text-3xl text-ink/80">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-ink/45">
            <span className="rounded-full bg-ivory px-3 py-1">Juz {surah.juzStart}</span>
            {surah.juzEnd !== surah.juzStart && (
              <span className="rounded-full bg-ivory px-3 py-1">Juz {surah.juzEnd}</span>
            )}
            <span className="rounded-full bg-ivory px-3 py-1">{surah.ayahs} Ayahs</span>
            {surah.sajdah.length > 0 && (
              <span className="rounded-full bg-ivory px-3 py-1">۩ Sajdah</span>
            )}
          </div>
        </header>
      }
      footerNav={
        <nav className="mt-8 grid gap-3 sm:grid-cols-2">
          {prevSurah && (
            <Link
              href={`/quran/${prevSurah.number}`}
              className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-surface p-4 transition hover:shadow-soft"
            >
              <ChevronLeft size={18} className="text-forest" />
              <div>
                <div className="text-xs text-ink/45">Previous</div>
                <div className="font-medium">{prevSurah.english}</div>
              </div>
            </Link>
          )}
          {nextSurah && (
            <Link
              href={`/quran/${nextSurah.number}`}
              className="flex items-center justify-end gap-3 rounded-2xl border border-ink/10 bg-surface p-4 text-right transition hover:shadow-soft"
            >
              <div>
                <div className="text-xs text-ink/45">Next</div>
                <div className="font-medium">{nextSurah.english}</div>
              </div>
              <ChevronRight size={18} className="text-forest" />
            </Link>
          )}
        </nav>
      }
    />
  );
}