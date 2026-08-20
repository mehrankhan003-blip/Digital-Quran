// Canonical ayah counts for all 114 surahs — used to compute the global
// (Mushaf) ayah number used by the islamic.network CDN.
export const SURAH_AYAH_COUNTS: number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111,
  110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45,
  83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55,
  78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20,
  56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
  11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

export function globalAyahNumber(surah: number, ayah: number): number {
  let n = ayah;
  for (let s = 0; s < surah - 1; s++) n += SURAH_AYAH_COUNTS[s];
  return n;
}

export const RECITERS = [
  { id: "Alafasy_128kbps", name: "Mishary Alafasy", urdu: false },
  { id: "ur.khan", name: "Shamshad Ali Khan (Arabic + Urdu)", urdu: true },
  { id: "Abdul_Basit_Murattal_192kbps", name: "Abdul Basit", urdu: false },
  { id: "Abdurrahmaan_As-Sudais_192kbps", name: "Abdur-Rahman As-Sudais", urdu: false },
  { id: "Minshawy_Murattal_128kbps", name: "Mohammad Al-Minshawi", urdu: false },
  { id: "Husary_128kbps", name: "Mahmoud Al-Husary", urdu: false },
  { id: "Abu_Bakr_Ash-Shaatree_128kbps", name: "Abu Bakr Ash-Shaatree", urdu: false },
  { id: "Abdullah_Matroud_128kbps", name: "Abdullah Matroud", urdu: false },
] as const;

export type ReciterId = (typeof RECITERS)[number]["id"];

export function audioUrl(reciter: string, surah: number, ayah: number): string {
  if (reciter === "ur.khan") {
    const n = globalAyahNumber(surah, ayah);
    return `https://cdn.islamic.network/quran/audio/64/ur.khan/${n}.mp3`;
  }
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `https://everyayah.com/data/${reciter}/${s}${a}.mp3`;
}