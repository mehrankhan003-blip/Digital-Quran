import { NextResponse } from "next/server";
import { searchAyahs, getAyah, getSurah } from "@/lib/quran";

export const runtime = "nodejs";

// Bounded AI discovery — NEVER generates or modifies Quranic text.
// It only (a) searches the canonical dataset, then (b) uses an LLM to rank
// and group the ayah references it already found. Quran text is never sent
// to the model and is never written.
//
// To enable: set AI_API_KEY (and optionally AI_BASE_URL / AI_MODEL) in env.
// Works with any OpenAI-compatible endpoint.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "missing q parameter" }, { status: 400 });
  }

  const key = process.env.AI_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error: "AI discovery is not configured",
        hint: "Set AI_API_KEY (OpenAI-compatible) to enable. Quranic text is never modified.",
      },
      { status: 501 }
    );
  }

  const matches = searchAyahs(q, 60);
  const seeds = matches.map((m) => ({ surah: m.surah, ayah: m.ayah }));

  if (seeds.length === 0) {
    return NextResponse.json({ query: q, groups: [] });
  }

  const base = process.env.AI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";
  const prompt =
    "You rank Quran verse references by thematic relevance to a query. " +
    `Query: "${q}". Verses (surah:ayah): ${seeds
      .map((s) => `${s.surah}:${s.ayah}`)
      .join(", ")}. ` +
    "Return JSON: {\"groups\":[{\"label\":\"short theme label\",\"refs\":[\"s:a\",...]}]}. " +
    "Group the most relevant verses into at most 4 themes, keep total refs under 40. " +
    "Return only JSON, nothing else.";

  let completion;
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You only work with ayah references. You never write, quote or alter Quranic text.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`AI provider HTTP ${res.status}`);
    completion = await res.json();
  } catch (err) {
    return NextResponse.json(
      { error: "AI provider request failed", detail: String(err) },
      { status: 502 }
    );
  }

  let groups: { label: string; refs: { surah: number; ayah: number }[] }[] = [];
  try {
    const content = completion.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(
      content.replace(/^```(json)?\s*/i, "").replace(/```$/i, "")
    );
    groups = (parsed.groups ?? []).map((g: { label?: string; refs?: string[] }) => ({
      label: String(g.label ?? "Related"),
      refs: (g.refs ?? [])
        .map((ref) => {
          const [s, n] = String(ref).split(":").map(Number);
          return { surah: s, ayah: n };
        })
        .filter((r) => Number.isInteger(r.surah) && Number.isInteger(r.ayah) && getAyah(r.surah, r.ayah)),
    }));
  } catch {
    groups = [];
  }

  // Attach canonical texts only (never generated).
  const enriched = groups.map((g) => ({
    label: g.label,
    refs: g.refs.map((r) => {
      const ayah = getAyah(r.surah, r.ayah);
      const surah = getSurah(r.surah);
      return {
        surah: r.surah,
        ayah: r.ayah,
        surahName: surah?.english ?? "",
        arabic: ayah?.a ?? "",
        urdu: ayah?.u ?? "",
        english: ayah?.e ?? "",
      };
    }),
  }));

  return NextResponse.json({ query: q, groups: enriched });
}