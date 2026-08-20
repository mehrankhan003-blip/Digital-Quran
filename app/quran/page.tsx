import { getSurahs, getJuzList, getHizbList, getManzilList } from "@/lib/quran";
import { QuranIndex } from "@/components/QuranIndex";

export default function QuranIndexPage() {
  return (
    <QuranIndex
      surahs={getSurahs()}
      juz={getJuzList()}
      hizb={getHizbList()}
      manzil={getManzilList()}
    />
  );
}