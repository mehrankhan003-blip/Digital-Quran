import bukhariJson from "@/data/hadith/bukhari.json";
import muslimJson from "@/data/hadith/muslim.json";

type HadithEntry = {
  hadithnumber: number;
  text: string;
  grades: { name?: string; grade?: string }[];
  reference: { book?: number; hadith: number };
};

type HadithFile = {
  metadata: { name: string; sections?: Record<string, string> };
  hadiths: HadithEntry[];
};

export type HadithMatch = {
  book: string;
  bookId: "bukhari" | "muslim";
  number: number;
  text: string;
  grade?: string;
  chapter?: string;
};

const STOPWORDS = new Set([
  "the", "a", "an", "of", "to", "in", "and", "or", "is", "are", "was", "were",
  "for", "with", "on", "at", "by", "from", "about", "what", "how", "when",
  "who", "which", "do", "does", "did", "i", "you", "we", "they", "he", "she",
  "it", "me", "my", "your", "our", "their", "his", "her", "its", "am", "be",
  "been", "that", "this", "these", "those", "so", "but", "not", "no", "yes",
  "can", "could", "will", "would", "shall", "should", "may", "might", "must",
  "all", "as", "if", "than", "then", "there", "here", "now", "said", "say",
  "says", "has", "have", "had", "being", "also", "over", "into", "them", "they",
  "allah", "messenger", "prophet", "pray", "peace", "upon", "him", "which", "used",
  "ki", "ka", "ke", "kay", "ko", "kya", "hai", "hain", "tha", "thi", "the",
  "aur", "or", "bhi", "mein", "men", "me", "se", "say", "sa", "par", "per",
  "na", "ho", "ye", "yah", "wo", "woh", "is", "us", "jo", "jis", "nhi",
  "nahi", "nahin", "karo", "kare", "karen", "jaye", "jao", "kaun", "kya",
]);

const SYNONYMS: Record<string, string[]> = {
  fazeelat: ["virtue", "excellence", "merit"],
  fazilat: ["virtue", "excellence", "merit"],
  fayda: ["benefit", "blessing", "reward"],
  fayde: ["benefit", "blessing", "reward"],
  faida: ["benefit", "reward"],
  ahmiyat: ["importance", "virtue", "value"],
  huqooq: ["rights", "duty", "duties"],
  haqooq: ["rights", "duty"],
  sabr: ["patience", "patient"],
  sabar: ["patience", "patient"],
  sabir: ["patient"],
  namaz: ["prayer", "praying", "prayed"],
  salat: ["prayer", "praying", "prayed"],
  salah: ["prayer", "praying", "prayed"],
  roza: ["fast", "fasting", "fasted"],
  roze: ["fast", "fasting", "fasted"],
  rozay: ["fast", "fasting", "fasted"],
  sawm: ["fast", "fasting", "fasted"],
  siyam: ["fast", "fasting", "fasted"],
  zakat: ["zakat", "charity", "alms"],
  zakah: ["zakat", "charity", "alms"],
  sadaqah: ["charity", "sadaqa"],
  sadaqa: ["charity", "sadaqa"],
  khairat: ["charity"],
  hajj: ["hajj", "pilgrimage"],
  umrah: ["umrah", "umra"],
  jihad: ["jihad", "striving", "fighting"],
  dua: ["supplication", "supplicate", "invoke", "prayer"],
  duaah: ["supplication", "supplicate"],
  wudu: ["wudu", "ablution"],
  wuzu: ["ablution"],
  ghusl: ["ghusl", "bathing"],
  tawba: ["repentance", "repent", "repented"],
  toba: ["repentance", "repent"],
  tauba: ["repentance", "repent"],
  gunah: ["sin", "sins"],
  gunaah: ["sin", "sins"],
  jannat: ["paradise", "garden"],
  jannah: ["paradise", "garden"],
  jahannam: ["hell", "fire"],
  qayamat: ["judgment", "resurrection", "day of judgment"],
  iman: ["faith", "belief"],
  imaan: ["faith", "belief"],
  islaam: ["islam"],
  rasool: ["messenger"],
  rasul: ["messenger"],
  nabi: ["prophet", "prophets"],
  ulama: ["knowledge", "scholars", "learned"],
  ilm: ["knowledge", "learn"],
  rizq: ["sustenance", "provision", "food"],
  gharib: ["poor", "poverty", "needy"],
  gareeb: ["poor", "poverty", "needy"],
  zindagi: ["life"],
  maut: ["death", "died"],
  mout: ["death", "died"],
  mohabbat: ["love", "loved"],
  pyar: ["love", "loved"],
  shukr: ["grateful", "thank", "gratitude", "thanks"],
  shukar: ["grateful", "thank"],
  dar: ["fear", "afraid"],
  amal: ["deeds", "actions", "works"],
  aamal: ["deeds", "actions"],
  hasanat: ["good deeds", "rewards"],
  neki: ["good deeds", "reward", "righteous", "virtue"],
  walidain: ["parents", "father", "mother"],
  baap: ["father", "parents"],
  maa: ["mother", "parents"],
  bachay: ["children", "kids"],
  bacche: ["children", "kids"],
  aulad: ["children", "offspring"],
  biwi: ["wife", "women"],
  shohar: ["husband"],
  aurat: ["woman", "women"],
  rishwat: ["bribe", "bribery"],
  riswat: ["bribe", "bribery"],
  chor: ["thief", "theft", "steal", "stealing"],
  chori: ["theft", "steal", "stealing"],
  jhoot: ["lie", "lies", "lying", "false"],
  jhooth: ["lie", "lies", "lying"],
  sach: ["truth", "true", "honest"],
  adl: ["justice", "fair", "just"],
  insaf: ["justice", "fair"],
  zulm: ["oppression", "oppress", "unjust", "tyranny", "oppressors"],
  zalim: ["oppressor", "unjust"],
  reham: ["mercy", "kind"],
  rehmat: ["mercy", "kindness", "compassion"],
  rahmat: ["mercy", "kindness", "compassion"],
  sehat: ["health", "sick", "illness", "disease"],
  beemar: ["sick", "illness", "disease", "patient"],
  shifa: ["healing", "cure"],
  bimar: ["sick", "illness"],
  momin: ["believer", "faithful"],
  musalman: ["muslim"],
  kafir: ["disbeliever", "unbeliever", "infidel"],
  munafiq: ["hypocrite", "hypocrisy"],
  firqa: ["sect", "divisions", "groups"],
  ittehad: ["unity", "together", "brotherhood"],
  bhai: ["brother", "brotherhood"],
  dosti: ["friendship", "friends"],
  padosi: ["neighbor", "neighbours"],
  mehmaan: ["guest", "guests"],
  chacha: ["uncle"],
  rishtedari: ["relatives", "kinship", "family ties"],
  rozgar: ["sustenance", "provision", "livelihood"],
  kaam: ["work", "deeds", "actions"],
  mehnat: ["work", "effort", "earn"],
  gana: ["singing", "song", "music"],
  music: ["singing", "song"],
  sharab: ["wine", "intoxicants", "alcohol", "drinks"],
  suar: ["pork", "pig"],
  haram: ["forbidden", "unlawful", "prohibited"],
  halal: ["lawful", "permissible"],
  nikah: ["marriage", "married", "wedlock"],
  shadi: ["marriage", "married", "wedding"],
  talaq: ["divorce", "divorced"],
  talaaq: ["divorce"],
  zina: ["adultery", "fornication", "illicit"],
  besharmi: ["shame", "immodesty"],
  hijaab: ["hijab", "veil", "covering"],
  hijab: ["hijab", "veil"],
  pardah: ["veil", "covering"],
  beti: ["daughter", "daughters", "girls"],
  beta: ["son"],
  larkay: ["boys", "children"],
  apni: ["self", "soul"],
  nafs: ["self", "soul", "desires"],
  gusse: ["anger", "angry"],
  gussa: ["anger", "angry"],
  ghussay: ["anger", "angry"],
  jhagda: ["quarrel", "quarreling", "dispute"],
  larrhai: ["fighting", "quarrel", "dispute"],
  jalan: ["envy", "jealousy"],
  hasad: ["envy", "jealousy"],
  takabur: ["pride", "arrogant", "arrogance"],
  ghuroor: ["pride", "arrogant"],
  acha: ["good", "kind", "virtuous"],
  burai: ["evil", "bad", "wrong"],
  buri: ["evil", "bad"],
  sawab: ["reward"],
  ajar: ["reward"],
  dozakh: ["hell"],
  amaal: ["deeds"],
  ukhrawi: ["hereafter"],
  akhirat: ["hereafter", "afterlife"],
  aakhirat: ["hereafter"],
  dunya: ["world", "worldly"],
  duniya: ["world", "worldly"],
  test: ["trial", "test", "testing"],
  azmaish: ["trial", "test"],
  ibtila: ["trial", "affliction"],
  musibat: ["affliction", "calamity", "trouble", "distress"],
  takleef: ["trouble", "hardship", "distress"],
  mushkil: ["difficulty", "hardship", "hard"],
  aasan: ["ease", "easy"],
  himmat: ["courage", "strength", "determination"],
  hukum: ["command", "order", "rule"],
  faraiz: ["obligations", "duties"],
  farz: ["obligatory", "duty"],
  sunnat: ["sunnah", "traditions", "way"],
  bidat: ["innovation"],
  tawheed: ["oneness", "monotheism"],
  shirk: ["associate", "polytheism", "idolatry"],
  iblees: ["satan", "devil"],
  shaitan: ["satan", "devil"],
  shaitaan: ["satan", "devil"],
  jinn: ["jinn"],
  firishte: ["angels"],
  quran: ["quran", "qur'an", "book"],
  hadith: ["hadith"],
  masjid: ["mosque", "masjid"],
  masjidoon: ["mosque"],
  haq: ["right", "rights", "truth"],
  sahi: ["right", "true", "correct"],
  galat: ["wrong", "false", "incorrect"],
  izzat: ["honor", "honour", "respect", "dignity"],
  takarram: ["honor", "honour"],
  behtar: ["best", "excellent"],
  khatna: ["circumcision"],
  paak: ["pure", "cleanliness", "clean"],
  saaf: ["clean", "purify"],
  gandagi: ["unclean", "filth", "impurity"],
  namazi: ["prayer"],
  taharat: ["purification", "cleanliness"],
  mayyat: ["funeral", "dead", "deceased"],
  janaza: ["funeral", "janazah"],
  qabr: ["grave", "burial"],
  qabar: ["grave", "burial"],
  behisht: ["paradise"],
  jhannam: ["hell"],
};

type Indexed = {
  bookId: "bukhari" | "muslim";
  book: string;
  number: number;
  text: string;
  grade?: string;
  chapter?: string;
  lower: string;
};

function buildIndex(bookId: "bukhari" | "muslim", file: HadithFile): Indexed[] {
  const sections = file.metadata.sections ?? {};
  const out: Indexed[] = [];
  for (const entry of file.hadiths) {
    if (!entry.text) continue;
    const chapter =
      entry.reference.book !== undefined ? sections[String(entry.reference.book)] : undefined;
    const grade =
      entry.grades && entry.grades.length > 0 ? entry.grades.map((g) => g.grade ?? g.name).filter(Boolean).join(", ") : undefined;
    out.push({
      bookId,
      book: file.metadata.name,
      number: entry.hadithnumber,
      text: entry.text,
      grade,
      chapter,
      lower: entry.text.toLowerCase(),
    });
  }
  return out;
}

const INDEX: Indexed[] = [
  ...buildIndex("bukhari", bukhariJson as HadithFile),
  ...buildIndex("muslim", muslimJson as HadithFile),
];

function tokenize(query: string): string[] {
  const terms = new Set<string>();
  for (const raw of query.toLowerCase().split(/[^a-z']+/)) {
    const t = raw.replace(/'/g, "");
    if (!t || t.length < 2 || STOPWORDS.has(t)) continue;
    terms.add(t);
    const syn = SYNONYMS[t];
    if (syn) syn.forEach((s) => terms.add(s));
  }
  return [...terms];
}

export function searchHadith(query: string, limit = 6): HadithMatch[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const patterns = terms.map((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"));
  const scored: { idx: Indexed; score: number }[] = [];
  for (const h of INDEX) {
    let score = 0;
    for (const p of patterns) {
      if (p.test(h.lower)) score++;
    }
    if (score > 0) scored.push({ idx: h, score });
  }

  scored.sort((a, b) => b.score - a.score || a.idx.number - b.idx.number);
  return scored.slice(0, limit).map((s) => ({
    book: s.idx.book,
    bookId: s.idx.bookId,
    number: s.idx.number,
    text: s.idx.text,
    grade: s.idx.grade,
    chapter: s.idx.chapter,
  }));
}

export function getHadith(
  bookId: "bukhari" | "muslim",
  number: number
): HadithMatch | undefined {
  const h = INDEX.find((i) => i.bookId === bookId && i.number === number);
  if (!h) return undefined;
  return {
    book: h.book,
    bookId: h.bookId,
    number: h.number,
    text: h.text,
    grade: h.grade,
    chapter: h.chapter,
  };
}