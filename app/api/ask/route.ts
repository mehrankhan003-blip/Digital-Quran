import { NextResponse } from "next/server";
import { searchAyahs, getAyah, getSurah } from "@/lib/quran";
import { searchHadith, getHadith } from "@/lib/hadith";

export const runtime = "nodejs";

// Bounded AI Q&A — grounded in the bundled canonical datasets only.
// The LLM receives Quran verse *references* and hadith *excerpts* we already
// searched locally. It may never invent verses or hadith; every citation is
// re-validated against the datasets before being returned.
//
// To enable: set AI_API_KEY (and optionally AI_BASE_URL / AI_MODEL) in env.
export async function POST(req: Request) {
  let body: { question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "missing question" }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ error: "question too long (max 500 chars)" }, { status: 400 });
  }

  const key = process.env.AI_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error: "AI Q&A is not configured",
        hint: "Set AI_API_KEY (OpenAI-compatible) to enable Q&A with Quran + Hadith citations.",
      },
      { status: 501 }
    );
  }

  const quran = searchAyahs(question, 40);
  const hadith = searchHadith(question, 6);

  const quranRefs = quran.map((m) => `${m.surah}:${m.ayah}`);
  const hadithExcerpts = hadith.map(
    (h) =>
      `[${h.bookId} ${h.number} (${h.book})] ${h.text.length > 320 ? h.text.slice(0, 320) + "…" : h.text}`
  );

  const base = process.env.AI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  const prompt =
    "Answer the user's question using ONLY the Quran verse references and hadith provided. " +
    "You may use general Islamic knowledge to explain, but every citation you give MUST come from the provided lists — never invent a verse or hadith.\n\n" +
    `Question: "${question}"\n\n` +
    `Available Quran verses (surah:ayah): ${quranRefs.length ? quranRefs.join(", ") : "(none found)"}\n\n` +
    `Available hadith: ${hadithExcerpts.length ? hadithExcerpts.join("\n") : "(none found)"}\n\n` +
    "Respond in the same language as the question (Urdu/Roman Urdu if asked in Urdu). " +
    'Return STRICT JSON only, no markdown:\n' +
    '{"answer":"your explanation (2-6 sentences)","quran":["s:a",...],"hadith":[{"book":"bukhari|muslim","number":123},...]}\n' +
    "Cite only the most relevant 2-5 Quran verses and 1-3 hadith. Use the exact reference strings given. " +
    "If nothing is relevant, set quran and hadith to empty arrays and answer from general Islamic knowledge.";

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
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are a careful Islamic educator. You only cite references that were explicitly provided to you. You never fabricate Quranic verses or hadith.",
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

  let answer = "";
  let quranSeeds: string[] = [];
  let hadithSeeds: { book: string; number: number }[] = [];
  try {
    const content = completion.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(
      content.replace(/^```(json)?\s*/i, "").replace(/```$/i, "")
    );
    answer = String(parsed.answer ?? "").trim();
    quranSeeds = Array.isArray(parsed.quran) ? parsed.quran.map(String) : [];
    hadithSeeds = Array.isArray(parsed.hadith) ? parsed.hadith : [];
  } catch {
    answer = "";
  }

  const validatedQuran = quranSeeds
    .map((ref) => {
      const [s, n] = ref.split(":").map(Number);
      if (!Number.isInteger(s) || !Number.isInteger(n)) return null;
      const ayah = getAyah(s, n);
      if (!ayah) return null;
      const surah = getSurah(s);
      return {
        surah: s,
        ayah: n,
        surahName: surah?.english ?? "",
        arabic: ayah.a,
        urdu: ayah.u,
        english: ayah.e,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .slice(0, 5);

  const validatedHadith = hadithSeeds
    .map((h) => {
      if (h.book !== "bukhari" && h.book !== "muslim") return null;
      const n = Number(h.number);
      if (!Number.isInteger(n)) return null;
      const got = getHadith(h.book, n);
      if (!got) return null;
      return got;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .slice(0, 3);

  return NextResponse.json({
    question,
    answer,
    quran: validatedQuran,
    hadith: validatedHadith,
  });
}