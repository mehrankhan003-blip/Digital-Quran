const KEY = {
  theme: "noor-theme",
  translation: "noor-translation",
  reciter: "noor-reciter",
  speed: "noor-speed",
  autoscroll: "noor-autoscroll",
  focus: "noor-focus",
  khatmahMode: "noor-khatmah-mode",
  khatmahPages: "noor-khatmah-pages",
  khatmahTarget: "noor-khatmah-target",
} as const;

export type PrefKey = keyof typeof KEY;

export function getPref<T>(key: PrefKey, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(KEY[key]);
    if (v === null) return fallback;
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

export function setPref<T>(key: PrefKey, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY[key], JSON.stringify(value));
  } catch {}
}

export const PREF_KEYS = KEY;

export function exportPrefs(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(KEY) as PrefKey[]) {
    const v = getPref(k, undefined);
    if (v !== undefined && v !== null) out[k] = v;
  }
  return out;
}

export function importPrefs(data: Record<string, unknown>) {
  for (const [k, v] of Object.entries(data)) {
    if (k in KEY && v !== undefined && v !== null) {
      setPref(k as PrefKey, v);
    }
  }
}