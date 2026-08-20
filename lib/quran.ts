import metadata from "@/data/quran/metadata.json";
import ayahData from "@/data/quran/ayahs.json";
import juzRanges from "@/data/quran/juz.json";
import hizbRanges from "@/data/quran/hizb.json";
import manzilRanges from "@/data/quran/manzil.json";
import pageStarts from "@/data/quran/pages.json";

export type PageStart = { page: number; s: number; n: number };

export type SurahMeta = {
  number: number;
  arabic: string;
  arabicShort: string;
  english: string;
  translation: string;
  ayahs: number;
  revelation: "Makki" | "Madani";
  juzStart: number;
  juzEnd: number;
  hizbStart: number;
  rukuCount: number;
  sajdah: number[];
};

export type Ayah = {
  a: string;
  u: string;
  e: string;
  juz: number;
  hizb: number;
  ruku: number;
  page: number;
  manzil: number;
  sajdah: boolean;
};

export type AyahRef = { surah: number; ayah: number; key: string };

export type Range = {
  surah: number;
  ayah: number;
  key: string;
};

export type Section = {
  id: number;
  start: Range;
  end: Range;
  ayahs: number;
};

const surahs = metadata as SurahMeta[];
const ayahs = ayahData as Record<string, Ayah>;
const juz = juzRanges as Section[];
const hizb = hizbRanges as Section[];
const manzil = manzilRanges as Section[];

export const TOTAL_SURAHS = surahs.length;
export const TOTAL_AYAHS = Object.keys(ayahs).length;

export function getSurahs(): SurahMeta[] {
  return surahs;
}

export function getSurah(number: number): SurahMeta | undefined {
  return surahs.find((s) => s.number === number);
}

export function getAyahKey(surah: number, ayah: number): string {
  return `${surah}:${ayah}`;
}

export function getAyah(surah: number, ayah: number): Ayah | undefined {
  return ayahs[getAyahKey(surah, ayah)];
}

export function getSurahAyahs(number: number): (Ayah & { n: number })[] {
  const s = getSurah(number);
  if (!s) return [];
  const out: (Ayah & { n: number })[] = [];
  for (let n = 1; n <= s.ayahs; n++) {
    const a = ayahs[getAyahKey(number, n)];
    if (!a) throw new Error(`missing ayah ${number}:${n}`);
    out.push({ ...a, n });
  }
  return out;
}

export function getJuzList(): Section[] {
  return juz;
}

export function getHizbList(): Section[] {
  return hizb;
}

export function getManzilList(): Section[] {
  return manzil;
}

export function getPageStarts(): PageStart[] {
  return pageStarts;
}

export function getAyahsInSection(range: Section): (Ayah & { n: number; s: number })[] {
  const out: (Ayah & { n: number; s: number })[] = [];
  for (const [key, a] of Object.entries(ayahs)) {
    const [s, n] = key.split(":").map(Number);
    if (s > range.end.surah) break;
    if (s === range.start.surah && n < range.start.ayah) continue;
    if (s === range.end.surah && n > range.end.ayah) continue;
    out.push({ ...a, n, s });
  }
  return out;
}

const AR_DIACRITICS =
  /[\u064B-\u0652\u0653-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g;
const AR_NORMALIZE: Record<string, string> = {
  "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ٲ": "ا", "ٳ": "ا",
  "ى": "ي", "ؤ": "و", "ئ": "ي", "ة": "ه", "ک": "ك", "ڈ": "د",
  "ڑ": "ر", "ں": "ن", "ھ": "ه", "ے": "ي", "ۓ": "ي", "پ": "ب", "چ": "ج",
  "ژ": "ز", "گ": "ك", "ٹ": "ت", "ڤ": "ف", "ڪ": "ك", "ۃ": "ه",
};

export function normalizeArabic(text: string): string {
  return text
    .replace(AR_DIACRITICS, "")
    .split("")
    .map((c) => AR_NORMALIZE[c] ?? c)
    .join("")
    .trim();
}

const ROMAN_TO_ARABIC: Record<string, string[]> = {
  "sabr": ["صبر"], "sabir": ["صابر"], "sabirin": ["صابرين", "صبرا"],
  "salah": ["صلاة", "صلوة"], "salat": ["صلاة", "صلوة"], "salawat": ["صلوات"],
  "zakat": ["زكاة"], "zakah": ["زكاة"],
  "rahmat": ["رحمة", "رحمة"], "rahmah": ["رحمة", "رحمة"], "rahman": ["رحمن"], "rahim": ["رحيم"],
  "allah": ["الله", "اللہ"], "allahu": ["الله", "اللہ"],
  "rasul": ["رسول"], "rasool": ["رسول"], "rusul": ["رسل"],
  "nabi": ["نبي", "نبى"], "anbiya": ["انبياء"],
  "iman": ["ايمان", "إيمان", "ایمان"], "imaan": ["ايمان", "إيمان", "ایمان"],
  "kufr": ["كفر", "کفر"], "kafir": ["كافر", "کافر"], "kuffar": ["كفار", "کفار"],
  "taqwa": ["تقوى", "تقوي", "تقوٰى"], "taqwaa": ["تقوى", "تقوي"],
  "jannah": ["جنة", "جنت", "جنات"], "jannat": ["جنة", "جنت", "جنات"],
  "jahannam": ["جهنم", "جحيم"],
  "shirk": ["شرك", "شرک"],
  "tawba": ["توبة", "توبہ", "توبه"], "tawbah": ["توبة", "توبہ"], "tauba": ["توبة", "توبہ"],
  "dhikr": ["ذكر", "ذکر"], "zikr": ["ذكر", "ذکر"],
  "dua": ["دعاء", "دعا", "دعاؤ"], "duaa": ["دعاء", "دعا"],
  "salam": ["سلام", "سلام"], "salaam": ["سلام"],
  "islam": ["اسلام", "إسلام", "اسلم"], "islamic": ["اسلام"],
  "muslim": ["مسلم", "مسلمون", "مسلمين"],
  "muslimin": ["مسلمين", "مسلمون"], "muslimoon": ["مسلمون"],
  "munafiq": ["منافق"], "munafiqin": ["منافقين"],
  "hajj": ["حج", "حجج"], "hajja": ["حج"],
  "umrah": ["عمرة", "عمرہ"],
  "saum": ["صوم", "صيام"], "sawm": ["صوم"], "siyam": ["صيام", "صوم"], "roza": ["صوم"],
  "quran": ["قران", "قرآن", "قرءان"], "qur'an": ["قران", "قرآن"],
  "kitab": ["كتاب", "کتاب"], "kutub": ["كتب", "کتب"],
  "hikmah": ["حكمة", "حکمت", "حكمت"], "hikmat": ["حكمة", "حکمت"],
  "ilm": ["علم", "علما"], "ulama": ["علماء", "علمائ"],
  "amal": ["عمل", "اعمال"], "aamal": ["اعمال"],
  "hasanat": ["حسنات"], "hasanah": ["حسنة", "حسنہ"],
  "gunah": ["گناه", "گناہ", "ذنب"], "gunaah": ["گناه", "گناہ"],
  "dunya": ["دنيا", "دنیا", "دنيا"], "duniya": ["دنيا", "دنیا"],
  "akhirat": ["اخرة", "آخرت", "اخرت", "الاخرة"], "akhirah": ["اخرة", "آخرت"],
  "aakhirat": ["اخرة", "آخرت"],
  "maut": ["موت", "ممات"], "mout": ["موت"],
  "zindagi": ["حياة", "حیات"], "zindgi": ["حياة", "حیات"], "hayaat": ["حياة", "حیات"],
  "rooh": ["روح", "ارواح"], "ruh": ["روح"],
  "wahi": ["وحي", "وحى", "وحی"], "wahy": ["وحي", "وحى"],
  "ibadah": ["عبادة", "عبادت", "عبادة"], "ibadat": ["عبادت", "عبادة"],
  "istighfar": ["استغفار", "استغفر"],
  "shukr": ["شكر", "شکر"], "shukra": ["شكر", "شکر"],
  "fajr": ["فجر"], "subh": ["صبح"],
  "maghrib": ["مغرب"], "isha": ["عشاء", "عشا"],
  "zuhr": ["ظهر"], "asr": ["عصر"], "asra": ["عصر"],
  "tawheed": ["توحيد", "توحید"], "tawhid": ["توحيد", "توحید"],
  "sunnah": ["سنة", "سنت", "سنه"], "sunna": ["سنة", "سنت"],
  "qaum": ["قوم", "اقوام"], "qawm": ["قوم"],
  "ummah": ["امة", "امت", "امہ"], "ummat": ["امت", "امة"],
  "risalat": ["رسالت"], "risalah": ["رسالة", "رسالت"],
  "akhlaq": ["اخلاق"], "ikhlash": ["اخلاص"], "ikhlas": ["اخلاص"],
  "zulm": ["ظلم", "ظالما"], "zalim": ["ظالم"], "zalimin": ["ظالمين"],
  "adl": ["عدل"], "insaf": ["انصاف"],
  "noor": ["نور"], "nur": ["نور"], "noorani": ["نور"],
  "hidayat": ["هداية", "هدایت"], "huda": ["هدى", "هدي", "ہدی"], "hidayah": ["هداية", "هدایت"],
  "razaq": ["رزق"], "rizq": ["رزق", "رزقا"],
  "barakah": ["بركة", "برکت"], "barakat": ["برکات"],
  "sabr wa salat": ["صبر", "صلاة"],
  "patience": ["صبر"], "patience and prayer": ["صبر", "صلاة"],
};

export type SearchResult = {
  surah: number;
  ayah: number;
  key: string;
  arabic: string;
  urdu: string;
  english: string;
  surahName: string;
  surahEnglish: string;
};

export function searchAyahs(query: string, limit = 40): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const isArabic = /[\u0600-\u06FF]/.test(q);
  const needle = isArabic ? normalizeArabic(q) : q;
  const romanTokens = isArabic
    ? null
    : q
        .split(/[^a-z']+/)
        .filter(Boolean)
        .map((t) => t.replace(/'/g, ""));
  const results: SearchResult[] = [];
  for (const [key, a] of Object.entries(ayahs)) {
    const [s, n] = key.split(":").map(Number);
    const meta = surahs.find((m) => m.number === s)!;
    let match = false;
    if (isArabic) {
      match = normalizeArabic(a.a).includes(needle);
    } else {
      const hayUrdu = normalizeArabic(a.u);
      const hayEn = `${a.e} ${meta.english} ${meta.translation}`.toLowerCase();
      match = hayEn.includes(needle) || hayUrdu.includes(needle);
      if (!match && romanTokens) {
        for (const token of romanTokens) {
          const equivs = ROMAN_TO_ARABIC[token];
          if (!equivs) continue;
          for (const ev of equivs) {
            const ne = normalizeArabic(ev);
            if (hayUrdu.includes(ne) || normalizeArabic(a.a).includes(ne)) {
              match = true;
              break;
            }
          }
          if (match) break;
        }
      }
    }
    if (match) {
      results.push({
        surah: s,
        ayah: n,
        key,
        arabic: a.a,
        urdu: a.u,
        english: a.e,
        surahName: meta.arabicShort,
        surahEnglish: meta.english,
      });
      if (results.length >= limit) break;
    }
  }
  return results;
}

export { RECITERS, audioUrl } from "@/lib/audio";
export type { ReciterId } from "@/lib/audio";