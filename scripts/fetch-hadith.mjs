import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "data", "hadith");

const BOOKS = [
  { edition: "eng-bukhari", file: "bukhari.json" },
  { edition: "eng-muslim", file: "muslim.json" },
];

const BASE =
  "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

for (const { edition, file } of BOOKS) {
  const url = `${BASE}/${edition}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`failed to fetch ${url}: HTTP ${res.status}`);
  }
  const json = await res.json();
  if (!json || !Array.isArray(json.hadiths) || json.hadiths.length < 7000) {
    throw new Error(`refusing to write ${file}: hadiths missing or incomplete`);
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, file), JSON.stringify(json));
  console.log(
    `wrote ${file}: ${json.hadiths.length} hadith (${json.metadata?.name})`
  );
}