import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TMP = "C:/Users/Jerry/AppData/Local/Temp/opencode";
const OUT = join(ROOT, "data", "quran");
mkdirSync(OUT, { recursive: true });

const j = (f) => JSON.parse(readFileSync(join(TMP, f), "utf8"));

const uthmani = j("quran-uthmani.json").data;
const urdu = j("urdu-jalandhry.json").data;
const english = j("english-sahih.json").data;
const meta = j("surahs-meta.json").data;
const sajda = j("sajda.json").data.ayahs;

const gistSrc = readFileSync(join(TMP, "quran-data.js"), "utf8");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(gistSrc + ";({SURAH, HIZB, JUZ, PAGE, RUKU});", ctx);
const gist = vm.runInContext("({SURAH, HIZB, JUZ, PAGE, RUKU})", ctx);

const MANZIL_STARTS = ["1:1", "5:1", "10:1", "17:1", "26:1", "37:1", "49:1"];

const surahs = [];
let totalAyahs = 0;
let arCount = 0, urCount = 0, enCount = 0;

for (const s of uthmani.surahs) {
  const m = meta.find((x) => x.number === s.number);
  if (!m) throw new Error("missing meta for " + s.number);
  const ur = urdu.surahs.find((x) => x.number === s.number);
  const en = english.surahs.find((x) => x.number === s.number);
  const ayahs = s.ayahs.map((a, idx) => {
    const ua = ur.ayahs[idx];
    const ea = en.ayahs[idx];
    if (ua?.numberInSurah !== a.numberInSurah || ea?.numberInSurah !== a.numberInSurah) {
      throw new Error(`mismatch in surah ${s.number} ayah ${idx + 1}`);
    }
    return {
      a: a.text,
      u: ua.text,
      e: ea.text,
    };
  });
  if (ayahs.length !== m.numberOfAyahs) throw new Error(`count mismatch surah ${s.number}`);
  totalAyahs += ayahs.length;
  arCount += ayahs.length;
  urCount += ayahs.length;
  enCount += ayahs.length;
  surahs.push({
    number: m.number,
    arabic: s.name,
    arabicShort: m.name,
    english: m.englishName,
    translation: m.englishNameTranslation,
    ayahs: m.numberOfAyahs,
    revelation: m.revelationType === "Meccan" ? "Makki" : "Madani",
    ayahKeys: ayahs,
  });
}

if (surahs.length !== 114) throw new Error(`surah count ${surahs.length}`);
if (totalAyahs !== 6236) throw new Error(`ayah count ${totalAyahs}`);
console.log(`validated: ${surahs.length} surahs, ${totalAyahs} ayahs (ar=${arCount} ur=${urCount} en=${enCount})`);

const key = (s, a) => `${s}:${a}`;

const juzStarts = gist.JUZ.map((x) => ({ key: x.verse_key, id: x.id }));
const hizbStarts = gist.HIZB.filter((x) => (x.id - 1) % 4 === 0).map((x) => ({
  key: x.verse_key,
  id: (x.id + 3) / 4,
}));
const rukuStarts = gist.RUKU.map((x) => ({ key: x.verse_key, id: x.id }));
const pageStarts = gist.PAGE.map((x) => ({ key: x.verse_key, id: x.id }));

const startsOf = (list) => {
  const map = {};
  for (const it of list) map[it.key] = it.id;
  return map;
};
const juzAt = startsOf(juzStarts);
const hizbQuarterAt = startsOf(gist.HIZB.map((x) => ({ key: x.verse_key, id: x.id })));
const rukuAt = startsOf(rukuStarts);
const pageAt = startsOf(pageStarts);

const sajdaKeys = new Set(sajda.map((s) => `${s.surah.number}:${s.numberInSurah}`));

const ayahMap = {};
const ayahList = [];
let juz = 1, hizb = 1, ruku = 1, page = 1, manzil = 1;

for (const s of surahs) {
  s.ayahKeys.forEach(({ a, u, e }, idx) => {
    const n = idx + 1;
    const k = key(s.number, n);
    if (juzAt[k]) juz = juzAt[k];
    if (hizbQuarterAt[k]) hizb = Math.ceil(hizbQuarterAt[k] / 4);
    if (rukuAt[k]) ruku = rukuAt[k];
    if (pageAt[k]) page = pageAt[k];
    for (let mIdx = 0; mIdx < MANZIL_STARTS.length; mIdx++) {
      if (k === MANZIL_STARTS[mIdx]) manzil = mIdx + 1;
    }
    const entry = {
      a, u, e,
      juz, hizb, ruku, page, manzil,
      sajdah: sajdaKeys.has(k),
    };
    ayahMap[k] = entry;
    ayahList.push({ s: s.number, n, ...entry });
  });
}

const metadata = surahs.map((s) => {
  const first = ayahList.find((x) => x.s === s.number);
  const last = [...ayahList].reverse().find((x) => x.s === s.number);
  return {
    number: s.number,
    arabic: s.arabic,
    arabicShort: s.arabicShort,
    english: s.english,
    translation: s.translation,
    ayahs: s.ayahs,
    revelation: s.revelation,
    juzStart: first.juz,
    juzEnd: last.juz,
    sajdah: ayahList.filter((x) => x.s === s.number && x.sajdah).map((x) => x.n),
    hizbStart: first.hizb,
    rukuCount: [...new Set(ayahList.filter((x) => x.s === s.number).map((x) => x.ruku))].length,
  };
});

const juzRanges = juzStarts.map((js, idx) => {
  const next = juzStarts[idx + 1];
  const list = ayahList.filter((x) => x.juz === js.id);
  return {
    id: js.id,
    start: { surah: list[0].s, ayah: list[0].n, key: key(list[0].s, list[0].n) },
    end: { surah: list[list.length - 1].s, ayah: list[list.length - 1].n, key: key(list[list.length - 1].s, list[list.length - 1].n) },
    ayahs: list.length,
  };
});

const hizbRanges = hizbStarts.map((hs) => {
  const list = ayahList.filter((x) => x.hizb === hs.id);
  return {
    id: hs.id,
    start: { surah: list[0].s, ayah: list[0].n, key: key(list[0].s, list[0].n) },
    end: { surah: list[list.length - 1].s, ayah: list[list.length - 1].n, key: key(list[list.length - 1].s, list[list.length - 1].n) },
    ayahs: list.length,
  };
});

const manzilRanges = MANZIL_STARTS.map((startKey, idx) => {
  const list = ayahList.filter((x) => x.manzil === idx + 1);
  return {
    id: idx + 1,
    start: { surah: list[0].s, ayah: list[0].n, key: key(list[0].s, list[0].n) },
    end: { surah: list[list.length - 1].s, ayah: list[list.length - 1].n, key: key(list[list.length - 1].s, list[list.length - 1].n) },
    ayahs: list.length,
  };
});

const pageStartRefs = [];
for (let page = 1; page <= 604; page++) {
  const first = ayahList.find((x) => x.page === page);
  if (!first) throw new Error(`missing ayah for page ${page}`);
  pageStartRefs.push({ page, s: first.s, n: first.n });
}

writeFileSync(join(OUT, "metadata.json"), JSON.stringify(metadata));
writeFileSync(join(OUT, "ayahs.json"), JSON.stringify(ayahMap));
writeFileSync(join(OUT, "juz.json"), JSON.stringify(juzRanges));
writeFileSync(join(OUT, "hizb.json"), JSON.stringify(hizbRanges));
writeFileSync(join(OUT, "manzil.json"), JSON.stringify(manzilRanges));
writeFileSync(join(OUT, "pages.json"), JSON.stringify(pageStartRefs));

console.log("wrote metadata.json, ayahs.json, juz.json, hizb.json, manzil.json, pages.json");
console.log("juz check:", juzRanges.map((x) => x.ayahs).reduce((a, b) => a + b, 0));
console.log("hizb check:", hizbRanges.map((x) => x.ayahs).reduce((a, b) => a + b, 0));
console.log("manzil check:", manzilRanges.map((x) => x.ayahs).reduce((a, b) => a + b, 0));