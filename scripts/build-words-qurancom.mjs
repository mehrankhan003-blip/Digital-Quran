// Alternative/resumable word-by-word builder using the Quran.com API (v4).
// Source: https://api.quran.com/api/v4/verses/by_key/{s}:{n}?words=true&word_fields=text_uthmani,translation,transliteration
// Falls back to the HF dataset if needed. Output: data/quran/words.json
import { writeFileSync, readFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "data", "quran");
const PARTIAL = join(OUT, "words.partial.json");
const CONCURRENCY = 12;
const RETRIES = 5;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchAyah(s, n) {
  const url = `https://api.quran.com/api/v4/verses/by_key/${s}:${n}?words=true&word_fields=text_uthmani,translation,transliteration`;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    try {
      const res = await fetch(url, { headers: { accept: "application/json" }, signal: ctrl.signal });
      if (res.status === 429) {
        await sleep(1500 * attempt);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const words = (json.verse?.words ?? []).map((w) => ({
        w: w.text_uthmani ?? "",
        e: w.translation?.text ?? "",
        t: w.transliteration?.text ?? "",
      }));
      return { s, n, words };
    } catch (err) {
      if (attempt === RETRIES) throw err;
      await sleep(400 * attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("unreachable");
}

async function main() {
  let store = {};
  let queue = [];
  let done = 0;
  let failedKeys = [];

  if (existsSync(PARTIAL)) {
    const prev = JSON.parse(readFileSync(PARTIAL, "utf8"));
    store = prev.words ?? {};
    done = prev.done ?? 0;
    console.log(`resuming: ${done} ayahs cached`);
  }

  for (let s = 1; s <= 114; s++) {
    for (let n = 1; n <= (await ayahCount(s)); n++) {
      const key = `${s}:${n}`;
      if (store[key]) continue;
      queue.push({ s, n });
    }
  }

  console.log(`queue: ${queue.length} ayahs to fetch`);

  while (queue.length > 0 || failedKeys.length > 0) {
    const batch = queue.splice(0, CONCURRENCY);
    if (batch.length === 0) {
      const retry = failedKeys.splice(0, CONCURRENCY);
      if (retry.length === 0) break;
      batch.push(...retry.map((k) => { const [s, n] = k.split(":").map(Number); return { s, n }; }));
    }
    const results = await Promise.allSettled(batch.map(({ s, n }) => fetchAyah(s, n)));
    results.forEach((r, i) => {
      const k = `${batch[i].s}:${batch[i].n}`;
      if (r.status === "fulfilled") {
        store[k] = r.value.words;
        done++;
      } else {
        failedKeys.push(k);
      }
    });
    if (done % 100 < CONCURRENCY) {
      writeFileSync(PARTIAL, JSON.stringify({ words: store, done }));
      console.log(`progress: ${done} ayahs (${Math.round((done / 6236) * 100)}%)`);
    }
    await sleep(60);
  }

  if (Object.keys(store).length !== 6236) {
    throw new Error(`incomplete: ${Object.keys(store).length}/6236 ayahs — not writing`);
  }
  let gaps = 0;
  for (const [k, arr] of Object.entries(store)) {
    if (!Array.isArray(arr) || arr.length === 0) { gaps++; continue; }
    for (let i = 0; i < arr.length; i++) {
      if (!arr[i] || !arr[i].w) { arr.splice(i, 1); i--; }
    }
    if (arr.length === 0) gaps++;
  }
  if (gaps > 0) throw new Error(`${gaps} empty ayah word-lists`);

  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "words.json"), JSON.stringify(store));
  if (existsSync(PARTIAL)) renameSync(PARTIAL, join(OUT, "words.partial.backup.json"));
  console.log("wrote words.json — " + Object.keys(store).length + " ayahs, " + Object.values(store).reduce((a, x) => a + x.length, 0) + " words");
}

// surah ayah counts from our metadata (avoids hardcoding)
const counts = JSON.parse(readFileSync(join(OUT, "metadata.json"), "utf8")).reduce((m, x) => ((m[x.number] = x.ayahs), m), {});
async function ayahCount(s) {
  return counts[s] ?? 7;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});