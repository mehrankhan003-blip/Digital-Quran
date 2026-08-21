"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioLines,
  Bookmark as BookmarkIcon,
  BookmarkCheck,
  Brain,
  ChevronUp,
  Gauge,
  Languages,
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
import {
  arabicAudioUrl,
  urduAudioUrl,
  RECITERS,
  reciterName,
  DEFAULT_ARABIC_RECITER,
} from "@/lib/audio";
import { getPref, setPref } from "@/lib/prefs";
import type { Word } from "@/lib/words";
import {
  addHistory,
  ayahKey,
  getAllNotes,
  getBookmarks,
  getHistory,
  setNote,
  toggleBookmark,
  type Bookmark,
} from "@/lib/notes";

export type TranslationMode = "arabic" | "urdu" | "roman" | "english" | "all";

/**
 * Recitation pipeline per ayah:
 * - "arabic"      → Arabic recitation only
 * - "arabic-urdu" → Arabic recitation, then Urdu tarjuma (Shamshad Ali Khan)
 * - "urdu"        → Urdu tarjuma only
 */
export type ReciteMode = "arabic" | "arabic-urdu" | "urdu";

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
  { id: "roman", label: "Roman" },
  { id: "english", label: "English" },
  { id: "all", label: "All" },
];

const RECITE_OPTIONS: { id: ReciteMode; label: string; hint: string }[] = [
  { id: "arabic", label: "Arabic", hint: "Arabic recitation only" },
  { id: "arabic-urdu", label: "Arabic + Urdu", hint: "Arabic recitation followed by Urdu tarjuma (Shamshad Ali Khan)" },
  { id: "urdu", label: "Urdu only", hint: "Urdu tarjuma recitation only (Shamshad Ali Khan)" },
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

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function isRealWord(wd: Word | undefined): boolean {
  return !!wd && !!wd.w && !/^\(\d+\)$/.test(wd.e ?? "");
}

export function Reader({ items, heading, footerNav, groupInfo, words, hasRoman = false }: ReaderProps) {
  // ---- persisted preferences -------------------------------------------
  const [init] = useState(() => {
    const savedReciter: string = getPref("reciter", RECITERS[0].id);
    // Migration: ur.khan used to be a standalone reciter (Urdu-only audio).
    // It is now the Urdu voice of the dual recitation engine.
    if (savedReciter === "ur.khan") {
      return { reciter: DEFAULT_ARABIC_RECITER, recite: "urdu" as ReciteMode };
    }
    const savedRecite = getPref<ReciteMode>("recite", "arabic-urdu");
    const recite: ReciteMode =
      savedRecite === "arabic" || savedRecite === "urdu" || savedRecite === "arabic-urdu"
        ? savedRecite
        : "arabic-urdu";
    return { reciter: savedReciter, recite };
  });

  const [mode, setMode] = useState<TranslationMode>(() => getPref("translation", "urdu"));
  const [reciter, setReciter] = useState<string>(init.reciter);
  const [reciteMode, setReciteMode] = useState<ReciteMode>(init.recite);
  const [speed, setSpeed] = useState<number>(() => getPref("speed", 1));
  const [autoscroll, setAutoscroll] = useState<boolean>(() => getPref("autoscroll", true));
  const [focus, setFocus] = useState<boolean>(() => getPref("focus", false));

  // ---- playback state ----------------------------------------------------
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"arabic" | "urdu">(() =>
    init.recite === "urdu" ? "urdu" : "arabic"
  );
  // Word highlight carries the ayah index it belongs to, so a stale highlight
  // from a previous ayah never renders (no reset-in-effect needed).
  const [activeWord, setActiveWord] = useState<{ i: number; w: number } | null>(null);
  const [activeWbwWord, setActiveWbwWord] = useState<{ i: number; w: number } | null>(null);
  const [repeatMode, setRepeatMode] = useState<"off" | "ayah" | "section">("off");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [audioError, setAudioError] = useState("");

  // ---- reading modes -------------------------------------------------------
  const [wbw, setWbw] = useState(false);
  const [hifz, setHifz] = useState(false);
  const [hifzIndex, setHifzIndex] = useState(-1);
  const [hifzRevealed, setHifzRevealed] = useState(0);

  // ---- seeding / resume ----------------------------------------------------
  const [seeded, setSeeded] = useState(false);
  const [resumed, setResumed] = useState(false);

  // ---- bookmarks & notes -----------------------------------------------------
  const [bookmarks, setBookmarks] = useState<Record<string, Bookmark>>(() => getBookmarks());
  const [notes, setNotes] = useState<Record<string, string>>(() => getAllNotes());
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  // ---- refs ------------------------------------------------------------------
  const arabicRef = useRef<HTMLAudioElement | null>(null);
  const urduRef = useRef<HTMLAudioElement | null>(null);
  const indexRef = useRef(index);
  const countRef = useRef(items.length);
  const playingRef = useRef(playing);
  const repeatModeRef = useRef(repeatMode);
  const reciteModeRef = useRef(reciteMode);
  const arWordCountRef = useRef(0);
  const urWordCountRef = useRef(0);
  const wbwCountRef = useRef(0);

  useEffect(() => { indexRef.current = index; }, [index]);
  useEffect(() => { countRef.current = items.length; }, [items.length]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { reciteModeRef.current = reciteMode; }, [reciteMode]);

  useEffect(() => setPref("translation", mode), [mode]);
  useEffect(() => setPref("reciter", reciter), [reciter]);
  useEffect(() => setPref("speed", speed), [speed]);
  useEffect(() => setPref("autoscroll", autoscroll), [autoscroll]);
  useEffect(() => setPref("focus", focus), [focus]);
  useEffect(() => setPref("recite", reciteMode), [reciteMode]);

  useEffect(() => {
    const el = document.body;
    el.classList.toggle("noor-focus", focus);
    return () => el.classList.remove("noor-focus");
  }, [focus]);

  const count = items.length;
  const current = items[index];
  const nameOf = (s: number) =>
    groupInfo?.find((g) => g.surah === s)?.english ?? `Surah ${s}`;

  // ---- seed from #ayah hash or last-read history -----------------------------
  if (!seeded && typeof window !== "undefined") {
    const m = window.location.hash.match(/^#ayah-(\d+)-(\d+)$/);
    if (m) {
      const i = items.findIndex((it) => it.s === Number(m[1]) && it.n === Number(m[2]));
      setSeeded(true);
      if (i >= 0) setIndex(i);
    } else {
      const hist = getHistory();
      if (hist.length > 0) {
        const last = hist[0];
        const i = items.findIndex((it) => it.s === last.s && it.n === last.n);
        if (i >= 0) {
          setIndex(i);
          setResumed(true);
        }
      }
      setSeeded(true);
    }
  }

  useEffect(() => {
    if (!resumed || typeof window === "undefined") return;
    const a = items[index];
    if (!a) return;
    const t = window.setTimeout(() => setResumed(false), 6000);
    requestAnimationFrame(() => {
      document
        .getElementById(`ayah-${a.s}-${a.n}`)
        ?.scrollIntoView({ behavior: "instant", block: "center" });
    });
    return () => window.clearTimeout(t);
  }, [resumed, index, items]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.location.hash.match(/^#ayah-(\d+)-(\d+)$/);
    if (!m) return;
    const i = items.findIndex((it) => it.s === Number(m[1]) && it.n === Number(m[2]));
    if (i >= 0) {
      requestAnimationFrame(() => {
        document
          .getElementById(`ayah-${m[1]}-${m[2]}`)
          ?.scrollIntoView({ behavior: "instant", block: "center" });
      });
    }
  }, [items]);

  // ---- helpers -----------------------------------------------------------------
  const recordHistory = (i: number) => {
    const a = items[i];
    if (a) addHistory({ s: a.s, n: a.n, surahName: nameOf(a.s) });
  };

  const playFrom = (i: number) => {
    setAudioError("");
    setIndex(i);
    setPlaying(true);
    recordHistory(i);
  };

  const togglePlay = () => {
    if (!playing) recordHistory(index);
    setAudioError("");
    setPlaying(!playing);
  };

  const updateProgressBars = useCallback((ratio: number) => {
    if (typeof document === "undefined") return;
    const pct = `${Math.max(0, Math.min(100, ratio * 100)).toFixed(2)}%`;
    document
      .querySelectorAll<HTMLElement>("[data-player-progress]")
      .forEach((el) => {
        el.style.width = pct;
      });
  }, []);

  // ---- word counts for the current ayah (for highlighting sync) -------------
  useEffect(() => {
    const item = items[index];
    arWordCountRef.current = item ? splitWords(item.a).length : 0;
    urWordCountRef.current = item ? splitWords(item.u).length : 0;
    const wbwWords = item ? words?.[`${item.s}:${item.n}`]?.filter(isRealWord) : undefined;
    wbwCountRef.current = wbwWords?.length ?? 0;
    updateProgressBars(0);
  }, [index, items, words, updateProgressBars]);

  // Effective audio phase: forced by recite mode, otherwise the dual pipeline state.
  const effPhase: "arabic" | "urdu" =
    reciteMode === "urdu" ? "urdu" : reciteMode === "arabic" ? "arabic" : phase;

  // ---- audio engine -------------------------------------------------------------
  // Load sources whenever the ayah / reciter / recite-mode changes.
  useEffect(() => {
    const a = arabicRef.current;
    const u = urduRef.current;
    const item = items[index];
    if (!a || !u || !item) return;

    if (reciteMode !== "urdu") {
      a.src = arabicAudioUrl(reciter, item.s, item.n);
      a.load();
      a.playbackRate = speed;
    } else {
      a.pause();
    }

    if (reciteMode !== "arabic") {
      u.src = urduAudioUrl(item.s, item.n);
      u.load();
      u.playbackRate = speed;
    } else {
      u.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, reciter, reciteMode, items]);

  // Play / pause the active phase.
  useEffect(() => {
    const a = arabicRef.current;
    const u = urduRef.current;
    if (!a || !u) return;
    if (!playing) {
      a.pause();
      u.pause();
      return;
    }
    const target = effPhase === "urdu" ? u : a;
    const other = effPhase === "urdu" ? a : u;
    other.pause();
    target.playbackRate = speed;
    target.play().catch(() => {
      if (playingRef.current) setPlaying(false);
    });
  }, [playing, index, effPhase, reciter, reciteMode, speed]);

  // Stable playback handlers (attached once).
  const advance = useCallback(() => {
    const i = indexRef.current;
    if (i >= countRef.current - 1) {
      if (repeatModeRef.current === "section") {
        setIndex(0);
      } else {
        setPlaying(false);
      }
      return;
    }
    setIndex(i + 1);
  }, []);

  const onArabicEnded = useCallback(() => {
    if (!playingRef.current) return;
    if (reciteModeRef.current === "arabic") {
      if (repeatModeRef.current === "ayah") {
        const a = arabicRef.current;
        if (a) {
          a.currentTime = 0;
          void a.play();
        }
        return;
      }
      advance();
      return;
    }
    // Dual mode → Urdu tarjuma phase.
    setPhase("urdu");
  }, [advance]);

  const onUrduEnded = useCallback(() => {
    if (!playingRef.current) return;
    if (reciteModeRef.current === "urdu") {
      if (repeatModeRef.current === "ayah") {
        const u = urduRef.current;
        if (u) {
          u.currentTime = 0;
          void u.play();
        }
        return;
      }
      advance();
      return;
    }
    // Dual mode finished both parts.
    if (repeatModeRef.current === "ayah") {
      const a = arabicRef.current;
      if (a) a.currentTime = 0;
      setPhase("arabic");
      return;
    }
    advance();
  }, [advance]);

  const onArabicTime = useCallback(() => {
    const a = arabicRef.current;
    if (!a || !isFinite(a.duration) || a.duration <= 0) return;
    const ratio = a.currentTime / a.duration;
    updateProgressBars(ratio);
    const i = indexRef.current;
    const arCount = arWordCountRef.current;
    if (arCount > 0) {
      setActiveWord({ i, w: Math.min(arCount - 1, Math.floor(ratio * arCount)) });
    }
    const wbwCount = wbwCountRef.current;
    if (wbwCount > 0) {
      setActiveWbwWord({ i, w: Math.min(wbwCount - 1, Math.floor(ratio * wbwCount)) });
    }
  }, [updateProgressBars]);

  const onUrduTime = useCallback(() => {
    const u = urduRef.current;
    if (!u || !isFinite(u.duration) || u.duration <= 0) return;
    const ratio = u.currentTime / u.duration;
    updateProgressBars(ratio);
    const i = indexRef.current;
    const urCount = urWordCountRef.current;
    if (urCount > 0) {
      setActiveWord({ i, w: Math.min(urCount - 1, Math.floor(ratio * urCount)) });
    }
  }, [updateProgressBars]);

  const onArabicError = useCallback(() => {
    const a = arabicRef.current;
    if (!playingRef.current || !a || !a.error) return;
    setAudioError("Audio load nahi hua — network check karein ya doosra reciter chunein.");
    if (reciteModeRef.current === "arabic-urdu") {
      setPhase("urdu"); // fall back to the Urdu part
    } else {
      advance();
    }
  }, [advance]);

  const onUrduError = useCallback(() => {
    const u = urduRef.current;
    if (!playingRef.current || !u || !u.error) return;
    setAudioError("Urdu audio load nahi hua — network check karein.");
    advance();
  }, [advance]);

  useEffect(() => {
    const a = arabicRef.current;
    const u = urduRef.current;
    if (!a || !u) return;
    a.addEventListener("ended", onArabicEnded);
    u.addEventListener("ended", onUrduEnded);
    a.addEventListener("timeupdate", onArabicTime);
    u.addEventListener("timeupdate", onUrduTime);
    a.addEventListener("error", onArabicError);
    u.addEventListener("error", onUrduError);
    return () => {
      a.removeEventListener("ended", onArabicEnded);
      u.removeEventListener("ended", onUrduEnded);
      a.removeEventListener("timeupdate", onArabicTime);
      u.removeEventListener("timeupdate", onUrduTime);
      a.removeEventListener("error", onArabicError);
      u.removeEventListener("error", onUrduError);
    };
  }, [onArabicEnded, onUrduEnded, onArabicTime, onUrduTime, onArabicError, onUrduError]);

  // Stop everything on unmount.
  useEffect(() => {
    const a = arabicRef.current;
    const u = urduRef.current;
    return () => {
      a?.pause();
      u?.pause();
    };
  }, []);

  // ---- lock screen / media session ------------------------------------------
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const item = items[index];
    if (!item) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${nameOf(item.s)} — Ayah ${item.n}`,
        artist:
          reciteMode === "urdu"
            ? "Shamshad Ali Khan (Urdu Tarjuma)"
            : reciteMode === "arabic-urdu"
              ? `${reciterName(reciter)} + Shamshad Ali Khan`
              : reciterName(reciter),
        album: "Digital Quran",
      });
      navigator.mediaSession.setActionHandler("play", () => setPlaying(true));
      navigator.mediaSession.setActionHandler("pause", () => setPlaying(false));
      navigator.mediaSession.setActionHandler("previoustrack", () =>
        setIndex((i) => Math.max(0, i - 1))
      );
      navigator.mediaSession.setActionHandler("nexttrack", () =>
        setIndex((i) => Math.min(countRef.current - 1, i + 1))
      );
    } catch {
      // media session unsupported — ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items, reciter, reciteMode]);

  // ---- reading-history tracking on scroll ------------------------------------
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    let lastRecord = 0;
    let pending: string | null = null;
    let timer: number | null = null;
    const flush = () => {
      if (!pending) return;
      const [s, n] = pending.split("-").map(Number);
      const a = items.find((it) => it.s === s && it.n === n);
      if (a) {
        const meta = groupInfo?.find((g) => g.surah === a.s);
        addHistory({ s: a.s, n: a.n, surahName: meta?.english ?? `Surah ${a.s}` });
      }
      pending = null;
    };
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.5) {
            pending = e.target.id.replace("ayah-", "");
            const now = Date.now();
            if (now - lastRecord > 2000) {
              lastRecord = now;
              flush();
            } else if (timer === null) {
              timer = window.setTimeout(() => {
                timer = null;
                lastRecord = Date.now();
                flush();
              }, 2000);
            }
          }
        }
      },
      { rootMargin: "0px 0px -40% 0px" }
    );
    for (const it of items) {
      const el = document.getElementById(`ayah-${it.s}-${it.n}`);
      if (el) obs.observe(el);
    }
    return () => {
      obs.disconnect();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [items, groupInfo]);

  // ---- auto-scroll with recitation ---------------------------------------------
  useEffect(() => {
    if (!autoscroll || !playing) return;
    const el = document.getElementById(`ayah-${current?.s}-${current?.n}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [index, playing, autoscroll, current?.s, current?.n]);

  // ---- bookmarks & notes ----------------------------------------------------------
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

  // ---- render helpers ---------------------------------------------------------------
  const effMode: TranslationMode = focus ? "arabic" : mode;
  const showRoman = effMode === "roman" || effMode === "all";
  const showUrdu = effMode === "urdu" || effMode === "all";
  const showEnglish = effMode === "english" || effMode === "all";
  const hasWords = !!words && Object.keys(words).length > 0;

  const renderArabic = (a: ReaderItem, i: number) => {
    const wbwWords = words?.[`${a.s}:${a.n}`]?.filter(isRealWord);
    const isActiveAyah = i === index;
    const highlightAr = isActiveAyah && playing && effPhase === "arabic";
    const activeWbw = activeWbwWord?.i === i ? activeWbwWord.w : -1;

    if (wbw && isActiveAyah && wbwWords && wbwWords.length > 0) {
      return (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between text-xs text-ink/45">
            <span>Word by word · {wbwWords.length} words</span>
            {highlightAr && (
              <span className="eq text-gold" aria-hidden>
                <span /><span /><span /><span />
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" dir="rtl">
            {wbwWords.map((wd, wi) => (
              <div
                key={wi}
                className={`rounded-xl border p-2.5 text-center transition-all duration-300 ${
                  highlightAr && wi === activeWbw
                    ? "wbw-card-active border-gold/60 bg-gold/10 shadow-sm"
                    : "border-ink/10 bg-ivory/40"
                }`}
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

    if (hifz && isActiveAyah) {
      const tokens = splitWords(a.a);
      const revealedCount = hifzIndex === index ? hifzRevealed : 0;
      const revealed = tokens.slice(0, revealedCount);
      const hidden = tokens.slice(revealedCount);
      const revealWord = () => {
        setHifzIndex(index);
        setHifzRevealed((r) => Math.min(tokens.length, r + 1));
      };
      return (
        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink/45">
            <span>Hifz · {revealedCount} / {tokens.length} words</span>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  revealWord();
                }}
                disabled={revealedCount >= tokens.length}
                className="rounded-full bg-forest px-3 py-1 font-medium text-white transition hover:opacity-90 disabled:opacity-40"
              >
                Reveal word
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHifzIndex(index);
                  setHifzRevealed(tokens.length);
                }}
                className="rounded-full bg-surface px-3 py-1 font-medium text-ink/60 transition hover:bg-ivory"
              >
                Reveal all
              </button>
            </div>
          </div>
          <div className="quran-arabic mt-4 flex flex-wrap justify-end gap-x-2 text-right text-[1.75rem] leading-[2.3] text-ink md:text-[2.4rem]">
            {revealed.map((w, wi) => (
              <span key={wi}>{w}</span>
            ))}
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

    const tokens = splitWords(a.a);
    const activeAr = activeWord?.i === i ? activeWord.w : -1;
    return (
      <div className="quran-arabic mt-5 text-right text-[1.75rem] leading-[2.3] text-ink md:text-[2.4rem] md:leading-[2.1]">
        {tokens.map((t, ti) => (
          <span
            key={ti}
            className={`wbw-word ${highlightAr && ti === activeAr ? "wbw-word-active" : ""}`}
          >
            {t}
            {ti < tokens.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    );
  };

  const renderUrduText = (a: ReaderItem, i: number) => {
    const highlightUr = i === index && playing && effPhase === "urdu";
    if (!highlightUr) return a.u;
    const tokens = splitWords(a.u);
    const activeUr = activeWord?.i === i ? activeWord.w : -1;
    return (
      <>
        {tokens.map((t, ti) => (
          <span
            key={ti}
            className={`wbw-word ${ti === activeUr ? "wbw-word-active" : ""}`}
          >
            {t}
            {ti < tokens.length - 1 ? " " : ""}
          </span>
        ))}
      </>
    );
  };

  const phaseLabel =
    effPhase === "urdu" ? "Urdu tarjuma" : reciteMode === "urdu" ? "Urdu tarjuma" : "Arabic";

  // ================================================================================
  return (
    <>
      <audio ref={arabicRef} preload="auto" />
      <audio ref={urduRef} preload="auto" />

      {resumed && !focus && current && (
        <div className="fade-up fixed left-1/2 top-20 z-50 -translate-x-1/2 whitespace-nowrap rounded-full border border-gold/40 bg-surface px-4 py-2 text-xs font-medium text-forest shadow-soft">
          Resumed · Ayah {current.n} {nameOf(current.s)}
        </div>
      )}

      <section className={`space-y-4 md:space-y-5 ${focus ? "mt-2 md:mt-6" : "mt-5"}`}>
        {!focus && heading}

        {items.map((a, i) => {
          const active = i === index && playing;
          const urduActive = active && effPhase === "urdu";
          const newSurah = i === 0 || items[i - 1].s !== a.s;
          const info = groupInfo?.find((g) => g.surah === a.s);
          const bmKey = ayahKey(a.s, a.n);
          const hasNote = (notes[bmKey] ?? "").trim() !== "";
          return (
            <div key={`${a.s}-${a.n}`}>
              {newSurah && info && !focus && (
                <div className="sticky top-[4.4rem] z-30 flex items-center justify-between rounded-2xl border border-ink/10 bg-surface/90 px-4 py-2 shadow-sm backdrop-blur md:top-20">
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
                className={`cursor-pointer rounded-3xl border p-4 transition-all duration-300 sm:p-6 md:p-7 ${
                  active
                    ? "ayah-active border-gold/50 bg-surface shadow-soft ring-1 ring-gold/25"
                    : "border-ink/10 bg-surface hover:border-gold/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      active
                        ? "bg-gradient-to-br from-forest to-forest/80 text-white shadow-card"
                        : "bg-ivory text-forest"
                    }`}
                  >
                    {a.n}
                    {active && (
                      <span className="eq absolute -right-2.5 -top-1.5 text-gold" aria-hidden>
                        <span /><span /><span /><span />
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {a.sajdah && (
                      <span className="text-xs text-gold" title="Sajdah (prostration)">
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
                      {bookmarks[bmKey] ? <BookmarkCheck size={16} /> : <BookmarkIcon size={16} />}
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

                <div className="mt-4 space-y-2.5 border-t border-ink/5 pt-4">
                  {showUrdu && (
                    <div
                      className={`rounded-2xl p-3.5 transition-colors duration-300 ${
                        urduActive ? "urdu-speaking" : "bg-ivory/40"
                      }`}
                    >
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                          اردو ترجمہ
                        </span>
                        {urduActive && (
                          <span className="eq text-gold" aria-hidden>
                            <span /><span /><span />
                          </span>
                        )}
                      </div>
                      <p
                        className="text-right text-base leading-8 text-ink/80 md:text-lg"
                        dir="rtl"
                      >
                        {renderUrduText(a, i)}
                      </p>
                    </div>
                  )}
                  {showEnglish && (
                    <div className="rounded-2xl p-3.5">
                      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                        English
                      </div>
                      <p className="text-sm leading-7 text-ink/65 md:text-base">{a.e}</p>
                    </div>
                  )}
                  {showRoman && (
                    <div className="rounded-2xl p-3.5">
                      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                        Roman Urdu
                      </div>
                      <p className="text-sm leading-7 text-ink/65 md:text-base" dir="ltr">
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

      {/* ============ Mini player (mobile-first) ============ */}
      {!focus && current && (
        <div className="fixed inset-x-0 bottom-[calc(3.9rem+env(safe-area-inset-bottom))] z-40 px-3 md:bottom-5 md:left-1/2 md:w-[30rem] md:-translate-x-1/2 md:px-0">
          <div
            onClick={() => setSheetOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSheetOpen(true);
            }}
            className="glass-strong cursor-pointer rounded-2xl border border-ink/10 p-2.5 shadow-lift transition hover:border-gold/30"
            aria-label="Open player"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-card transition-transform active:scale-95 ${
                  playing
                    ? "bg-gradient-to-br from-gold to-gold/80"
                    : "bg-gradient-to-br from-forest to-forest/80"
                }`}
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause size={18} /> : <Play size={18} className="translate-x-[1px]" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">
                    {nameOf(current.s)} · Ayah {current.n}
                  </span>
                  {playing && (
                    <span className="eq shrink-0 text-forest" aria-hidden>
                      <span /><span /><span />
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink/50">
                  <span
                    className={`rounded-full px-1.5 py-px font-semibold ${
                      effPhase === "urdu" ? "bg-gold/15 text-gold" : "bg-forest/10 text-forest"
                    }`}
                  >
                    {playing ? phaseLabel : reciteMode === "arabic-urdu" ? "Arabic + Urdu" : reciteMode === "urdu" ? "Urdu" : "Arabic"}
                  </span>
                  <span className="truncate">
                    {reciteMode === "urdu" ? "Shamshad Ali Khan" : reciterName(reciter)}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(Math.max(0, index - 1));
                }}
                disabled={index <= 0}
                className="hidden rounded-xl p-2 text-ink/55 transition hover:bg-surface disabled:opacity-30 sm:block"
                aria-label="Previous ayah"
              >
                <SkipBack size={17} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(Math.min(count - 1, index + 1));
                }}
                disabled={index >= count - 1}
                className="hidden rounded-xl p-2 text-ink/55 transition hover:bg-surface disabled:opacity-30 sm:block"
                aria-label="Next ayah"
              >
                <SkipForward size={17} />
              </button>
              <ChevronUp size={18} className="shrink-0 text-ink/35" />
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10">
              <div
                data-player-progress
                className="h-full rounded-full bg-gradient-to-r from-forest to-gold transition-[width] duration-300 ease-linear"
                style={{ width: "0%" }}
              />
            </div>
          </div>
          {audioError && (
            <div className="mt-2 rounded-xl border border-red-300/60 bg-red-50/90 px-3 py-2 text-center text-[11px] font-medium text-red-700 dark:border-red-900 dark:bg-red-950/90 dark:text-red-300">
              {audioError}
            </div>
          )}
        </div>
      )}

      {/* ============ Player sheet (expanded controls) ============ */}
      {sheetOpen && !focus && current && (
        <div className="fixed inset-0 z-[70]">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
            aria-hidden
          />
          <div className="player-sheet absolute inset-x-0 bottom-0 mx-auto max-h-[88vh] w-full overflow-y-auto rounded-t-[1.75rem] border-t border-ink/10 bg-surface px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 shadow-lift md:bottom-5 md:max-w-lg md:rounded-[1.75rem] md:border">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink/15" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
                  Now reciting
                </div>
                <div className="mt-1 truncate text-lg font-semibold">
                  {nameOf(current.s)} · Ayah {current.n}
                </div>
                <div className="mt-0.5 text-xs text-ink/50">
                  Ayah {index + 1} of {count} ·{" "}
                  {reciteMode === "urdu" ? "Shamshad Ali Khan" : reciterName(reciter)}
                  {reciteMode === "arabic-urdu" && " + Shamshad Ali Khan (Urdu)"}
                </div>
              </div>
              <button
                onClick={() => setSheetOpen(false)}
                className="rounded-full bg-ivory p-2 text-ink/60 transition hover:bg-mist"
                aria-label="Close player"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
              <div
                data-player-progress
                className="h-full rounded-full bg-gradient-to-r from-forest to-gold transition-[width] duration-300 ease-linear"
                style={{ width: "0%" }}
              />
            </div>

            {/* transport */}
            <div className="mt-5 flex items-center justify-center gap-5">
              <button
                onClick={() => setIndex(Math.max(0, index - 1))}
                disabled={index <= 0}
                className="rounded-full bg-ivory p-3.5 text-ink/70 transition hover:bg-mist disabled:opacity-30"
                aria-label="Previous ayah"
              >
                <SkipBack size={20} />
              </button>
              <button
                onClick={togglePlay}
                className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lift transition-transform active:scale-95 ${
                  playing
                    ? "bg-gradient-to-br from-gold to-gold/80"
                    : "bg-gradient-to-br from-forest to-forest/80"
                }`}
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause size={26} /> : <Play size={26} className="translate-x-[2px]" />}
              </button>
              <button
                onClick={() => setIndex(Math.min(count - 1, index + 1))}
                disabled={index >= count - 1}
                className="rounded-full bg-ivory p-3.5 text-ink/70 transition hover:bg-mist disabled:opacity-30"
                aria-label="Next ayah"
              >
                <SkipForward size={20} />
              </button>
            </div>

            {/* recite mode */}
            <div className="mt-6">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink/60">
                <AudioLines size={14} className="text-gold" /> Recitation mode
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-2xl border border-ink/10 bg-ivory/60 p-1">
                {RECITE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setReciteMode(opt.id)}
                    title={opt.hint}
                    className={`rounded-xl px-2 py-2 text-xs font-semibold transition ${
                      reciteMode === opt.id
                        ? "bg-forest text-white shadow-sm"
                        : "text-ink/60 hover:bg-surface"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-4 text-ink/45">
                Arabic + Urdu: har ayah ke baad Shamshad Ali Khan ka Urdu tarjuma audio mein
                chalta hai — word-by-word highlighting dono par hoti hai.
              </p>
            </div>

            {/* reciter */}
            <div className="mt-5">
              <div className="mb-2 text-xs font-semibold text-ink/60">Arabic reciter</div>
              <select
                value={reciter}
                onChange={(e) => setReciter(e.target.value)}
                disabled={reciteMode === "urdu"}
                className="w-full cursor-pointer rounded-xl border border-ink/10 bg-surface px-3 py-2.5 text-sm font-medium text-forest disabled:opacity-40"
                aria-label="Reciter"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* speed + repeat */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink/60">
                  <Gauge size={13} className="text-gold" /> Speed
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        speed === s
                          ? "bg-forest text-white"
                          : "bg-ivory text-ink/60 hover:bg-mist"
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink/60">
                  <Repeat size={13} className="text-gold" /> Repeat
                </div>
                <div className="flex gap-1.5">
                  {(["off", "ayah", "section"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRepeatMode(r)}
                      className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                        repeatMode === r
                          ? "bg-gold text-white"
                          : "bg-ivory text-ink/60 hover:bg-mist"
                      }`}
                    >
                      {r === "ayah" ? <Repeat1 size={12} /> : null}
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* translation layers */}
            <div className="mt-5">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink/60">
                <Languages size={13} className="text-gold" /> Translation
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TRANSLATION_OPTIONS.map((opt) => {
                  const disabled = opt.id === "roman" && !hasRoman;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setMode(opt.id)}
                      disabled={disabled}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                        mode === opt.id
                          ? "bg-forest text-white"
                          : "bg-ivory text-ink/60 hover:bg-mist"
                      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* toggles */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setAutoscroll(!autoscroll)}
                className={`flex items-center justify-between rounded-2xl border px-3.5 py-3 text-left text-xs font-semibold transition ${
                  autoscroll
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-ink/10 bg-ivory/60 text-ink/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal size={14} /> Auto-scroll
                </span>
                <span>{autoscroll ? "On" : "Off"}</span>
              </button>
              <button
                onClick={() => setWbw(!wbw)}
                disabled={!hasWords}
                className={`flex items-center justify-between rounded-2xl border px-3.5 py-3 text-left text-xs font-semibold transition ${
                  wbw
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-ink/10 bg-ivory/60 text-ink/60"
                } ${!hasWords ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <span className="flex items-center gap-2">
                  <Languages size={14} /> Word by word
                </span>
                <span>{wbw ? "On" : "Off"}</span>
              </button>
              <button
                onClick={() => setHifz(!hifz)}
                className={`flex items-center justify-between rounded-2xl border px-3.5 py-3 text-left text-xs font-semibold transition ${
                  hifz
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-ink/10 bg-ivory/60 text-ink/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Brain size={14} /> Hifz mode
                </span>
                <span>{hifz ? "On" : "Off"}</span>
              </button>
              <button
                onClick={() => {
                  setSheetOpen(false);
                  setFocus(true);
                }}
                className="flex items-center justify-between rounded-2xl border border-ink/10 bg-ivory/60 px-3.5 py-3 text-left text-xs font-semibold text-ink/60 transition hover:bg-mist"
              >
                <span className="flex items-center gap-2">
                  <Maximize2 size={14} /> Mushaf focus
                </span>
                <span>Open</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ focus mode chrome ============ */}
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
            {nameOf(current?.s)} {current?.s}:{current?.n}
          </div>
        </>
      )}
    </>
  );
}
