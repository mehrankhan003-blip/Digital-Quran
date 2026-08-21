import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Bookmark,
  Headphones,
  Languages,
  MessagesSquare,
  Sparkles,
} from "lucide-react";
import { getSurahs } from "@/lib/quran";
import { HomeWidgets } from "@/components/HomeWidgets";

export default function HomePage() {
  const surahs = getSurahs();
  const featured = [1, 2, 36, 55, 67, 112].map((n) => surahs[n - 1]);

  return (
    <main>
      {/* Hero — mobile-first */}
      <section className="hero-glow relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-32 h-80 w-80 rounded-full bg-forest/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-5 md:px-8 md:pb-20 md:pt-20">
          <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-12">
            <div className="fade-up">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-surface/60 px-3.5 py-1.5 text-xs text-forest sm:text-sm">
                <Sparkles size={14} /> The complete Quran, deeply accessible
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Read with presence.
                <br />
                <span className="gradient-text">Listen with peace.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink/65 sm:mt-5 sm:text-lg sm:leading-8">
                All 114 Surahs · 6,236 Ayahs with Uthmani Arabic, Urdu, Roman
                Urdu & English — plus{" "}
                <span className="font-medium text-ink/80">
                  Arabic + Urdu tarjuma recitation
                </span>{" "}
                with word-by-word highlighting, and AI-powered Q&A.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:mt-8 sm:gap-3">
                <Link
                  href="/quran"
                  className="group inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift sm:px-6 sm:py-3"
                >
                  <BookOpen size={16} /> Open Quran
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/ask"
                  className="group inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift sm:px-6 sm:py-3"
                >
                  <MessagesSquare size={16} /> Ask & Learn
                </Link>
                <Link
                  href="/quran/1"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface/80 px-5 py-2.5 text-sm font-medium transition-colors hover:border-gold/40 sm:px-6 sm:py-3"
                >
                  Start reading
                </Link>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-2 sm:mt-9 sm:flex sm:flex-wrap sm:gap-2.5">
                {[
                  { n: "114", label: "Surahs", icon: BookOpen },
                  { n: "6,236", label: "Ayahs", icon: Languages },
                  { n: "30", label: "Juz", icon: Bookmark },
                  { n: "8", label: "Reciters", icon: Headphones },
                  { n: "3", label: "Translations", icon: AudioLines },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className="fade-up flex items-center gap-2.5 rounded-2xl border border-ink/10 bg-surface/80 px-3.5 py-2.5 shadow-sm"
                    style={{ animationDelay: `${200 + i * 70}ms` }}
                  >
                    <s.icon size={15} className="shrink-0 text-gold" />
                    <span className="text-sm">
                      <span className="font-semibold text-forest">{s.n}</span>{" "}
                      <span className="text-ink/50">{s.label}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured ayah card */}
            <div className="fade-up relative" style={{ animationDelay: "150ms" }}>
              <div className="rounded-[1.75rem] bg-gradient-to-br from-gold/40 via-transparent to-forest/30 p-px md:rounded-[2rem]">
                <div className="rounded-[1.75rem] bg-surface p-6 shadow-lift sm:p-8 md:rounded-[2rem] md:p-10">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.25em] text-gold sm:text-xs">
                      <span className="h-px w-6 bg-gold/40" /> Al-Fatihah
                      <span className="h-px w-6 bg-gold/40" />
                    </div>
                    <div className="quran-arabic mt-5 text-[2rem] leading-[1.9] text-forest sm:mt-6 sm:text-[2.5rem] md:text-[3rem]">
                      ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ
                    </div>
                    <p className="mt-4 text-sm leading-7 text-ink/55 sm:mt-5">
                      All praise is for Allah — Lord of the worlds.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-ink/45 sm:mt-7">
                      <span className="rounded-full bg-ivory px-3 py-1">Arabic</span>
                      <span className="rounded-full bg-ivory px-3 py-1">Urdu</span>
                      <span className="rounded-full bg-ivory px-3 py-1">Roman Urdu</span>
                      <span className="rounded-full bg-ivory px-3 py-1">Recite</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-ink/5 bg-surface/45">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-8 sm:grid-cols-2 sm:px-5 md:grid-cols-3 md:gap-4 md:px-8 md:py-10">
          <Feature
            icon={<BookOpen />}
            title="Beautiful reading"
            text="Mushaf-inspired focus, verse-by-verse, with Juz, Hizb & Manzil navigation. Resume exactly where you left off."
            delay={0}
          />
          <Feature
            icon={<Languages />}
            title="Understand deeply"
            text="Arabic with Urdu, Roman Urdu & English layers — switch or show them all, with word-by-word meanings."
            delay={60}
          />
          <Feature
            icon={<Headphones />}
            title="Listen & follow"
            text="Ayah-synchronized recitation with glowing highlight, auto-scroll, repeat and playback speed."
            delay={120}
          />
          <Feature
            icon={<AudioLines />}
            title="Arabic + Urdu recitation"
            text="Har ayah ke saath Shamshad Ali Khan ka Urdu tarjuma — dono par word-by-word animation chalti hai."
            delay={180}
          />
          <Feature
            icon={<MessagesSquare />}
            title="Ask & learn"
            text="AI answers with citations from the Quran and Sahih Bukhari & Muslim — never fabricated."
            delay={240}
          />
          <Feature
            icon={<Bookmark />}
            title="Reflect & return"
            text="Bookmarks, notes, history, Hifz mode and a distraction-free Mushaf view for deep reading."
            delay={300}
          />
        </div>
      </section>

      <HomeWidgets />

      {/* Featured surahs */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-5 md:px-8 md:py-16">
        <div className="mb-6 flex items-end justify-between md:mb-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[.2em] text-gold sm:text-sm">
              Explore
            </p>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight sm:mt-2 sm:text-3xl">
              Begin your reading
            </h2>
          </div>
          <Link
            href="/quran"
            className="group flex items-center gap-1.5 text-sm font-medium text-forest"
          >
            All Surahs{" "}
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s, idx) => (
            <Link
              key={s.number}
              href={`/quran/${s.number}`}
              className="card-hover fade-up group rounded-2xl border border-ink/10 bg-surface p-4 sm:p-5"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ivory text-sm font-semibold text-forest transition-colors group-hover:bg-forest group-hover:text-white">
                  {s.number}
                </span>
                <span className="quran-arabic text-2xl text-forest transition-transform duration-300 group-hover:scale-110">
                  {s.arabic}
                </span>
              </div>
              <div className="mt-3.5 sm:mt-4">
                <div className="font-semibold">{s.english}</div>
                <div className="mt-1 text-sm text-ink/45">
                  {s.translation} · {s.ayahs} Ayahs · Juz {s.juzStart}
                </div>
              </div>
              <div className="ornament-rule mt-3.5 sm:mt-4" />
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-ink/40">Recite · Read · Reflect</span>
                <ArrowRight
                  size={14}
                  className="text-forest opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  delay: number;
}) {
  return (
    <div
      className="card-hover fade-up rounded-2xl border border-ink/5 bg-surface/60 p-4 sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl bg-gold/12 text-gold sm:mb-4">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-ink/55 sm:mt-2">{text}</p>
    </div>
  );
}
