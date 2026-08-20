# Data Sources & Licensing

This project only ever uses canonical, machine-readable Quran data. We never
generate, alter or fabricate Quranic text or translations. Everything below is
verified at build time (see `scripts/`).

## Canonical text (in `data/quran/`)

| File | Content | Source | License |
| --- | --- | --- | --- |
| `metadata.json` | 114 surahs (names, ayah counts, revelation, juz/hizb spans, sajdah) | AlQuran.cloud (`/v1/surah`) | Tanzil text © Tanzil Project, used under its terms |
| `ayahs.json` | 6,236 ayahs: Uthmani Arabic, Urdu (Jalandhry), English (Saheeh International) + juz/hizb/ruku/page/manzil/sajdah | AlQuran.cloud (`quran-uthmani`, `ur.jalandhry`, `en.sahih`, `sajda/quran-uthmani`) | See notes below |
| `juz.json`, `hizb.json`, `manzil.json` | Section boundaries (30 juz, 60 hizb, 7 manzil) | AlQuran.cloud + [bayramarslan/quran-data gist](https://gist.github.com/bayramarslan/8bc4c8fa3cc774b0daeffa755b5cfac0) | gist is public; boundaries cross-checked against ayah count (6236) |
| `pages.json` | 604 page starts (Madinah Mushaf layout) | Derived from `ayahs.json` (`page` field) | — |
| `words.json` | 83,665 words: Arabic, English meaning, transliteration | Quran.com API (`/verses/by_key` with `words=true&word_fields=text_uthmani,translation,transliteration`) via `scripts/build-words-qurancom.mjs` | Quran.com corpus — widely used by Quran apps; see `scripts/` |
| `roman.json` | 6,236 ayahs, Abul Ala Maududi **Roman Urdu** | fawazahmed0/quran-api edition `urd-abulaalamaududi-la` (source quranromanurdu.com) via `scripts/fetch-roman-urdu.mjs` | Repo is **Unlicense (public domain)** |

Translation attribution shown in the app:

- **Urdu** — Fateh Muhammad Jalandhry (اردو ترجمہ)
- **English** — Saheeh International
- **Arabic** — Uthmani script (Tanzil distribution, Hafs)

### Roman Urdu

A complete, licensed-as-public-domain **Roman Urdu** translation — Abul Ala Maududi
(same text as QUL resource #281) — ships in `data/quran/roman.json`. It is fetched
from the free, no-account CDN of [fawazahmed0/quran-api](https://github.com/fawazahmed0/quran-api)
(edition `urd-abulaalamaududi-la`, source quranromanurdu.com), which is released under
the **Unlicense** (public domain). Regenerate any time:

```bash
node scripts/fetch-roman-urdu.mjs urd-abulaalamaududi-la
```

The same script also accepts a QUL-downloaded JSON file (nested arrays) or a flat map,
and refuses to write unless all 6,236 ayahs validate with no blanks.

## Recitation audio

- **7 reciters**, ayah-by-ayah MP3 from the public `everyayah.com` CDN:
  `https://everyayah.com/data/{reciter}/{surah3}{ayah3}.mp3`
- Reciter list in `lib/audio.ts` (Alafasy, Abdul Basit, Sudais, Minshawy, Husary,
  Abu Bakr Ash-Shaatree, Abdullah Matroud).
- **Urdu tarjuma voice** — the "Arabic + Urdu" recite mode plays the Arabic MP3,
  then reads the Urdu translation using the device's built-in speech synthesizer
  (Web Speech API, `ur-PK` voice when available). No audio files ship; no network
  dependency beyond the Arabic CDN.

## Hadith data (in `data/hadith/`)

| File | Content | Source | License |
| --- | --- | --- | --- |
| `bukhari.json` | Sahih al-Bukhari, 7,563 hadith (English) | fawazahmed0/hadith-api edition `eng-bukhari` | **Unlicense (public domain)** |
| `muslim.json` | Sahih Muslim, 7,563 hadith (English) | fawazahmed0/hadith-api edition `eng-muslim` | **Unlicense (public domain)** |

Fetched from the free, no-account CDN of
[fawazahmed0/hadith-api](https://github.com/fawazahmed0/hadith-api)
(released under the **Unlicense**):

```bash
node -e "const https=require('https');const fs=require('fs');const f=n=>https.get('https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/'+n+'.json',r=>{const d=[];r.on('data',c=>d.push(c));r.on('end',()=>fs.writeFileSync('data/hadith/'+n+'.json',Buffer.concat(d)))});f('eng-bukhari');f('eng-muslim');"
```

`lib/hadith.ts` builds an in-memory index (15k+ entries) and searches it by keyword with a
Roman-Urdu → English synonym dictionary, so queries like "sabr" or "roza" work. Hadith are
only ever used to *cite* real entries from the bundled dataset — never generated.

## Word-by-word data

Regenerate with:

```bash
node scripts/build-words-qurancom.mjs   # Quran.com API (fast, resumable)
# or
node scripts/build-words.mjs            # Buraaq/quran-md-words (HuggingFace rows API)
```

The scripts validate the full key set (6,236 ayahs, zero gaps) before writing.
Quran.com's word data is the active source (83,665 words); Quran-MD is kept as a
secondary builder. Ayah-number tokens (e.g. "(1)") are filtered in the UI, never
from the data.

## Optional services (require your own accounts)

| Feature | Provider | Env vars |
| --- | --- | --- |
| AI discovery (`/api/discover`) | Any OpenAI-compatible API | `AI_API_KEY`, optional `AI_BASE_URL`, `AI_MODEL` |
| AI Q&A (`/api/ask`) | Any OpenAI-compatible API | same as above |
| Cloud sync (planned) | Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Bounded AI rule: `/api/discover` only *ranks ayah references* that already exist
in the canonical dataset, and `/api/ask` answers questions with citations from the
canonical Quran dataset and the bundled hadith. Neither endpoint ever generates or
modifies Quranic or hadith text, and every citation is re-validated before it is
returned to the client.