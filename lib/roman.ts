import { readFileSync } from "node:fs";
import { join } from "node:path";

let cache: Record<string, string> | null | undefined;

function load(): Record<string, string> | null {
  if (cache !== undefined) return cache;
  try {
    const raw = readFileSync(join(process.cwd(), "data", "quran", "roman.json"), "utf8");
    const parsed = JSON.parse(raw) as Record<string, string>;
    if (Object.keys(parsed).length < 6236) {
      // Incomplete data must never ship silently — treat as unavailable.
      cache = null;
      return cache;
    }
    cache = parsed;
  } catch {
    cache = null;
  }
  return cache;
}

export function romanAvailable(): boolean {
  return load() !== null;
}

export function getRomanUrdu(s: number, n: number): string | undefined {
  return load()?.[`${s}:${n}`];
}