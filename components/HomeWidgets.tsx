"use client";

import { useState } from "react";
import Link from "next/link";
import { BookMarked, Clock3, StickyNote } from "lucide-react";
import { getAllNotes, getBookmarks, getHistory, getLastRead, clearHistory, type Bookmark, type HistoryEntry } from "@/lib/notes";

export function HomeWidgets() {
  const [ready, setReady] = useState(false);
  if (!ready && typeof window !== "undefined") setReady(true);

  if (!ready) return null;

  const bookmarks: Bookmark[] = Object.values(getBookmarks()).sort(
    (a, b) => a.s - b.s || a.n - b.n
  );
  const lastRead: HistoryEntry | undefined = getLastRead();
  const history = getHistory();
  const noteCount = Object.keys(getAllNotes()).length;

  return (
    <div className="mx-auto grid max-w-7xl gap-3 px-4 py-8 sm:px-5 md:grid-cols-3 md:gap-4 md:px-8 md:py-10">
      <div className="rounded-2xl border border-ink/10 bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Clock3 size={16} className="text-gold" /> Continue reading
        </div>
        {lastRead ? (
          <Link
            href={`/quran/${lastRead.s}#ayah-${lastRead.s}-${lastRead.n}`}
            className="block rounded-xl border border-ink/10 bg-ivory/50 p-4 transition hover:border-gold/40 hover:bg-ivory"
          >
            <div className="text-sm font-medium">{lastRead.surahName}</div>
            <div className="mt-1 text-xs text-ink/45">
              Ayah {lastRead.n} · {new Date(lastRead.at).toLocaleDateString()}
            </div>
            <div className="mt-2 text-xs font-medium text-forest">Resume reading →</div>
          </Link>
        ) : (
          <p className="text-sm leading-6 text-ink/45">
            Start reading and your position is remembered automatically.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-ink/10 bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <BookMarked size={16} className="text-gold" /> Bookmarks
          {bookmarks.length > 0 && (
            <span className="ml-auto rounded-full bg-ivory px-2 py-0.5 text-xs text-ink/45">
              {bookmarks.length}
            </span>
          )}
        </div>
        {bookmarks.length === 0 ? (
          <p className="text-sm leading-6 text-ink/45">
            Tap the bookmark icon on any ayah to save it here.
          </p>
        ) : (
          <ul className="space-y-2">
            {bookmarks.slice(0, 5).map((b) => (
              <li key={`${b.s}:${b.n}`}>
                <Link
                  href={`/quran/${b.s}#ayah-${b.s}-${b.n}`}
                  className="flex items-center gap-3 rounded-xl border border-ink/10 px-3 py-2 transition hover:border-gold/40 hover:bg-ivory"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ivory text-[10px] text-forest">
                    {b.n}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">{b.surahName}</span>
                    <span className="quran-arabic block truncate text-sm text-ink/70" dir="rtl">
                      {b.a}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-ink/10 bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <StickyNote size={16} className="text-gold" /> Notes & history
        </div>
        <div className="flex items-end gap-4">
          <div>
            <div className="text-3xl font-semibold">{noteCount}</div>
            <div className="text-xs text-ink/45">Saved notes</div>
          </div>
          <div>
            <div className="text-3xl font-semibold">{history.length}</div>
            <div className="text-xs text-ink/45">Ayahs read this session</div>
          </div>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => clearHistory()}
            className="mt-4 text-xs font-medium text-ink/40 transition hover:text-gold"
          >
            Clear reading history
          </button>
        )}
      </div>
    </div>
  );
}