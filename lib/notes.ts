export type Bookmark = {
  s: number;
  n: number;
  surahName: string;
  a: string;
  u: string;
  e: string;
};

export type HistoryEntry = {
  s: number;
  n: number;
  surahName: string;
  at: number;
};

const BOOKMARKS_KEY = "noor-bookmarks";
const NOTES_KEY = "noor-notes";
const HISTORY_KEY = "noor-history";

export function ayahKey(s: number, n: number): string {
  return `${s}:${n}`;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — ignore
  }
}

export function getBookmarks(): Record<string, Bookmark> {
  return read<Record<string, Bookmark>>(BOOKMARKS_KEY, {});
}

export function getAllNotes(): Record<string, string> {
  return read<Record<string, string>>(NOTES_KEY, {});
}

export function isBookmarked(s: number, n: number): boolean {
  return ayahKey(s, n) in getBookmarks();
}

export function toggleBookmark(bm: Bookmark): boolean {
  const all = getBookmarks();
  const key = ayahKey(bm.s, bm.n);
  if (key in all) {
    delete all[key];
    write(BOOKMARKS_KEY, all);
    return false;
  }
  all[key] = bm;
  write(BOOKMARKS_KEY, all);
  return true;
}

export function getNote(s: number, n: number): string {
  return read<Record<string, string>>(NOTES_KEY, {})[ayahKey(s, n)] ?? "";
}

export function setNote(s: number, n: number, text: string) {
  const all = read<Record<string, string>>(NOTES_KEY, {});
  if (text.trim() === "") {
    delete all[ayahKey(s, n)];
  } else {
    all[ayahKey(s, n)] = text;
  }
  write(NOTES_KEY, all);
}

export function getHistory(): HistoryEntry[] {
  return read<HistoryEntry[]>(HISTORY_KEY, []);
}

export function addHistory(entry: { s: number; n: number; surahName: string }) {
  const list = getHistory();
  const key = ayahKey(entry.s, entry.n);
  const filtered = list.filter((h) => ayahKey(h.s, h.n) !== key);
  filtered.unshift({ ...entry, at: Date.now() });
  write(HISTORY_KEY, filtered.slice(0, 50));
}

export function clearHistory() {
  write(HISTORY_KEY, []);
}

export function getLastRead(): HistoryEntry | undefined {
  return getHistory()[0];
}