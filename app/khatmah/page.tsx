import type { Metadata } from "next";
import { getPageStarts } from "@/lib/quran";
import { KhatmahView } from "@/components/KhatmahView";

export const metadata: Metadata = {
  title: "Khatmah Planner · Digital Quran",
  description:
    "Plan a complete Quran reading. Set a daily page goal or a target date and begin today's pages.",
};

export default function KhatmahPage() {
  const pageStarts = getPageStarts();
  return <KhatmahView pageStarts={pageStarts} />;
}