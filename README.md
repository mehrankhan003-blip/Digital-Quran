# Digital Quran (codename: NOOR)

> **The most beautiful, accessible and thoughtful way to read, listen to and understand the Quran.**

A Vercel-first, mobile-first, installable PWA: Quran reading with ayah-by-ayah recitation,
translations and verse-accurate navigation across every screen.

## Stack

- **Next.js 15** (App Router) · TypeScript · Tailwind CSS
- Static generation for the whole Quran (151 pre-rendered pages), tiny client bundles (~110 kB first load)
- Installable PWA with offline caching (`public/sw.js`)
- Dark / light themes, persisted preferences, RTL Arabic typography

## What works today

- **Complete canonical Quran** — all 114 Surahs · 6,236 Ayahs of Uthmani Arabic, validated
  against Tanzil-based data (AlQuran.cloud). Full Surah count / ayah-count / ordering checks
  run in `scripts/build-data.mjs`.
- **Translations** — Urdu (Fateh Muhammad Jalandhry) and English (Saheeh International),
  switchable: Arabic-only · Urdu · English · Show All.
- **Recitation** — 7 reciters, ayah-by-ayah playback from the public `everyayah.com` CDN,
  with play/pause, next/prev, repeat-ayah, repeat-section, playback speed, current-ayah
  highlight and auto-scroll.
- **Navigation** — Surah index, Juz (30), Hizb (60) and Manzil (7) browsing + full-surah
  and full-juz reading views. Sajdah markers on every prostration ayah.
- **Smart search** — Arabic (diacritic-insensitive), Urdu, English, plus a Roman→Arabic
  transliteration dictionary so `sabr`, `patience` and `صبر` all find relevant ayahs.
- **Roman Urdu translation** — the full Abul Ala Maududi Roman Urdu translation
  (public domain via fawazahmed0/quran-api, Unlicense) as a first-class reading lane.
- **Word-by-word** — tap "Word by Word" in the reader to see every word of the current
  ayah with its English meaning and transliteration (83,665 words from Quran.com).
- **Personal journey** — bookmarks, per-ayah notes, reading history, an automatic
  "Continue reading" position, and manual backup/restore, all stored on-device.
- **Khatmah planner** — set a daily page goal or a target completion date; the plan is
  calculated for you and today's pages open exactly where to begin.
- **Hifz (memorization) mode** — tap to reveal one hidden word at a time while the ayah
  repeats, or reveal the full ayah.
- **Focus / Mushaf mode** — distraction-free single-column reading with larger Arabic,
  chrome hidden and one tap back.
- **Preferences** — default translation, reciter, speed, auto-scroll and focus mode
  persisted on-device.
- **Reading position deep-links** — `/quran/2#ayah-2-183` opens Surah Al-Baqarah at ayah 183.

## Roman Urdu status

The full **Abul Ala Maududi Roman Urdu** translation is live in the app as a first-class
lane (`data/quran/roman.json`, all 6,236 ayahs). It comes from the public-domain
fawazahmed0/quran-api (Unlicense) — same source text used by QUL resource #281.
See `docs/DATA_SOURCES.md` for regeneration and provenance.

## Data integrity

- Arabic text is **never** typed by hand or generated. It comes from the canonical
  Uthmani edition (Tanzil distribution) and is validated at build time.
- Surah/ayah counts, juz/hizb/manzil boundaries, sajdah markers and the 83,665-word
  word-by-word dataset are all cross-checked against independent sources.
- Roman Urdu and all translations are verbatim from their sources (Unlicense / Tanzil /
  AlQuran.cloud) and clearly labelled; they are never mixed with the Arabic text.
- Sources and licenses are documented in `docs/DATA_SOURCES.md`.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Rebuild the Quran dataset

```bash
node scripts/build-data.mjs
```

## Roadmap

1. ~~Canonical Quran data layer~~
2. ~~Complete 114-surah navigation + Juz/Hizb/Manzil~~
3. ~~Bookmarks / notes / reading history / continue reading~~
4. ~~Khatmah planner + daily goals~~
5. ~~Hifz (memorization) mode~~
6. ~~Focus ("Quran without distraction") mode + Mushaf mode~~
7. ~~Word-by-word meanings (83,665 words, English + transliteration)~~
8. ~~Roman Urdu translation (Abul Ala Maududi, public domain)~~
9. Auth + cross-device sync (Supabase; manual backup/restore already shipped)
10. Semantic discovery (bounded AI endpoint `/api/discover` shipped; add your key)
11. Accessibility + SEO + full production QA