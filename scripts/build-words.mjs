// Builds data/quran/words.json (word-by-word: Arabic, English meaning, transliteration)
// Source: Buraaq/quran-md-words (Quran-MD, NeurIPS 2025) — public HuggingFace dataset.
// https://huggingface.co/datasets/Buraaq/quran-md-words
// Paged via the HuggingFace datasets-server API (rows per request: 100).
// Resumable: checkpoints to words.partial.json every 40 pages; resumes on restart.
import { writeFileSync, readFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "data", "quran");
const TOTAL_ROWS = 77429;
const STEP = 100;
const CHECKPOINT = 40; // pages (x100 rows)
const PARTIAL = join(OUT, "words.partial.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRows(offset, length) {
  const url = `https://datasets-server.huggingface.co/rows?dataset=Buraaq%2Fquran-md-words&config=default&split=train&offset=${offset}&length=${length}`;
  for (let attempt = 1; attempt <= 6; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    try {
      const res = await fetch(url, { headers: { accept: "application/json" }, signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.rows) throw new Error(`no rows field`);
      return json.rows.map((x) => x.row);
    } catch (err) {
      if (attempt === 6) throw err;
      await sleep(1500 * attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("unreachable");
}

async function main() {
  const words = {};
  let resumeFrom = 0;

  if (existsSync(PARTIAL)) {
    const prev = JSON.parse(readFileSync(PARTIAL, "utf8"));
    words.__partial = prev.words;
    resumeFrom = prev.offset + STEP;
    console.log(`resuming from offset ${resumeFrom} (${Object.keys(prev.words).length} ayahs cached)`);
  }

  const store = words.__partial ?? (words.__partial = {});
  delete words.__partial;

  for (let offset = resumeFrom; offset < TOTAL_ROWS; offset += STEP) {
    const rows = await fetchRows(offset, Math.min(STEP, TOTAL_ROWS - offset));
    for (const row of rows) {
      const key = `${row.surah_id}:${row.ayah_id}`;
      if (!store[key]) store[key] = [];
      store[key][row.word_index] = { w: row.word_ar, e: row.word_en, t: row.word_tr };
    }
    const fetched = offset + rows.length;
    if ((offset / STEP) % CHECKPOINT === 0) {
      writeFileSync(PARTIAL, JSON.stringify({ words: store, offset }));
      console.log(`checkpoint @ ${fetched}/${TOTAL_ROWS} (${Object.keys(store).length} ayahs)`);
    }
    await sleep(150);
  }

  const keys = Object.keys(store);
  const totalWords = keys.reduce((a, k) => a + store[k].length, 0);
  let gaps = 0;
  for (const k of keys) {
    const arr = store[k];
    for (let i = 0; i < arr.length; i++) if (!arr[i]) gaps++;
  }
  if (totalWords !== TOTAL_ROWS) {
    throw new Error(`word count mismatch: expected ${TOTAL_ROWS}, got ${totalWords}`);
  }
  if (gaps > 0) throw new Error(`${gaps} word-position gaps found`);
  console.log(`validated: ${keys.length} ayahs, ${totalWords} words, ${gaps} gaps`);

  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "words.json"), JSON.stringify(store));
  if (existsSync(PARTIAL)) renameSync(PARTIAL, join(OUT, "words.partial.backup.json"));
  console.log("wrote words.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});