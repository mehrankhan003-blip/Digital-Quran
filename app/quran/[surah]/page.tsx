import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSurah, getSurahs, getSurahAyahs } from "@/lib/quran";
import { getWordsForRange, wordsAvailable } from "@/lib/words";
import { getRomanUrdu, romanAvailable } from "@/lib/roman";
import { SurahReader } from "@/components/SurahReader";

export const dynamicParams = false;

export function generateStaticParams() {
  return getSurahs().map((s) => ({ surah: String(s.number) }));
}

export async function generateMetadata({ params }: { params: Promise<{ surah: string }> }): Promise<Metadata> {
  const { surah } = await params;
  const s = getSurah(Number(surah));
  if (!s) return {};
  return {
    title: `Surah ${s.english} (${s.arabicShort}) — Digital Quran`,
    description: `Read Surah ${s.english} (${s.translation}) with Arabic, Urdu, Roman Urdu and English translations, recitation and verse-by-verse navigation.`,
  };
}

export default async function SurahPage({ params }: { params: Promise<{ surah: string }> }) {
  const { surah } = await params;
  const number = Number(surah);
  const surahMeta = getSurah(number);
  if (!surahMeta) notFound();

  const ayahs = getSurahAyahs(number);
  const surahs = getSurahs();
  const prevSurah = number > 1 ? surahs[number - 2] : undefined;
  const nextSurah = number < 114 ? surahs[number] : undefined;

  const words = wordsAvailable()
    ? getWordsForRange({
        start: { surah: number, ayah: 1 },
        end: { surah: number, ayah: surahMeta.ayahs },
      })
    : undefined;

  const hasRoman = romanAvailable();
  const roman: Record<string, string> = {};
  if (hasRoman) {
    for (const a of ayahs) {
      const r = getRomanUrdu(number, a.n);
      if (r) roman[a.n] = r;
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 md:px-8">
      <SurahReader
        surah={surahMeta}
        ayahs={ayahs}
        prevSurah={prevSurah}
        nextSurah={nextSurah}
        words={words}
        roman={roman}
        hasRoman={hasRoman}
      />
    </main>
  );
}