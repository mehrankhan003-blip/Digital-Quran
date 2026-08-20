import { getSurahs, getSurah } from "@/lib/quran";

export { getSurahs, getSurah };
export type { SurahMeta as Surah } from "@/lib/quran";
export const surahs = getSurahs();