import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getJuzList, getSurah, getSurahAyahs } from "@/lib/quran";
import { getWordsForRange, wordsAvailable } from "@/lib/words";
import { getRomanUrdu, romanAvailable } from "@/lib/roman";
import { Reader, type ReaderItem } from "@/components/Reader";

export const dynamicParams = false;

export function generateStaticParams() {
  return getJuzList().map((j) => ({ juz: String(j.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ juz: string }> }): Promise<Metadata> {
  const { juz } = await params;
  const j = getJuzList().find((x) => x.id === Number(juz));
  if (!j) return {};
  return {
    title: `Juz ${j.id} — Digital Quran`,
    description: `Read Juz ${j.id} starting at ${j.start.surah}:${j.start.ayah} with Arabic, Urdu and English translations and recitation.`,
  };
}

export default async function JuzPage({ params }: { params: Promise<{ juz: string }> }) {
  const { juz } = await params;
  const id = Number(juz);
  const section = getJuzList().find((x) => x.id === id);
  if (!section) notFound();

  const items: ReaderItem[] = [];
  const groupInfo: { surah: number; english: string; arabic: string; ayahs: number }[] = [];
  const hasRoman = romanAvailable();
  for (let s = section.start.surah; s <= section.end.surah; s++) {
    const surah = getSurah(s);
    if (!surah) continue;
    const startAyah = s === section.start.surah ? section.start.ayah : 1;
    const endAyah = s === section.end.surah ? section.end.ayah : surah.ayahs;
    groupInfo.push({ surah: s, english: surah.english, arabic: surah.arabic, ayahs: surah.ayahs });
    for (let n = startAyah; n <= endAyah; n++) {
      const a = getSurahAyahs(s)[n - 1];
      if (!a) continue;
      const r = hasRoman ? getRomanUrdu(s, n) : undefined;
      items.push({ s, n: a.n, a: a.a, u: a.u, e: a.e, sajdah: a.sajdah, r });
    }
  }

  const words = wordsAvailable()
    ? getWordsForRange(section)
    : undefined;

  const startName = getSurah(section.start.surah)?.english ?? "";
  const endName = getSurah(section.end.surah)?.english ?? "";

  return (
    <main className="mx-auto max-w-4xl px-3 py-6 sm:px-5 md:px-8 md:py-10">
      <Reader
        items={items}
        groupInfo={groupInfo}
        words={words}
        hasRoman={hasRoman}
        heading={
          <header className="rounded-[1.75rem] border border-ink/10 bg-surface p-5 text-center shadow-soft sm:p-7 md:rounded-[2rem] md:p-10">
            <p className="text-xs uppercase tracking-[.22em] text-gold sm:text-sm sm:tracking-[.25em]">The Quran</p>
            <h1 className="mt-1.5 text-3xl font-semibold sm:mt-2 sm:text-4xl">Juz {id}</h1>
            <p className="mt-1.5 text-sm text-ink/55 sm:mt-2 sm:text-base">
              {startName} {section.start.ayah} → {endName} {section.end.ayah} · {section.ayahs} Ayahs
            </p>
          </header>
        }
      />
    </main>
  );
}