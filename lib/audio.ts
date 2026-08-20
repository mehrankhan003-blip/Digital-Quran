export const RECITERS = [
  { id: "Alafasy_128kbps", name: "Mishary Alafasy" },
  { id: "Abdul_Basit_Murattal_192kbps", name: "Abdul Basit" },
  { id: "Abdurrahmaan_As-Sudais_192kbps", name: "Abdur-Rahman As-Sudais" },
  { id: "Minshawy_Murattal_128kbps", name: "Mohammad Al-Minshawi" },
  { id: "Husary_128kbps", name: "Mahmoud Al-Husary" },
  { id: "Abu_Bakr_Ash-Shaatree_128kbps", name: "Abu Bakr Ash-Shaatree" },
  { id: "Abdullah_Matroud_128kbps", name: "Abdullah Matroud" },
] as const;

export type ReciterId = (typeof RECITERS)[number]["id"];

export function audioUrl(reciter: string, surah: number, ayah: number): string {
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `https://everyayah.com/data/${reciter}/${s}${a}.mp3`;
}