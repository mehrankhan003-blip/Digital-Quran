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
        <header className="fade-up rounded-[1.75rem] bg-gradient-to-br from-gold/35 via-transparent to-forest/25 p-px md:rounded-[2rem]">
          <div className="rounded-[1.75rem] bg-surface p-5 text-center shadow-soft sm:p-7 md:rounded-[2rem] md:p-10">
            <p className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.22em] text-gold sm:gap-3 sm:text-xs sm:tracking-[.25em]">
              <span className="h-px w-6 bg-gold/40 sm:w-8" />
              Surah {surah.number} · {surah.translation} · {surah.revelation}
              <span className="h-px w-6 bg-gold/40 sm:w-8" />
            </p>
            <h1 className="quran-arabic mt-3 text-4xl leading-[1.6] text-forest sm:mt-4 sm:text-5xl md:text-6xl">
              {surah.arabic}
            </h1>
            <p className="mt-1.5 text-base font-medium sm:mt-2 sm:text-lg">{surah.english}</p>
            {surah.number !== 1 && surah.number !== 9 && (
              <p className="quran-arabic mt-4 text-2xl leading-relaxed text-ink/80 sm:mt-6 sm:text-3xl">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            )}
            <div className="ornament-rule mx-auto mt-5 max-w-[16rem] sm:mt-7" />
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-ink/55 sm:mt-6">
              <span className="rounded-full border border-ink/10 bg-ivory/60 px-3.5 py-1.5">
                Juz {surah.juzStart}
              </span>
              {surah.juzEnd !== surah.juzStart && (
                <span className="rounded-full border border-ink/10 bg-ivory/60 px-3.5 py-1.5">
                  Juz {surah.juzEnd}
                </span>
              )}
              <span className="rounded-full border border-ink/10 bg-ivory/60 px-3.5 py-1.5">
                {surah.ayahs} Ayahs
              </span>
              {surah.sajdah.length > 0 && (
                <span className="rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-gold">
                  ۩ Sajdah
                </span>
              )}
            </div>
          </div>
        </header>
      }
      footerNav={
        <nav className="mt-8 grid gap-3 sm:grid-cols-2">
          {prevSurah && (
            <Link
              href={`/quran/${prevSurah.number}`}
              className="card-hover group flex items-center gap-3 rounded-2xl border border-ink/10 bg-surface p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ivory text-forest transition-colors group-hover:bg-forest group-hover:text-white">
                <ChevronLeft size={18} />
              </span>
              <div>
                <div className="text-xs text-ink/45">Previous</div>
                <div className="font-medium">{prevSurah.english}</div>
              </div>
            </Link>
          )}
          {nextSurah && (
            <Link
              href={`/quran/${nextSurah.number}`}
              className="card-hover group flex items-center justify-end gap-3 rounded-2xl border border-ink/10 bg-surface p-4 text-right"
            >
              <div>
                <div className="text-xs text-ink/45">Next</div>
                <div className="font-medium">{nextSurah.english}</div>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ivory text-forest transition-colors group-hover:bg-forest group-hover:text-white">
                <ChevronRight size={18} />
              </span>
            </Link>
          )}
        </nav>
      }
    />
  );
}