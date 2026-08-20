import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getJuzList, getSurah, getSurahAyahs } from "@/lib/quran";
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
  for (let s = section.start.surah; s <= section.end.surah; s++) {
    const surah = getSurah(s);
    if (!surah) continue;
    const startAyah = s === section.start.surah ? section.start.ayah : 1;
    const endAyah = s === section.end.surah ? section.end.ayah : surah.ayahs;
    groupInfo.push({ surah: s, english: surah.english, arabic: surah.arabic, ayahs: surah.ayahs });
    for (let n = startAyah; n <= endAyah; n++) {
      const a = getSurahAyahs(s)[n - 1];
      if (!a) continue;
      items.push({ s, n: a.n, a: a.a, u: a.u, e: a.e, sajdah: a.sajdah });
    }
  }

  const startName = getSurah(section.start.surah)?.english ?? "";
  const endName = getSurah(section.end.surah)?.english ?? "";

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 md:px-8">
      <Reader
        items={items}
        groupInfo={groupInfo}
        heading={
          <header className="rounded-[2rem] border border-ink/10 bg-surface p-7 text-center shadow-soft md:p-10">
            <p className="text-sm uppercase tracking-[.25em] text-gold">The Quran</p>
            <h1 className="mt-2 text-4xl font-semibold">Juz {id}</h1>
            <p className="mt-2 text-ink/55">
              {startName} {section.start.ayah} → {endName} {section.end.ayah} · {section.ayahs} Ayahs
            </p>
          </header>
        }
      />
    </main>
  );
}