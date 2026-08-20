"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Loader2,
  MessagesSquare,
  Send,
  Sparkles,
} from "lucide-react";

type QuranRef = {
  surah: number;
  ayah: number;
  surahName: string;
  arabic: string;
  urdu: string;
  english: string;
};

type HadithRef = {
  book: string;
  bookId: "bukhari" | "muslim";
  number: number;
  text: string;
  grade?: string;
  chapter?: string;
};

type Answer = {
  question: string;
  answer: string;
  quran: QuranRef[];
  hadith: HadithRef[];
};

type Msg =
  | { role: "user"; text: string }
  | { role: "assistant"; answer: Answer };

const SUGGESTIONS = [
  "Sabr kya hai aur iska kya fayda?",
  "Namaz ki ahmiyat Quran aur hadith ki roshni mein",
  "Maa baap ke huqooq ke baare mein batayein",
  "Zakat kis par farz hai aur kahan deni chahiye?",
  "Musibat mein sabr aur dua ka kya hukm hai?",
];

export default function AskPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, loading]);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || loading) return;
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    setNotConfigured(false);
    setError("");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (res.status === 501) {
        setNotConfigured(true);
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Something went wrong. Please try again.");
        return;
      }
      const data = (await res.json()) as Answer;
      setMsgs((m) => [...m, { role: "assistant", answer: data }]);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-5 pb-32 pt-10 md:px-8">
      <header className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-surface/60 px-4 py-2 text-sm text-forest">
          <Sparkles size={16} /> Ask · Quran & Hadith
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
          Apna sawal poochein
        </h1>
        <p className="mt-2 text-ink/60">
          Jawab Quran ki ayaat aur Sahih Bukhari / Muslim ki hadith ke hawaalon
          ke saath diya jata hai.
        </p>
      </header>

      {msgs.length === 0 && !loading && (
        <div className="mb-6 grid gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="card-hover rounded-2xl border border-ink/10 bg-surface p-4 text-left text-sm text-ink/70 hover:border-gold/40 hover:bg-ivory"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-forest px-4 py-3 text-sm leading-6 text-white">
                {m.text}
              </div>
            </div>
          ) : (
            <AnswerCard key={i} answer={m.answer} />
          )
        )}

        {loading && (
          <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-surface p-4 text-sm text-ink/55">
            <Loader2 size={18} className="animate-spin text-forest" />
            Quran aur hadith se jawab tayyar ho raha hai…
          </div>
        )}

        {notConfigured && (
          <div className="rounded-2xl border border-gold/40 bg-surface p-5 text-sm leading-6">
            <div className="font-semibold text-forest">AI Q&A abhi configured nahi hai</div>
            <p className="mt-1 text-ink/60">
              Admin ne <code className="rounded bg-ivory px-1">AI_API_KEY</code> set nahi kiya. Vercel
              dashboard → Settings → Environment Variables mein free key (jaise
              Groq ya Gemini) add kar ke Redeploy karein. Sirf Quran aur hadith ke
              hawaale hi diye jaate hain — text kabhi change nahi hota.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="glass fixed inset-x-0 bottom-16 z-40 border-t border-ink/10 p-3 md:bottom-0 md:border-0 md:bg-transparent md:backdrop-blur-none md:pt-0"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Sawal poochein… e.g. Rozay ki fazilat"
            className="h-12 flex-1 rounded-full border border-ink/10 bg-surface px-4 text-sm text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-white transition hover:opacity-90 disabled:opacity-40"
            aria-label="Ask"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </form>
    </main>
  );
}

function AnswerCard({ answer }: { answer: Answer }) {
  return (
    <div className="fade-up rounded-2xl rounded-tl-md border border-ink/10 bg-surface p-5 shadow-soft">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
        <MessagesSquare size={14} /> Jawab
      </div>
      <p className="whitespace-pre-wrap text-sm leading-7 text-ink/80">{answer.answer}</p>

      {(answer.quran.length > 0 || answer.hadith.length > 0) && (
        <div className="mt-5 space-y-4 border-t border-ink/5 pt-4">
          {answer.quran.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-forest">
                <BookOpenText size={14} /> Quran references
              </div>
              <div className="space-y-2">
                {answer.quran.map((r) => (
                  <Link
                    key={`${r.surah}:${r.ayah}`}
                    href={`/quran/${r.surah}#ayah-${r.surah}-${r.ayah}`}
                    className="block rounded-xl border border-ink/10 bg-ivory/50 p-3 transition hover:border-gold/40 hover:bg-ivory"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-forest">
                        {r.surahName} {r.surah}:{r.ayah}
                      </span>
                      <ArrowRight size={14} className="text-ink/40" />
                    </div>
                    <div className="quran-arabic mt-2 text-lg leading-9 text-ink/85">
                      {r.arabic}
                    </div>
                    <p className="mt-2 text-xs leading-6 text-ink/55" dir="rtl">
                      {r.urdu}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {answer.hadith.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-forest">
                <Sparkles size={14} /> Hadith references
              </div>
              <div className="space-y-2">
                {answer.hadith.map((h) => (
                  <div
                    key={`${h.bookId}:${h.number}`}
                    className="rounded-xl border border-ink/10 bg-ivory/50 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-forest px-2 py-0.5 font-medium text-white">
                        {h.book} · {h.number}
                      </span>
                      {h.chapter && <span className="text-ink/45">{h.chapter}</span>}
                      {h.grade && <span className="text-gold">{h.grade}</span>}
                    </div>
                    <p className="mt-2 text-xs leading-6 text-ink/70">
                      {h.text.length > 300 ? h.text.slice(0, 300) + "…" : h.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}