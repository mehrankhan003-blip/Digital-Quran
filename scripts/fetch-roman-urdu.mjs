// Builds data/quran/roman.json (Abul Ala Maududi Roman Urdu, all 6,236 ayahs),
// keyed by "surah:ayah". Never fabricates text: refuses to write unless complete.
//
// Two free sources:
//   1. fawazahmed0/quran-api (Unlicense / public domain) — no account needed:
//        node scripts/fetch-roman-urdu.mjs urd-abulaalamaududi-la
//      (it downloads the edition straight from the jsDelivr CDN)
//   2. QUL (https://qul.tarteel.ai, resource 281) — needs a free account:
//        set QUL_TOKEN=your_token  → node scripts/fetch-roman-urdu.mjs
//      or download the JSON yourself → node scripts/fetch-roman-urdu.mjs path\to\file.json
//
// Accepted file shapes: {quran:[{chapter,verse,text}]} (fawazahmed0), nested
// arrays (QUL simple.json), or a flat {"s:n":"text"} / {"key":"text"} map.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "data", "quran", "roman.json");
const RESOURCE = "281"; // Abul Ala Maududi (Roman Urdu)
const TOTAL = 6236;
const CDN = (edition) => `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/${edition}.min.json`;

function normalize(parsed) {
  const map = {};
  if (parsed && Array.isArray(parsed.quran)) {
    // fawazahmed0/quran-api shape: {quran:[{chapter,verse,text}]}
    for (const v of parsed.quran) {
      const t = String(v.text ?? "").trim();
      if (!t) continue;
      map[`${v.chapter}:${v.verse}`] = t;
    }
  } else if (Array.isArray(parsed)) {
    // Nested-array structure: parsed[surahIndex - 1][ayahIndex - 1]
    parsed.forEach((surah, si) => {
      if (!Array.isArray(surah)) return;
      surah.forEach((text, ai) => {
        map[`${si + 1}:${ai + 1}`] = String(text);
      });
    });
  } else if (parsed && typeof parsed === "object") {
    for (const [k, v] of Object.entries(parsed)) {
      map[k] = String(v);
    }
  } else {
    throw new Error("unsupported JSON shape");
  }
  return map;
}

function validate(map) {
  const keys = Object.keys(map);
  if (keys.length < TOTAL) {
    throw new Error(`incomplete: expected ${TOTAL} ayahs, got ${keys.length} — refusing to write`);
  }
  let malformed = 0;
  let blank = 0;
  for (const k of keys) {
    if (!/^\d+:\d+$/.test(k)) malformed++;
    if (!String(map[k]).trim()) blank++;
  }
  if (malformed > 0) throw new Error(`${malformed} malformed keys`);
  if (blank > 0) throw new Error(`${blank} blank translations — refusing to write`);
  return true;
}

async function main() {
  const inputArg = process.argv[2];
  let parsed;

  if (inputArg && !inputArg.includes("\\") && !inputArg.includes("/")) {
    // treat as a fawazahmed0 edition name (free CDN, no account needed)
    const url = CDN(inputArg);
    console.log(`downloading free edition: ${url}`);
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`CDN download failed: HTTP ${res.status}`);
    parsed = await res.json();
  } else if (inputArg && existsSync(inputArg)) {
    console.log(`reading local file: ${inputArg}`);
    parsed = JSON.parse(readFileSync(inputArg, "utf8"));
  } else if (process.env.QUL_TOKEN) {
    const url = `https://qul.tarteel.ai/resources/translation/${RESOURCE}/download?format=simple.json`;
    console.log(`downloading from QUL: ${url}`);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.QUL_TOKEN}` },
    });
    if (!res.ok) throw new Error(`QUL download failed: HTTP ${res.status}`);
    parsed = await res.json();
  } else {
    throw new Error(
      "No source given. Provide a local JSON file path as an argument, " +
        "or set QUL_TOKEN (see comments at the top of this script)."
    );
  }

  const map = normalize(parsed);
  validate(map);
  writeFileSync(OUT, JSON.stringify(map));
  console.log(`wrote roman.json (${Object.keys(map).length} ayahs)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});