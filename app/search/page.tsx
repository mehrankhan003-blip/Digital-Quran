import type { Metadata } from "next";
import { searchAyahs } from "@/lib/quran";
import { SearchView } from "@/components/SearchView";

export const metadata: Metadata = {
  title: "Search the Quran — Digital Quran",
  description: "Search the full Quran by Arabic, Urdu, Roman Urdu or English text.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q ?? "";
  const results = query ? searchAyahs(query, 50) : [];
  return <SearchView query={query} results={results} />;
}