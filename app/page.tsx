import Link from "next/link";
import { ArrowRight, BookOpen, Headphones, Languages, Sparkles, Bookmark } from "lucide-react";
import { getSurahs } from "@/lib/quran";
import { HomeWidgets } from "@/components/HomeWidgets";

export default function HomePage() {
  const surahs = getSurahs();
  const featured = [1, 2, 36, 55, 67, 112].map((n) => surahs[n - 1]);

  return (
    <main>
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-16 md:px-8 md:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-surface/60 px-4 py-2 text-sm text-forest">
              <Sparkles size={16} /> The complete Quran, made deeply accessible
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-ink md:text-7xl">
              Read with presence. Listen with peace.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/65 md:text-xl">
              All 114 Surahs · 6,236 Ayahs with authentic Uthmani Arabic, Urdu,
              Roman Urdu, English and ayah-by-ayah recitation — on every screen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/quran" className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 font-medium text-white transition hover:opacity-90">
                Open Quran <ArrowRight size={18} />
              </Link>
              <Link href="/quran/1" className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface px-6 py-3 font-medium">
                Start reading
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-ink/10 bg-surface p-8 shadow-soft md:p-10">
            <div className="text-center">
              <div className="text-sm uppercase tracking-[.25em] text-gold">Surah Al-Fatihah</div>
              <div className="quran-arabic mt-7 text-4xl leading-[1.9] text-forest md:text-5xl">ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ</div>
              <p className="mt-6 text-sm leading-7 text-ink/55">All praise is for Allah — Lord of the worlds.</p>
              <div className="mt-8 flex justify-center gap-3 text-xs text-ink/45">
                <span className="rounded-full bg-ivory px-3 py-1">Arabic</span>
                <span className="rounded-full bg-ivory px-3 py-1">Urdu</span>
                <span className="rounded-full bg-ivory px-3 py-1">Roman Urdu</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/5 bg-surface/45">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-8 md:grid-cols-3 md:px-8">
          <Feature icon={<BookOpen />} title="Beautiful reading" text="Mushaf-inspired focus, verse-by-verse, with Juz, Hizb and Manzil navigation." />
          <Feature icon={<Languages />} title="Understand deeply" text="Arabic with Urdu, Roman Urdu and English layers — switch or show them all." />
          <Feature icon={<Headphones />} title="Listen & follow" text="Ayah-synchronized recitation with highlight, auto-scroll and repeat controls." />
          <Feature icon={<Bookmark />} title="Reflect & return" text="Bookmarks, notes and reading history keep your journey personal." />
        </div>
      </section>

      <HomeWidgets />

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[.2em] text-gold">Explore</p>
            <h2 className="mt-2 text-3xl font-semibold">Begin your reading</h2>
          </div>
          <Link href="/quran" className="hidden items-center gap-2 text-sm font-medium text-forest md:flex">
            All Surahs <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => (
            <Link key={s.number} href={`/quran/${s.number}`} className="group rounded-2xl border border-ink/10 bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ivory text-sm text-forest">{s.number}</span>
                <span className="quran-arabic text-xl text-forest">{s.arabic}</span>
              </div>
              <div className="mt-4">
                <div className="font-semibold">{s.english}</div>
                <div className="mt-1 text-sm text-ink/45">{s.translation} · {s.ayahs} Ayahs · Juz {s.juzStart}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-ink/5 bg-surface/60 p-5">
      <div className="mb-4 text-gold">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink/55">{text}</p>
    </div>
  );
}