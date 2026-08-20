"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bookmark as BookmarkIcon,
  BookmarkCheck,
  Brain,
  Gauge,
  Maximize2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  StickyNote,
  X,
} from "lucide-react";
import { audioUrl, RECITERS } from "@/lib/audio";
import { getPref, setPref } from "@/lib/prefs";
import type { Word } from "@/lib/words";
import {
  addHistory,
  ayahKey,
  getAllNotes,
  getBookmarks,
  setNote,
  toggleBookmark,
  type Bookmark,
} from "@/lib/notes";

export type TranslationMode = "arabic" | "urdu" | "roman" | "english" | "all";

export type ReaderItem = {
  s: number;
  n: number;
  a: string;
  u: string;
  e: string;
  sajdah: boolean;
  r?: string;
};

const TRANSLATION_OPTIONS: { id: TranslationMode; label: string }[] = [
  { id: "arabic", label: "Arabic" },
  { id: "urdu", label: "Urdu" },
  { id: "roman", label: "Roman Urdu" },
  { id: "english", label: "English" },
  { id: "all", label: "Show All" },
];

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

type ReaderProps = {
  items: ReaderItem[];
  heading?: React.ReactNode;
  footerNav?: React.ReactNode;
  groupInfo?: { surah: number; english: string; arabic: string; ayahs: number }[];
  words?: Record<string, Word[]>;
  hasRoman?: boolean;
};

export function Reader({ items, heading, footerNav, groupInfo, words, hasRoman = false }: ReaderProps) {
  const [mode, setMode] = useState<TranslationMode>(() =>
    getPref("translation", "urdu")
  );
  const [reciter, setReciter] = useState<string>(() =>
    getPref("reciter", RECITERS[0].id)
  );
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [seeded, setSeeded] = useState(false);
  const [speed, setSpeed] = useState<number>(() => getPref("speed", 1));
  const [repeatMode, setRepeatMode] = useState<"off" | "ayah" | "section">("off");
  const [autoscroll, setAutoscroll] = useState<boolean>(() =>
    getPref("autoscroll", true)
  );
  const [focus, setFocus] = useState<boolean>(() => getPref("focus", false));
  const [wbw, setWbw] = useState(false);
  const [hifz, setHifz] = useState(false);
  const [hifzIndex, setHifzIndex] = useState(-1);
  const [hifzRevealed, setHifzRevealed] = useState(0);
  const [bookmarks, setBookmarks] = useState<Record<string, Bookmark>>(() =>
    getBookmarks()
  );
  const [notes, setNotes] = useState<Record<string, string>>(() => getAllNotes());
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => setPref("translation", mode), [mode]);
  useEffect(() => setPref("reciter", reciter), [reciter]);
  useEffect(() => setPref("speed", speed), [speed]);
  useEffect(() => setPref("autoscroll", autoscroll), [autoscroll]);
  useEffect(() => setPref("focus", focus), [focus]);

  useEffect(() => {
    const el = document.body;
    el.classList.toggle("noor-focus", focus);
    return () => el.classList.remove("noor-focus");
  }, [focus]);

  if (!seeded && typeof window !== "undefined") {
    const m = window.location.hash.match(/^#ayah-(\d+)-(\d+)$/);
    if (m) {
      const i = items.findIndex(
        (it) => it.s === Number(m[1]) && it.n === Number(m[2])
      );
      if (i >= 0) {
        setSeeded(true);
        setIndex(i);
      }
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.location.hash.match(/^#ayah-(\d+)-(\d+)$/);
    if (!m) return;
    const i = items.findIndex(
      (it) => it.s === Number(m[1]) && it.n === Number(m[2])
    );
    if (i >= 0) {
      requestAnimationFrame(() => {
        const el = document.getElementById(`ayah-${m[1]}-${m[2]}`);
        el?.scrollIntoView({ behavior: "instant", block: "center" });
      });
    }
  }, [items]);

  const hasWords = !!words && Object.keys(words).length > 0;
  const count = items.length;
  const current = items[index];
  const nameOf = (s: number) =>
    groupInfo?.find((g) => g.surah === s)?.english ?? `Surah ${s}`;
  const effMode: TranslationMode = focus ? "arabic" : mode;

  const recordHistory = (i: number) => {
    const a = items[i];
    if (a) addHistory({ s: a.s, n: a.n, surahName: nameOf(a.s) });
  };

  const playFrom = (i: number) => {
    setIndex(i);
    setPlaying(true);
    recordHistory(i);
  };

  const togglePlay = () => {
    if (!playing) recordHistory(index);
    setPlaying(!playing);
  };

  const toggleBookmarkFor = (a: ReaderItem) => {
    toggleBookmark({
      s: a.s,
      n: a.n,
      surahName: nameOf(a.s),
      a: a.a,
      u: a.u,
      e: a.e,
    });
    setBookmarks(getBookmarks());
  };

  const openNote = (a: ReaderItem) => {
    const k = ayahKey(a.s, a.n);
    setEditingNote(editingNote === k ? null : k);
    setNoteText(notes[k] ?? "");
  };

  const saveNote = (a: ReaderItem) => {
    const k = ayahKey(a.s, a.n);
    setNote(a.s, a.n, noteText);
    setNotes({ ...getAllNotes() });
    setEditingNote(null);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = audioUrl(reciter, current.s, current.n);
    audio.load();
    audio.playbackRate = speed;
  }, [reciter, current.s, current.n, speed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [playing, index]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      if (repeatMode === "ayah") {
        audio.currentTime = 0;
        audio.play();
        return;
      }
      if (index >= count - 1) {
        if (repeatMode === "section") {
          setIndex(0);
        } else {
          setPlaying(false);
        }
        return;
      }
      setIndex((i) => i + 1);
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [index, count, repeatMode]);

  useEffect(() => {
    if (!autoscroll || !playing) return;
    const el = document.getElementById(`ayah-${current.s}-${current.n}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [index, playing, autoscroll, current.s, current.n]);

  const showRoman = effMode === "roman" || effMode === "all";
  const showUrdu = effMode === "urdu" || effMode === "all";
  const showEnglish = effMode === "english" || effMode === "all";

  const renderArabic = (a: ReaderItem, i: number) => {
    const wbwWords = words?.[`${a.s}:${a.n}`];
    const wbwReal = wbwWords?.filter((wd) => wd && wd.w && !/^\(\d+\)$/.test(wd.e ?? ""));
    if (wbw && i === index && wbwReal && wbwReal.length > 0) {
      return (
        <div className="mt-6">
          <div className="mb-3 text-xs text-ink/45">
            Word by word · {wbwReal.length} words
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3" dir="rtl">
            {wbwReal.map((wd, wi) => (
              <div
                key={wi}
                className="rounded-xl border border-ink/10 bg-ivory/40 p-2.5 text-center"
              >
                <div className="quran-arabic text-xl leading-8 text-ink">{wd.w}</div>
                <div className="mt-1 text-[11px] font-medium text-forest" dir="ltr">
                  {wd.t}
                </div>
                <div className="mt-0.5 text-[11px] leading-4 text-ink/55" dir="ltr">
                  {wd.e}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (hifz && i === index) {
      const tokens = a.a.split(/\s+/);
      const revealedCount = hifzIndex === index ? hifzRevealed : 0;
      const revealed = tokens.slice(0, revealedCount);
      const hidden = tokens.slice(revealedCount);
      const revealWord = () => {
        setHifzIndex(index);
        setHifzRevealed((r) => Math.min(tokens.length, r + 1));
      };
      return (
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-ink/45">
            <span>
              Hifz · {revealedCount} / {tokens.length} words revealed
            </span>
            <div className="flex gap-2">
              <button
                onClick={revealWord}
                disabled={revealedCount >= tokens.length}
                className="rounded-full bg-forest px-3 py-1 font-medium text-white transition hover:opacity-90 disabled:opacity-40"
              >
                Reveal word
              </button>
              <button
                onClick={() => {
                  setHifzIndex(index);
                  setHifzRevealed(tokens.length);
                }}
                className="rounded-full bg-surface px-3 py-1 font-medium text-ink/60 transition hover:bg-ivory"
              >
                Reveal all
              </button>
            </div>
          </div>
          <div className="quran-arabic mt-4 flex flex-wrap justify-end gap-x-2 text-right text-3xl leading-[2.4] text-ink md:text-[2.5rem]">
            {revealed.length > 0 && (
              <span className="flex flex-wrap justify-end gap-x-2">
                {revealed.map((w, wi) => (
                  <span key={wi}>{w}</span>
                ))}
              </span>
            )}
            {hidden.map((w, wi) => (
              <span
                key={`h${wi}`}
                className="inline-block min-w-[3rem] rounded-md border-b-4 border-ink/20 bg-ink/5 text-transparent select-none"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="quran-arabic mt-6 text-right text-3xl leading-[2.4] text-ink md:text-[2.5rem]">
        {a.a}
      </div>
    );
  };

  return (
    <>
      {!focus && (
        <div className="glass sticky top-16 z-40 mt-6 rounded-2xl border border-ink/10 p-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-white transition hover:opacity-90"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause size={17} /> : <Play size={17} />}
              </button>
              <div>
                <div className="text-sm font-medium">Recitation</div>
                <select
                  value={reciter}
                  onChange={(e) => setReciter(e.target.value)}
                  className="rounded-md border border-ink/10 bg-surface px-1.5 py-0.5 text-xs text-ink/60"
                  aria-label="Reciter"
                >
                  {RECITERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIndex(Math.max(0, index - 1))}
                disabled={index <= 0}
                className="rounded-xl p-2 text-ink/55 transition hover:bg-surface disabled:opacity-30"
                aria-label="Previous ayah"
              >
                <SkipBack size={17} />
              </button>
              <button
                onClick={() => setIndex(Math.min(count - 1, index + 1))}
                disabled={index >= count - 1}
                className="rounded-xl p-2 text-ink/55 transition hover:bg-surface disabled:opacity-30"
                aria-label="Next ayah"
              >
                <SkipForward size={17} />
              </button>
              <button
                onClick={() =>
                  setRepeatMode(
                    repeatMode === "off"
                      ? "ayah"
                      : repeatMode === "ayah"
                        ? "section"
                        : "off"
                  )
                }
                className={`rounded-xl p-2 transition hover:bg-surface ${
                  repeatMode !== "off" ? "text-gold" : "text-ink/55"
                }`}
                aria-label="Repeat"
                title={
                  repeatMode === "ayah"
                    ? "Repeat ayah"
                    : repeatMode === "section"
                      ? "Repeat section"
                      : "Repeat off"
                }
              >
                {repeatMode === "ayah" ? <Repeat1 size={17} /> : <Repeat size={17} />}
              </button>
              <button
                onClick={() =>
                  setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])
                }
                className={`rounded-xl p-2 transition hover:bg-surface ${
                  speed !== 1 ? "text-gold" : "text-ink/55"
                }`}
                aria-label="Playback speed"
              >
                <Gauge size={17} />
                <span className="ml-0.5 text-[10px] font-semibold">{speed}×</span>
              </button>
              <button
                onClick={() => setAutoscroll(!autoscroll)}
                className={`rounded-xl p-2 transition hover:bg-surface ${
                  autoscroll ? "text-gold" : "text-ink/55"
                }`}
                aria-label="Auto-scroll"
                title="Auto-scroll with recitation"
              >
                <SlidersHorizontal size={17} />
              </button>
              <button
                onClick={() => setHifz(!hifz)}
                className={`rounded-xl p-2 transition hover:bg-surface ${
                  hifz ? "text-gold" : "text-ink/55"
                }`}
                aria-label="Hifz (memorization) mode"
                title="Hifz mode: reveal words as you memorise"
              >
                <Brain size={17} />
              </button>
              <button
                onClick={() => setFocus(true)}
                className="rounded-xl p-2 text-ink/55 transition hover:bg-surface"
                aria-label="Focus / Mushaf mode"
                title="Distraction-free Mushaf reading"
              >
                <Maximize2 size={17} />
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-ink/5 pt-2">
            <div className="flex flex-wrap items-center gap-1">
              {TRANSLATION_OPTIONS.map((opt) => {
                const disabled = opt.id === "roman" && !hasRoman;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setMode(opt.id)}
                    disabled={disabled}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      mode === opt.id
                        ? "bg-forest text-white"
                        : "bg-surface text-ink/60 hover:bg-ivory"
                    } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                    title={disabled ? "Roman Urdu translation coming soon" : undefined}
                  >
                    {opt.label}
                  </button>
                );
              })}
              <button
                onClick={() => setWbw(!wbw)}
                disabled={!hasWords}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  wbw
                    ? "bg-forest text-white"
                    : "bg-surface text-ink/60 hover:bg-ivory"
                } ${!hasWords ? "cursor-not-allowed opacity-40" : ""}`}
                title={hasWords ? "Word by word meanings (English)" : "Word-by-word data not available"}
              >
                Word by Word
              </button>
            </div>
            <div className="text-xs text-ink/45">
              Ayah {index + 1} of {count}
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} preload="auto" />

      <section className={`mt-6 space-y-5 ${focus ? "mt-10 md:mt-14" : ""}`}>
        {!focus && heading}

        {items.map((a, i) => {
          const active = i === index && playing;
          const newSurah = i === 0 || items[i - 1].s !== a.s;
          const info = groupInfo?.find((g) => g.surah === a.s);
          const bmKey = ayahKey(a.s, a.n);
          const hasNote = (notes[bmKey] ?? "").trim() !== "";
          return (
            <div key={`${a.s}-${a.n}`}>
              {newSurah && info && !focus && (
                <div className="sticky top-[215px] z-30 flex items-center justify-between rounded-2xl border border-ink/10 bg-surface/90 px-4 py-2 shadow-sm backdrop-blur md:top-40">
                  <span className="text-sm font-semibold">
                    {info.english}{" "}
                    <span className="text-ink/40">· {info.ayahs} Ayahs</span>
                  </span>
                  <span className="quran-arabic text-lg text-forest">{info.arabic}</span>
                </div>
              )}
              <article
                id={`ayah-${a.s}-${a.n}`}
                onClick={() => playFrom(i)}
                className={`cursor-pointer rounded-[1.75rem] border p-6 transition md:p-8 ${
                  active
                    ? "border-gold/60 bg-surface shadow-soft ring-1 ring-gold/30"
                    : "border-ink/10 bg-surface hover:border-gold/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                      active ? "bg-gold text-white" : "bg-ivory text-forest"
                    }`}
                  >
                    {a.n}
                  </span>
                  <div className="flex items-center gap-2">
                    {a.sajdah && (
                      <span
                        className="text-xs text-gold"
                        title="Sajdah (prostration)"
                      >
                        ۩ سجدہ
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmarkFor(a);
                      }}
                      className={`rounded-lg p-1.5 transition hover:bg-ivory ${
                        bookmarks[bmKey] ? "text-gold" : "text-ink/40"
                      }`}
                      aria-label={bookmarks[bmKey] ? "Remove bookmark" : "Bookmark"}
                      title="Bookmark this ayah"
                    >
                      {bookmarks[bmKey] ? (
                        <BookmarkCheck size={16} />
                      ) : (
                        <BookmarkIcon size={16} />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openNote(a);
                      }}
                      className={`rounded-lg p-1.5 transition hover:bg-ivory ${
                        hasNote ? "text-forest" : "text-ink/40"
                      }`}
                      aria-label="Note"
                      title="Add a note to this ayah"
                    >
                      <StickyNote size={16} />
                    </button>
                  </div>
                </div>

                {renderArabic(a, i)}

                {editingNote === bmKey && (
                  <div
                    className="mt-4 rounded-xl border border-ink/10 bg-ivory/50 p-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                      className="w-full resize-y rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none"
                      placeholder="Write your reflection or note..."
                      autoFocus
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => setEditingNote(null)}
                        className="rounded-full px-3 py-1 text-xs font-medium text-ink/60 transition hover:bg-surface"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveNote(a)}
                        className="rounded-full bg-forest px-3 py-1 text-xs font-medium text-white transition hover:opacity-90"
                      >
                        Save note
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-4 border-t border-ink/5 pt-5">
                  {showUrdu && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-forest">
                        اردو ترجمہ
                      </div>
                      <p
                        className="mt-1.5 text-right text-lg leading-8 text-ink/80"
                        dir="rtl"
                      >
                        {a.u}
                      </p>
                    </div>
                  )}
                  {showEnglish && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-forest">
                        English
                      </div>
                      <p className="mt-1.5 leading-7 text-ink/65">{a.e}</p>
                    </div>
                  )}
                  {showRoman && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-forest">
                        Roman Urdu
                      </div>
                      <p className="mt-1.5 leading-7 text-ink/65" dir="ltr">
                        {a.r ?? "Roman Urdu translation coming soon."}
                      </p>
                    </div>
                  )}
                </div>
              </article>
            </div>
          );
        })}
      </section>

      {!focus && footerNav}

      {focus && (
        <>
          <button
            onClick={() => setFocus(false)}
            className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-forest text-white shadow-soft transition hover:opacity-90"
            aria-label="Exit focus mode"
            title="Exit focus mode"
          >
            <X size={18} />
          </button>
          <div className="pointer-events-none fixed bottom-7 left-6 z-40 hidden text-xs font-medium text-ink/40 md:block">
            {nameOf(current.s)} {current.s}:{current.n}
          </div>
        </>
      )}
    </>
  );
}