import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Word = { w: string; e: string; t: string };

let cache: Record<string, Word[]> | null | undefined;

function load(): Record<string, Word[]> | null {
  if (cache !== undefined) return cache;
  try {
    const raw = readFileSync(join(process.cwd(), "data", "quran", "words.json"), "utf8");
    cache = JSON.parse(raw) as Record<string, Word[]>;
  } catch {
    cache = null;
  }
  return cache;
}

export function wordsAvailable(): boolean {
  return load() !== null;
}

export function getAyahWords(s: number, n: number): Word[] | null {
  return load()?.[`${s}:${n}`] ?? null;
}

export function getWordsForRange(range: { start: { surah: number; ayah: number }; end: { surah: number; ayah: number } }): Record<string, Word[]> {
  const all = load();
  if (!all) return {};
  const out: Record<string, Word[]> = {};
  const keys = Object.keys(all);
  for (const k of keys) {
    const [s, n] = k.split(":").map(Number);
    if (s < range.start.surah || s > range.end.surah) continue;
    if (s === range.start.surah && n < range.start.ayah) continue;
    if (s === range.end.surah && n > range.end.ayah) continue;
    out[k] = all[k];
  }
  return out;
}